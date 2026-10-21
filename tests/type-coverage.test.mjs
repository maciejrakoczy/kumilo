import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {drawLearning, drawTest} from '../assets/selection.mjs';

const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const tasks = new Map(topic.tasks.map(task => [task.id, task]));
const seed = value => () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296);

test('type guarantees do not depend on favorable random values', () => {
  for (const value of [0, 0.5, 0.999999]) {
    const random = () => value;
    const learning = drawLearning(topic, topic.learningPath, {}, random);
    assert.equal(new Set(Object.values(learning.selected).map(id => tasks.get(id).type)).size, 9);
    const exam = drawTest(topic, topic.tests[0], [], random);
    assert.equal(new Set(exam.questions.map(question => tasks.get(question.taskId).type)).size, 7);
  }
});

test('exams guarantee seven types while retaining quotas and avoiding previous questions', () => {
  let previous = [];
  for (let i = 1; i <= 500; i++) {
    const attempt = drawTest(topic, topic.tests[0], previous, seed(i));
    const ids = attempt.questions.map(question => question.taskId);
    assert.equal(new Set(ids.map(id => tasks.get(id).type)).size, 7);
    assert.equal(new Set(ids).size, 16);
    assert.ok(ids.every(id => !previous.includes(id)));
    for (const group of topic.tests[0].draw) {
      assert.equal(ids.filter(id => tasks.get(id).lessonIds.includes(group.lessonId)).length, group.count);
    }
    previous = ids;
  }
});

test('full expeditions guarantee all nine types and preserve lesson coverage', () => {
  let history = {}, previous = {};
  for (let i = 1; i <= 500; i++) {
    const next = drawLearning(topic, topic.learningPath, history, seed(i));
    const selected = Object.values(next.selected).map(id => tasks.get(id));
    assert.equal(new Set(selected.map(task => task.type)).size, 9);
    assert.equal(new Set(selected.flatMap(task => task.lessonIds)).size, 7);
    for (const [anchor, id] of Object.entries(next.selected)) {
      assert.deepEqual(tasks.get(id).lessonIds, tasks.get(anchor).lessonIds);
      assert.notEqual(id, previous[anchor]);
    }
    history = next.seen; previous = next.selected;
  }
});
