import {shuffled} from './ui.mjs';

const TYPES = ['discovery','flashcards','single-choice','multiple-choice','matching','sorting','ordering','short-answer','number-answer'];
const own = (o,k) => Object.hasOwn(o,k);
const obj = o => o !== null && typeof o === 'object' && !Array.isArray(o);
const fail = message => { throw new Error(`learningPlan: ${message}`); };
const check = (ok,message) => { if (!ok) fail(message); };
const identifier = x => typeof x === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x);
function fields(o,required,optional=[],path='') {
  check(obj(o),`${path}: oczekiwano obiektu`);
  check(required.every(k=>own(o,k)) && Object.keys(o).every(k=>[...required,...optional].includes(k)),`${path}: brakujące lub nieznane pola`);
}
function array(a,path,minimum=1) { check(Array.isArray(a) && a.length>=minimum,`${path}: niepoprawna lista`); }
function unique(a,path) { check(new Set(a).size===a.length,`${path}: powtórzone wartości`); }
function settings(s,path) {
  if (own(s,'id')) check(identifier(s.id),`${path}.id`);
  if (own(s,'title')) check(typeof s.title==='string' && s.title.trim(),`${path}.title`);
  if (own(s,'types')) { array(s.types,path); unique(s.types,path); check(s.types.every(t=>TYPES.includes(t)),`${path}.types`); }
  if (own(s,'count')) check(Number.isInteger(s.count) && s.count>0,`${path}.count`);
  if (own(s,'hints')) check(typeof s.hints==='boolean',`${path}.hints`);
}
export function learningLessons(topic) {
  if (!own(topic,'learningPlan')) return [];
  const plan=topic.learningPlan;
  return plan.lessons.map(lesson=>({lessonId:lesson.lessonId,title:topic.lessons.find(l=>l.id===lesson.lessonId)?.title,
    extraPractice:lesson.extraPractice ?? plan.defaults.extraPractice,
    slots:lesson.steps.flatMap(step=>{
      const resolved={...plan.steps.find(s=>s.id===step.id),...step};
      return Array.from({length:resolved.count},(_,i)=>({id:`${lesson.lessonId}-${step.id}-${i+1}`,lessonId:lesson.lessonId,stepId:step.id,title:resolved.title,types:[...resolved.types],hints:resolved.hints,taskIds:[...step.taskIds]}));
    })}));
}
export function learningSlots(topic) { return learningLessons(topic).flatMap(l=>l.slots); }

