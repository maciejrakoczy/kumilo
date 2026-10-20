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
  const questions = definition.draw ? definition.draw.flatMap(group => {
    const pool = definition.questions.filter(q => tasks.get(q.taskId).lessonIds.includes(group.lessonId));
    if (pool.length < group.count) throw new Error(`Za mało pytań w puli ${group.lessonId}.`);
    return [...shuffled(pool.filter(q => !previous.has(q.taskId)), random), ...shuffled(pool.filter(q => previous.has(q.taskId)), random)].slice(0, group.count);
  }) : [...definition.questions];
  return {...definition, questions: definition.shuffleQuestions ? shuffled(questions, random) : questions};
}

// An anchor is a progress/reward milestone; its displayed activity can vary by run.
export function drawLearning(topic, anchors, history = {}, random = Math.random) {
  const selected = [], seen = [];
  for (const anchor of anchors) {
    const variants = topic.learningVariants && Object.hasOwn(topic.learningVariants, anchor) ? topic.learningVariants[anchor] : [];
    const pool = [anchor, ...variants];
    const raw = Object.hasOwn(history, anchor) && Array.isArray(history[anchor]) ? history[anchor] : [];
    const visited = [...new Set(raw.filter(id => pool.includes(id)))];
    const fresh = pool.filter(id => !visited.includes(id));
    const candidates = fresh.length ? fresh : pool.filter(id => id !== visited.at(-1) || pool.length === 1);
    const choice = shuffled(candidates, random)[0];
    selected.push([anchor, choice]);
    seen.push([anchor, [...(fresh.length ? visited : []), choice]]);
  }
  return {selected: Object.fromEntries(selected), seen: Object.fromEntries(seen)};
}
