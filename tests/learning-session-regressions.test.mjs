import test from 'node:test';
import assert from 'node:assert/strict';
import {createProgressStore} from '../assets/core.mjs';
import {startLearningSession, completeLearningEntry, markLearningSeen, mixedLearningReview} from '../assets/learning-session.mjs';

function fixture(groups) {
  const tasks = groups.flatMap((types, i) => types.map((type, j) => ({id: `task-${i}-${j}`, type, lessonIds: [`lesson-${i}`]})));
  return {lessons: groups.map((_, i) => ({id: `lesson-${i}`, title: `Temat ${i}`})), tasks, learningPath: tasks.map(task => task.id), learningPlan: {
    defaults: {extraPractice: 1, reviewCount: 7, avoidImmediateRepeat: true}, requiredTypes: [],
    steps: [{id: 'step', title: 'Krok', types: [...new Set(tasks.map(task => task.type))], count: 1, hints: false}],
    lessons: groups.map((_, i) => ({lessonId: `lesson-${i}`, steps: [{id: 'step', taskIds: tasks.filter(task => task.lessonIds[0] === `lesson-${i}`).map(task => task.id)}]})),
  }};
}
const restore = (topic, progress) => createProgressStore({getItem: () => JSON.stringify({topic: progress}), setItem() {}, removeItem() {}}).read('topic', topic);

test('mixed review selects scored candidates from a mixed pool without exceeding their capacity', () => {
  for (const count of [1, 2]) {
    const topic = fixture([['single-choice', 'discovery']]), progress = {};
    topic.learningPlan.requiredTypes = ['discovery'];
    topic.learningPlan.lessons[0].steps[0].count = count;
    startLearningSession(topic, progress, {lessonId: 'lesson-0', random: () => 0.3});
    const before = structuredClone(progress);
    const entries = mixedLearningReview(topic, progress.learning, null, () => 0.3);
    assert.equal(entries.length, 1);
    assert.equal(topic.tasks.find(task => task.id === entries[0].taskId).type, 'single-choice');
    assert.deepEqual(progress, before);
  }
});

test('a topic replay retains required formats, even when another new format is available', () => {
  const topic = fixture([['number-answer', 'short-answer', 'single-choice'], ['single-choice']]), progress = {};
  topic.learningPlan.requiredTypes = ['number-answer'];
  const session = startLearningSession(topic, progress, {lessonId: 'lesson-0', random: () => 0.3});
  markLearningSeen(topic, progress.learning, session.entries[0]);
  startLearningSession(topic, progress, {lessonId: 'lesson-0', replay: true, random: () => 0.3});
  const types = Object.values(progress.learning.selected).map(id => topic.tasks.find(task => task.id === id).type);
  assert.ok(types.includes('number-answer'));
});

test('increasing count reserves the saved extra example when filling the new slot', () => {
  const topic = fixture([['single-choice', 'single-choice', 'single-choice']]), progress = {};
  const session = startLearningSession(topic, progress, {lessonId: 'lesson-0', random: () => 0.3});
  completeLearningEntry(topic, progress.learning, session.entries[0], true, () => 0.3);
  const extraId = progress.learning.extraPractice[session.entries[0].slotId].taskId;
  topic.learningPlan.lessons[0].steps[0].count = 2;
  const saved = restore(topic, progress);
  const resumed = startLearningSession(topic, saved, {lessonId: 'lesson-0', random: () => 0});
  assert.ok(resumed.entries.some(entry => entry.extra && entry.taskId === extraId));
  assert.equal(new Set(resumed.entries.map(entry => entry.taskId)).size, resumed.entries.length);
});