export function validateLearningPlan(topic) {
  if (!own(topic,'learningPlan')) return;
  const p=topic.learningPlan;
  fields(p,['defaults','requiredTypes','steps','lessons']);
  fields(p.defaults,['extraPractice','reviewCount','avoidImmediateRepeat']);
  check(Number.isInteger(p.defaults.extraPractice) && [0,1].includes(p.defaults.extraPractice),'defaults.extraPractice');
  check(Number.isInteger(p.defaults.reviewCount) && p.defaults.reviewCount>0,'defaults.reviewCount');
  check(typeof p.defaults.avoidImmediateRepeat==='boolean','defaults.avoidImmediateRepeat');
  array(p.requiredTypes,'requiredTypes',0); unique(p.requiredTypes,'requiredTypes');
  check(p.requiredTypes.every(t=>TYPES.includes(t)),'requiredTypes');
  array(p.steps,'steps');
  for (const s of p.steps) { fields(s,['id','title','types','count','hints']); settings(s,'steps'); }
  unique(p.steps.map(s=>s.id),'steps');
  array(p.lessons,'lessons');
  p.lessons.forEach(l=>fields(l,['lessonId','steps'],['extraPractice']));
  unique(p.lessons.map(l=>l.lessonId),'lessons');
  const lessons=new Set(topic.lessons.map(l=>l.id)), tasks=new Map(topic.tasks.map(t=>[t.id,t]));
  check(Array.isArray(topic.learningPath),'brak banku learningPath');
  const bank=new Set([...topic.learningPath,...Object.values(topic.learningVariants || {}).flat()]);
  const used=new Set();
  for (const l of p.lessons) {
    fields(l,['lessonId','steps'],['extraPractice']); check(lessons.has(l.lessonId),'lessons.lessonId');
    if (own(l,'extraPractice')) check(Number.isInteger(l.extraPractice) && [0,1].includes(l.extraPractice),'lessons.extraPractice');
    array(l.steps,'lessons.steps');
    l.steps.forEach(s=>fields(s,['id','taskIds'],['title','types','count','hints']));
    unique(l.steps.map(s=>s.id),'lessons.steps');
    for (const s of l.steps) {
      fields(s,['id','taskIds'],['title','types','count','hints']); settings(s,'lessons.steps');
      const template=p.steps.find(t=>t.id===s.id); check(template,'nieznany template');
      const resolved={...template,...s}; array(s.taskIds,'taskIds'); unique(s.taskIds,'taskIds');
      check(s.taskIds.length>=resolved.count,'za mała pula taskIds');
      for (const id of s.taskIds) {
        const task=tasks.get(id);
        check(bank.has(id) && task && task.lessonIds.includes(l.lessonId) && resolved.types.includes(task.type),`niepoprawne taskIds ${id}`);
        check(!used.has(id),`taskIds ${id} należy do różnych kroków`); used.add(id);
      }
    }
  }
  check(p.lessons.length===lessons.size,'niepełne pokrycie lessons');
  const slots=learningSlots(topic); unique(slots.map(s=>s.id),'slotIds');
  // Deterministic augmenting paths prove simultaneous required-type coverage.
  const assigned=Array(slots.length).fill(null);
  function place(type,visited) {
    for(let i=0;i<slots.length;i++) {
      if(visited.has(i) || !slots[i].taskIds.some(id=>tasks.get(id).type===type)) continue;
      visited.add(i);
      if(assigned[i]===null || place(assigned[i],visited)) {assigned[i]=type;return true;}
    }
    return false;
  }
  for(const type of p.requiredTypes) check(place(type,new Set()),`requiredTypes: nieosiągalny typ ${type}`);
}

