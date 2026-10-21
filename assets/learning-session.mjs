import {learningLessons, learningSlots, drawPlanLearning} from './learning-plan.mjs';
import {shuffled} from './ui.mjs';

const scored = task => !['discovery', 'flashcards'].includes(task.type);
const emptyLearning = () => ({completedSlotIds: [], selected: {}, seen: {}, activeLessonId: null, lastSlotId: null, extraPractice: {}, cursors: {}});

export function learningEntries(topic, learning, lessonId) {
  const lesson = learningLessons(topic).find(item => item.lessonId === lessonId);
  if (!lesson) throw new Error('Nieznany temat wyprawy.');
  return lesson.slots.flatMap(slot => {
    const entry = {...slot, slotId: slot.id, taskId: learning.selected[slot.id], extra: false, review: false};
    const extra = learning.extraPractice[slot.id];
    return extra ? [entry, {...entry, id: `extra:${slot.id}`, taskId: extra.taskId, extra: true, title: 'Jeszcze jeden trop'}] : [entry];
  });
}

export function startLearningSession(topic, progress, {lessonId, replay = false, random = Math.random} = {}) {
  const learning = progress.learning ||= emptyLearning();
  const lessons = learningLessons(topic), lesson = lessons.find(item => item.lessonId === lessonId);
  if (!lesson) throw new Error('Nieznany temat wyprawy.');
  learning.cursors ||= {};
  const active = lessons.find(item => item.lessonId === learning.activeLessonId);
  if (active && (learning.lastSlotId === null || active.slots.some(slot => slot.id === learning.lastSlotId))) learning.cursors[active.lessonId] = learning.lastSlotId;
  const slots = learningSlots(topic);
  const missing = slots.filter(slot => !Object.hasOwn(learning.selected, slot.id) || replay && slot.lessonId === lessonId);
  const retainedIds = slots.filter(slot => !missing.includes(slot)).map(slot => learning.selected[slot.id]);
  const retained = retainedIds.map(id => topic.tasks.find(task => task.id === id).type);
  const extraIds = slots.filter(slot => !(replay && slot.lessonId === lessonId)).flatMap(slot => learning.extraPractice[slot.id] ? [learning.extraPractice[slot.id].taskId] : []);
  const reserved = [...new Set([...retainedIds, ...extraIds])];
  const requiredTypes = topic.learningPlan.requiredTypes.filter(type => !retained.includes(type));
  const drawn = drawPlanLearning(topic, missing.map(slot => slot.id), learning.seen, random, retained, reserved, {requiredTypes});
  Object.assign(learning.selected, drawn.selected);
  if (replay) for (const slot of lesson.slots) delete learning.extraPractice[slot.id];
  const entries = learningEntries(topic, learning, lessonId);
  let position;
  const cursor = Object.hasOwn(learning.cursors, lessonId) ? learning.cursors[lessonId] : null;
  if (!replay && cursor) {
    position = entries.findIndex(entry => entry.slotId === cursor);
    const extra = learning.extraPractice[cursor];
    if (position >= 0 && extra && !extra.done) position++;
  } else position = replay ? 0 : entries.findIndex(entry => entry.extra ? !learning.extraPractice[entry.slotId].done : !learning.completedSlotIds.includes(entry.slotId));
  learning.activeLessonId = lessonId;
  learning.lastSlotId = position >= 0 ? entries[position].slotId : null;
  learning.cursors[lessonId] = learning.lastSlotId;
  return {entries, position, lessonId};
}

export function markLearningSeen(topic, learning, entry) {
  const history = learning.seen[entry.slotId] || [];
  if (history.at(-1) === entry.taskId) return;
  const task = topic.tasks.find(item => item.id === entry.taskId);
  const byId = new Map(topic.tasks.map(item => [item.id, item]));
  learning.seen[entry.slotId] = [...(history.includes(entry.taskId) ? history.filter(id => byId.get(id)?.type !== task.type) : history), entry.taskId];
}

export function completeLearningEntry(topic, learning, entry, hadMistake, random = Math.random) {
  if (entry.review) return;
  if (entry.extra) {
    learning.extraPractice[entry.slotId].done = true;
    return;
  }
  if (!learning.completedSlotIds.includes(entry.slotId)) learning.completedSlotIds.push(entry.slotId);
  const lesson = learningLessons(topic).find(item => item.lessonId === entry.lessonId);
  if (!hadMistake || !lesson.extraPractice || learning.extraPractice[entry.slotId]) return;
  const history = learning.seen[entry.slotId] || [];
  const used = new Set(lesson.slots.map(slot => learning.selected[slot.id]));
  for (const slot of lesson.slots) if (learning.extraPractice[slot.id]) used.add(learning.extraPractice[slot.id].taskId);
  const candidates = shuffled(entry.taskIds.map(id => topic.tasks.find(task => task.id === id)).filter(task => scored(task) && !used.has(task.id)), random);
  candidates.sort((a, b) => Number(history.includes(a.id)) - Number(history.includes(b.id)));
  if (candidates.length) learning.extraPractice[entry.slotId] = {taskId: candidates[0].id, done: false};
}

export function mixedLearningReview(topic, learning, lessonIds = null, random = Math.random) {
  const byId = new Map(topic.tasks.map(task => [task.id, task]));
  const groups = shuffled(learningLessons(topic).filter(lesson => !lessonIds || lessonIds.includes(lesson.lessonId)), random)
    .map(lesson => {
      const counts = new Map();
      const slots = lesson.slots.filter(slot => {
        const capacity = slot.taskIds.filter(id => scored(byId.get(id))).length;
        const used = counts.get(slot.stepId) || 0;
        if (used >= capacity) return false;
        counts.set(slot.stepId, used + 1);
        return true;
      });
      return shuffled(slots, random);
    });
  const chosen = [];
  while (chosen.length < topic.learningPlan.defaults.reviewCount && groups.some(group => group.length)) {
    for (const group of groups) {
      if (chosen.length === topic.learningPlan.defaults.reviewCount) break;
      if (group.length) chosen.push(group.shift());
    }
  }
  if (!chosen.length) return [];
  const allowedTypes = [...new Set(topic.tasks.filter(scored).map(task => task.type))];
  const drawn = drawPlanLearning(topic, chosen.map(slot => slot.id), learning.seen, random, [], [], {requiredTypes: [], allowedTypes});
  return chosen.map(slot => ({...slot, slotId: slot.id, taskId: drawn.selected[slot.id], extra: false, review: true, hints: false}));
}
