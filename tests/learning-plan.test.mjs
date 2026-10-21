import test from 'node:test';
import assert from 'node:assert/strict';
import {learningLessons, learningSlots, validateLearningPlan, drawPlanLearning} from '../assets/learning-plan.mjs';
import {createProgressStore} from '../assets/core.mjs';
function fixture() {
  return {lessons:[{id:'lesson',title:'Lekcja'}], tasks:[['a','single-choice'],['b','number-answer'],['c','single-choice']].map(([id,type])=>({id,type,lessonIds:['lesson']})), learningPath:['a','b','c'], learningPlan:{defaults:{extraPractice:1,reviewCount:2,avoidImmediateRepeat:true},requiredTypes:['single-choice','number-answer'],steps:[{id:'step',title:'Krok',types:['single-choice','number-answer'],count:2,hints:true}],lessons:[{lessonId:'lesson',steps:[{id:'step',taskIds:['a','b','c']}]}]}};
}
test('resolves stable slots, overrides and no-plan without mutation',()=>{
 const t=fixture(), before=structuredClone(t); validateLearningPlan(t);
 assert.deepEqual(learningSlots(t).map(s=>s.id),['lesson-step-1','lesson-step-2']);
 assert.equal(learningLessons(t)[0].extraPractice,1); assert.deepEqual(t,before);
 assert.deepEqual(learningLessons({}),[]);
 t.learningPlan.lessons[0].steps[0].count=1; t.learningPlan.lessons[0].steps[0].title='Inny';
 assert.equal(learningSlots(t)[0].title,'Inny'); assert.throws(()=>validateLearningPlan(t),/learningPlan/);
});
test('rejects malformed and unreachable contracts',()=>{
 for(const change of [t=>t.learningPlan.bad=1,t=>t.learningPlan.defaults.extraPractice=true,t=>t.learningPlan.lessons=[],t=>t.learningPlan.steps[0].taskIds=['a'],t=>t.learningPlan.lessons[0].steps[0].taskIds=['a','a'],t=>t.learningPlan.lessons[0].steps[0].id='missing',t=>t.learningPlan.requiredTypes.push('discovery')]) {
  const t=fixture(); change(t); assert.throws(()=>validateLearningPlan(t),/learningPlan/);
 }
});
test('draw matches required types, unique shared pool, history and explicit errors',()=>{
 const t=fixture(), ids=learningSlots(t).map(s=>s.id);
 for(let i=0;i<30;i++) {const d=drawPlanLearning(t,ids); assert.equal(new Set(Object.values(d.selected)).size,2); assert.ok(Object.values(d.selected).includes('b'));}
 const d=drawPlanLearning(t,[ids[0]],{[ids[0]]:['a']},()=>0);
 assert.notEqual(d.selected[ids[0]],'a');
 assert.throws(()=>drawPlanLearning(t,['missing']),/learningPlan/);
 assert.throws(()=>drawPlanLearning(t,[ids[0],ids[0]]),/learningPlan/);
});
test('progress preserves legacy but never promotes it to slot completion',()=>{
 const t=fixture(), key='lesson-step-1';
 const raw={completedTaskIds:['a'],learning:{completedSlotIds:[key,'old',key],selected:{[key]:'a'},seen:{[key]:['a','bad','a']},activeLessonId:'lesson',lastSlotId:key,extraPractice:{[key]:{taskId:'c',done:false,unsafe:1}}}};
 const storage={getItem:()=>JSON.stringify({x:raw}),setItem(){},removeItem(){}};
 const p=createProgressStore(storage).read('x',t);
 assert.deepEqual(p.completedTaskIds,['a']); assert.deepEqual(p.learning.completedSlotIds,[key]);
 assert.deepEqual(p.learning.extraPractice[key],{taskId:'c',done:false});
 assert.deepEqual(createProgressStore(null).read('x',t).learning.completedSlotIds,[]);
 assert.deepEqual(p.learning.seen[key],['a']);
});
test('type rollover preserves other-type history and never mutates caller history',()=>{
 const t=fixture(), id='lesson-step-1'; t.learningPlan.requiredTypes=[];
 const history={[id]:['b','a','c']}, before=structuredClone(history);
 const d=drawPlanLearning(t,[id],history,()=>0,['number-answer']);
 assert.equal(t.tasks.find(task=>task.id===d.selected[id]).type,'single-choice');
 assert.deepEqual(d.seen[id],['b',d.selected[id]]);
 assert.notEqual(d.selected[id],'c'); assert.deepEqual(history,before);
});
test('shared type capacities and immediate-repeat avoidance use matching, not greedy draw',()=>{
 const t=fixture(); t.learningPlan.requiredTypes=[];
 t.learningPlan.steps[0].types=['single-choice'];
 t.learningPlan.lessons[0].steps[0].taskIds=['a','c'];
 const ids=learningSlots(t).map(s=>s.id), history={[ids[0]]:['a'],[ids[1]]:['c']};
 const d=drawPlanLearning(t,ids,history,()=>0);
 assert.equal(d.selected[ids[0]],'c'); assert.equal(d.selected[ids[1]],'a');
 t.learningPlan.steps[0].count=3;
 assert.throws(()=>drawPlanLearning(t,ids),/learningPlan/);
});
test('matching reserves the only compatible slot for a rare required type',()=>{
 const t=fixture();
 t.learningPlan.steps[0].count=1;
 t.learningPlan.steps.push({id:'other',title:'Drugi',types:['single-choice'],count:1,hints:false});
 t.learningPlan.lessons[0].steps=[{id:'step',taskIds:['a','b']},{id:'other',taskIds:['c']}];
 const ids=learningSlots(t).map(s=>s.id);
 for(const random of [()=>0,()=>0.5,()=>0.999]) {
  const d=drawPlanLearning(t,ids,{},random);
  assert.equal(d.selected[ids[0]],'b'); assert.equal(d.selected[ids[1]],'c');
 }
});
test('malformed nested records report learningPlan and progress rejects invalid extra examples',()=>{
 for(const change of [t=>t.learningPlan.lessons=[null],t=>t.learningPlan.lessons[0].steps=[null],t=>t.learningPlan.steps=[null]]) {
  const t=fixture();change(t);assert.throws(()=>validateLearningPlan(t),/learningPlan/);
 }
 const t=fixture(), slot='lesson-step-1';
 for(const extra of [{taskId:'a',done:false},{taskId:'c',done:'false'},{taskId:'bad',done:true}]) {
  const storage={getItem:()=>JSON.stringify({x:{learning:{selected:{[slot]:'a'},extraPractice:{[slot]:extra}}}}),setItem(){},removeItem(){}};
  assert.deepEqual(createProgressStore(storage).read('x',t).learning.extraPractice,{});
 }
});