// Integral min-cost flow: distinct-type rewards implement matching before task selection.
// Every task has capacity one, including slots expanded from the same step pool.
function match(slots,tasks,history,avoid,required,reserved,random,fixedTypes=null) {
  // Lexicographic priorities, bounded by this draw's size rather than magic constants:
  // required coverage > total diversity > avoiding immediate repeats > unseen tasks.
  const repeatWeight=slots.length+1;
  const diversityWeight=(slots.length+1)**2+1;
  const requiredWeight=(TYPES.length+1)*diversityWeight;
  const graph=[];
  const node=()=>{graph.push([]);return graph.length-1;};
  const source=node(),sink=node(),typeNodes=new Map(),taskNodes=new Map(),edges=[];
  const add=(a,b,cap,cost)=>{
    const edge={to:b,cap,cost,rev:graph[b].length};
    graph[a].push(edge);graph[b].push({to:a,cap:0,cost:-cost,rev:graph[a].length-1});return edge;
  };
  for(const type of shuffled(TYPES,random)) {
    const n=node();typeNodes.set(type,n);
    add(source,n,1,required.includes(type)?-requiredWeight:reserved.includes(type)?0:-diversityWeight);
    add(source,n,slots.length,0);
  }
  for(const id of shuffled([...new Set(slots.flatMap(s=>s.taskIds))],random)) {
    const n=node();taskNodes.set(id,n);add(typeNodes.get(tasks.get(id).type),n,1,0);
  }
  for(const [i,slot] of slots.entries()) {
    const n=node();add(n,sink,1,0);
    const raw=obj(history) && own(history,slot.id) && Array.isArray(history[slot.id])?history[slot.id]:[];
    const visited=[...new Set(raw.filter(id=>slot.taskIds.includes(id)))];
    for(const id of shuffled(slot.taskIds,random)) {
      if(fixedTypes && tasks.get(id).type!==fixedTypes[i]) continue;
      const cost=Number(visited.includes(id))+(avoid && visited.at(-1)===id?repeatWeight:0);
      edges.push({i,id,edge:add(taskNodes.get(id),n,1,cost)});
    }
  }
  for(let flow=0;flow<slots.length;flow++) {
    const dist=Array(graph.length).fill(Infinity),prev=Array(graph.length),queue=[source],queued=new Set(queue);dist[source]=0;
    for(let q=0;q<queue.length;q++) {
      const u=queue[q];queued.delete(u);
      for(const [j,e] of graph[u].entries()) if(e.cap>0 && dist[e.to]>dist[u]+e.cost) {
        dist[e.to]=dist[u]+e.cost;prev[e.to]=[u,j];
        if(!queued.has(e.to)){queued.add(e.to);queue.push(e.to);}
      }
    }
    check(Number.isFinite(dist[sink]),'niemożliwy dobór zadań');
    for(let v=sink;v!==source;) {const [u,j]=prev[v],e=graph[u][j];e.cap--;graph[v][e.rev].cap++;v=u;}
  }
  const result=Array(slots.length);
  for(const {i,id,edge} of edges) if(edge.cap===0) result[i]=id;
  return result;
}
export function drawPlanLearning(topic,slotIds,history={},random=Math.random,reservedTypes=[],reservedTaskIds=[],options={}) {
  validateLearningPlan(topic); check(own(topic,'learningPlan'),'brak planu');
  array(slotIds,'slotIds',0);unique(slotIds,'slotIds');
  check(Array.isArray(reservedTypes) && reservedTypes.every(t=>TYPES.includes(t)),'reservedTypes');
  array(reservedTaskIds,'reservedTaskIds',0); unique(reservedTaskIds,'reservedTaskIds');
  fields(options,[],['requiredTypes','allowedTypes'],'draw options');
  for(const key of ['requiredTypes','allowedTypes']) if(own(options,key)) {
    array(options[key],key,key==='requiredTypes'?0:1); unique(options[key],key);
    check(options[key].every(type=>TYPES.includes(type)),key);
  }
  const all=learningSlots(topic),byId=new Map(all.map(s=>[s.id,s]));
  check(slotIds.every(id=>byId.has(id)),'nieznany slotId');
  const tasks=new Map(topic.tasks.map(t=>[t.id,t]));
  check(reservedTaskIds.every(id=>tasks.has(id)),'reservedTaskIds');
  const held=new Set(reservedTaskIds);
  const allowed=options.allowedTypes || TYPES;
  const slots=slotIds.map(id=>({...byId.get(id),taskIds:byId.get(id).taskIds.filter(taskId=>!held.has(taskId) && allowed.includes(tasks.get(taskId).type))}));
  const full=slotIds.length===all.length;
  const required=options.requiredTypes ?? (full?topic.learningPlan.requiredTypes:[]);
  const avoid=topic.learningPlan.defaults.avoidImmediateRepeat;
  const types=match(slots,tasks,history,avoid,required,reservedTypes,random).map(id=>tasks.get(id).type);
  check(required.every(t=>types.includes(t)),'requiredTypes: niemożliwy dobór');
  const choices=match(slots,tasks,history,avoid,[],[],random,types);
  const selected={},seen={};
  slots.forEach((slot,i)=>{
    const raw=obj(history) && own(history,slot.id) && Array.isArray(history[slot.id])?history[slot.id]:[];
    const visited=[...new Set(raw.filter(id=>slot.taskIds.includes(id)))];
    const compatible=slot.taskIds.filter(id=>tasks.get(id).type===types[i]);
    const exhausted=compatible.every(id=>visited.includes(id));
    selected[slot.id]=choices[i];
    seen[slot.id]=[...(exhausted?visited.filter(id=>!compatible.includes(id)):visited).filter(id=>id!==choices[i]),choices[i]];
  });
  return {selected,seen};
}
