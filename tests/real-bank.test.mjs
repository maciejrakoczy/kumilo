import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {drawTest, drawLearning, testSummary} from '../assets/selection.mjs';
import {validateTopic} from '../assets/core.mjs';

const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const seed = value => () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296);

test('real bank expands practice and assessment separately, covering all seven lessons', () => {
  validateTopic(topic);
  const practice = new Set(topic.learningPath.flatMap(anchor => [anchor, ...(topic.learningVariants?.[anchor] || [])]));
  const exam = new Set(topic.tests[0].questions.map(q => q.taskId));
  assert.ok(practice.size >= 70); assert.ok(exam.size >= 80);
  assert.ok([...practice].every(id => !exam.has(id)));
  assert.equal(new Set(topic.tests[0].draw.map(g => g.lessonId)).size, topic.lessons.length);
  assert.equal(testSummary(topic, topic.tests[0]).count, 16);
  assert.equal(testSummary(topic, topic.tests[0]).maxPoints, 16);
  assert.equal(practice.size + exam.size, topic.tasks.length);
});

test('500 real attempts retain quotas and avoid all immediately previous questions', () => {
  const definition = topic.tests[0]; let previous = [];
  const seen = new Set();
  for (let i = 1; i <= 500; i++) {
    const attempt = drawTest(topic, definition, previous, seed(i));
    const ids = attempt.questions.map(q => q.taskId);
    assert.equal(ids.length, 16); assert.equal(new Set(ids).size, 16);
    assert.ok(ids.every(id => !previous.includes(id)));
    for (const group of definition.draw) assert.equal(ids.filter(id => topic.tasks.find(t => t.id === id).lessonIds.includes(group.lessonId)).length, group.count);
    ids.forEach(id => seen.add(id)); previous = ids;
  }
  assert.equal(seen.size, definition.questions.length, 'Some bank questions are unreachable');
});

test('all practice variants are reachable, with distinct slot selections on consecutive runs', () => {
  const seen = new Set(); let history = {}, last = {};
  for (let i = 1; i <= 500; i++) {
    const next = drawLearning(topic, topic.learningPath, history, seed(i));
    for (const [anchor, id] of Object.entries(next.selected)) {
      assert.notEqual(id, last[anchor]); seen.add(id);
      assert.ok([anchor, ...topic.learningVariants[anchor]].includes(id));
    }
    history = next.seen; last = next.selected;
  }
  assert.equal(seen.size, topic.learningPath.length + Object.values(topic.learningVariants).flat().length);
});
