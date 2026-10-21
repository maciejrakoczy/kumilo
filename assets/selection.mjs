import {shuffled} from './ui.mjs';

export function testSummary(topic, definition) {
  const questions = definition.questions;
  if (!definition.draw) return {count: questions.length, maxPoints: questions.reduce((sum, q) => sum + q.points, 0), bankSize: questions.length};
  const tasks = new Map(topic.tasks.map(task => [task.id, task]));
  return {
    count: definition.draw.reduce((sum, group) => sum + group.count, 0),
    maxPoints: definition.draw.reduce((sum, group) => sum + group.count * questions.find(q => tasks.get(q.taskId).lessonIds.includes(group.lessonId)).points, 0),
    bankSize: questions.length,
  };
}

// Keep topic coverage and avoid the previous submitted set whenever capacity permits.
export function drawTest(topic, definition, previousIds = [], random = Math.random) {
  const tasks = new Map(topic.tasks.map(task => [task.id, task])), previous = new Set(previousIds);
  let questions;
  if (definition.draw) {
    const slots = definition.draw.flatMap(group => {
      const pool = definition.questions.filter(q => tasks.get(q.taskId).lessonIds.includes(group.lessonId));
      if (pool.length < group.count) throw new Error(`Za mało pytań w puli ${group.lessonId}.`);
      return Array(group.count).fill(pool);
    });
    const typeOf = question => tasks.get(question.taskId).type;
    const freshPools = new Map(slots.map(pool => [pool, pool.filter(q => !previous.has(q.taskId))]));
    const freshSlots = slots.map(pool => freshPools.get(pool).length >= slots.filter(other => other === pool).length ? freshPools.get(pool) : pool);
    let pools = freshSlots, types = allocateTypes(pools, typeOf, random);
    const allTypes = allocateTypes(slots, typeOf, random);
    if (new Set(types).size < new Set(allTypes).size) { pools = slots; types = allTypes; }
    const used = new Set();
    questions = pools.map((pool, index) => {
      const candidates = shuffled(pool.filter(q => typeOf(q) === types[index] && !used.has(q.taskId)), random);
      candidates.sort((a, b) => Number(previous.has(a.taskId)) - Number(previous.has(b.taskId)));
      const choice = candidates[0];
      used.add(choice.taskId);
      return choice;
    });
  } else questions = [...definition.questions];
  return {...definition, questions: definition.shuffleQuestions ? shuffled(questions, random) : questions};
}

// Match distinct types to compatible slots before filling any remaining slots.
// Augmenting paths avoid greedy choices that could strand a rare type.
function allocateTypes(pools, typeOf, random, reserved = []) {
  const assigned = Array(pools.length).fill(null);
  const types = shuffled([...new Set(pools.flat().map(typeOf))].filter(type => !reserved.includes(type)), random);
  function place(type, visited) {
    for (const index of shuffled(pools.map((_, i) => i), random)) {
      if (visited.has(index) || !pools[index].some(item => typeOf(item) === type)) continue;
      visited.add(index);
      if (assigned[index] === null || place(assigned[index], visited)) {
        assigned[index] = type;
        return true;
      }
    }
    return false;
  }
  for (const type of types) place(type, new Set());
  const counts = new Map();
  for (const type of [...reserved, ...assigned.filter(type => type !== null)]) counts.set(type, (counts.get(type) || 0) + 1);
  for (let i = 0; i < pools.length; i++) {
    if (assigned[i] !== null) continue;
    const choices = shuffled([...new Set(pools[i].map(typeOf))].filter(type => {
      const occupied = assigned.filter((other, index) => pools[index] === pools[i] && other === type).length;
      return occupied < pools[i].filter(item => typeOf(item) === type).length;
    }), random);
    choices.sort((a, b) => (counts.get(a) || 0) - (counts.get(b) || 0));
    assigned[i] = choices[0];
    counts.set(assigned[i], (counts.get(assigned[i]) || 0) + 1);
  }
  return assigned;
}

// An anchor is a progress/reward milestone; its displayed activity can vary by run.
export function drawLearning(topic, anchors, history = {}, random = Math.random, reservedTypes = []) {
  const tasks = new Map(topic.tasks.map(task => [task.id, task]));
  const pools = anchors.map(anchor => [anchor, ...(topic.learningVariants && Object.hasOwn(topic.learningVariants, anchor) ? topic.learningVariants[anchor] : [])]);
  const typeOf = id => tasks.get(id).type;
  const alternatives = pools.map((pool, index) => {
    const raw = Object.hasOwn(history, anchors[index]) ? history[anchors[index]] : null;
    const last = Array.isArray(raw) ? raw.at(-1) : null;
    return pool.length > 1 ? pool.filter(id => id !== last) : pool;
  });
  let types = allocateTypes(alternatives, typeOf, random, reservedTypes);
  const allTypes = allocateTypes(pools, typeOf, random, reservedTypes);
  if (new Set([...reservedTypes, ...types]).size < new Set([...reservedTypes, ...allTypes]).size) types = allTypes;
  const selected = [], seen = [];
  for (const [index, anchor] of anchors.entries()) {
    const pool = pools[index];
    const raw = Object.hasOwn(history, anchor) && Array.isArray(history[anchor]) ? history[anchor] : [];
    const visited = [...new Set(raw.filter(id => pool.includes(id)))];
    const compatible = pool.filter(id => typeOf(id) === types[index]);
    const fresh = compatible.filter(id => !visited.includes(id));
    const candidates = fresh.length ? fresh : compatible.filter(id => id !== visited.at(-1) || compatible.length === 1);
    const choice = shuffled(candidates, random)[0];
    selected.push([anchor, choice]);
    seen.push([anchor, [...(fresh.length ? visited : visited.filter(id => !compatible.includes(id))), choice]]);
  }
  return {selected: Object.fromEntries(selected), seen: Object.fromEntries(seen)};
}
