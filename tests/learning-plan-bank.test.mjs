import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateTopic} from '../assets/core.mjs';
import {learningSlots, learningLessons, drawPlanLearning} from '../assets/learning-plan.mjs';
import {startLearningSession, markLearningSeen} from '../assets/learning-session.mjs';

const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const tasks = new Map(topic.tasks.map(task => [task.id, task]));

test('the real topic configures seven six-activity learning expeditions', () => {
  assert.ok(topic.learningPlan, 'Real bank must configure the new learning organization');
  validateTopic(topic);
  assert.equal(learningLessons(topic).length, 7);
  assert.equal(learningSlots(topic).length, 42);
  for (const lesson of learningLessons(topic)) assert.equal(lesson.slots.length, 6);
  const pool = learningSlots(topic).flatMap(slot => slot.taskIds);
  const bank = [...topic.learningPath, ...Object.values(topic.learningVariants).flat()];
  assert.equal(new Set(pool).size, pool.length, 'A candidate belongs to more than one step');
  assert.deepEqual([...pool].sort(), bank.sort(), 'The plan must retain the whole learning bank');
  for (const slot of learningSlots(topic)) {
    if (slot.taskIds.every(id => !['discovery', 'flashcards'].includes(tasks.get(id).type))) assert.ok(slot.taskIds.length >= 2, `Missing a different extra example for ${slot.id}`);
  }
});

test('real planned courses are unique, in-scope and cover all nine formats', () => {
  const slots = learningSlots(topic);
  for (let i = 0; i < 50; i++) {
    const {selected} = drawPlanLearning(topic, slots.map(slot => slot.id));
    assert.equal(new Set(Object.values(selected)).size, slots.length);
    const types = new Set();
    for (const slot of slots) {
      const task = tasks.get(selected[slot.id]);
      assert.ok(slot.taskIds.includes(task.id));
      assert.ok(task.lessonIds.includes(slot.lessonId));
      assert.ok(slot.types.includes(task.type));
      types.add(task.type);
    }
    assert.equal(types.size, 9);
  }
});

test('topic replays retain other choices and preserve diversity across the whole course', () => {
  const progress = {}, lessons = learningLessons(topic), slots = learningSlots(topic);
  startLearningSession(topic, progress, {lessonId: lessons[0].lessonId});
  for (const slot of slots) markLearningSeen(topic, progress.learning, {...slot, slotId: slot.id, taskId: progress.learning.selected[slot.id]});
  for (const lesson of lessons) {
    const before = {...progress.learning.selected};
    startLearningSession(topic, progress, {lessonId: lesson.lessonId, replay: true});
    for (const slot of slots.filter(slot => slot.lessonId !== lesson.lessonId)) assert.equal(progress.learning.selected[slot.id], before[slot.id]);
    assert.equal(new Set(Object.values(progress.learning.selected).map(id => tasks.get(id).type)).size, 9);
  }
});
