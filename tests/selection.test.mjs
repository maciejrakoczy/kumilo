import test from 'node:test';
import assert from 'node:assert/strict';
import {drawTest, drawLearning, testSummary} from '../assets/selection.mjs';

function fixture() {
  const tasks = ['a', 'b'].flatMap(lesson => Array.from({length: 8}, (_, i) => ({id: `${lesson}-${i}`, lessonIds: [lesson]})));
  return {tasks, learningPath: ['a-0', 'b-0'], learningVariants: {'a-0': ['a-1', 'a-2'], 'b-0': ['b-1']}, tests: [{
    id: 'sample', questions: tasks.map(t => ({taskId: t.id, points: t.lessonIds[0] === 'a' ? 2 : 1})),
    draw: [{lessonId: 'a', count: 2}, {lessonId: 'b', count: 2}], shuffleQuestions: true,
  }]};
}
const fixed = () => 0.37;

test('test selection preserves coverage, weighted points, unique IDs and source bank', () => {
  const topic = fixture(), snapshot = structuredClone(topic), definition = topic.tests[0];
  const attempt = drawTest(topic, definition, [], fixed);
  assert.equal(attempt.questions.length, 4);
  assert.equal(new Set(attempt.questions.map(q => q.taskId)).size, 4);
  for (const lesson of ['a', 'b']) assert.equal(attempt.questions.filter(q => q.taskId.startsWith(lesson)).length, 2);
  assert.deepEqual(testSummary(topic, definition), {count: 4, maxPoints: 6, bankSize: 16});
  assert.deepEqual(topic, snapshot);
});

test('next test avoids previous questions when each coverage pool has capacity', () => {
  const topic = fixture(), first = drawTest(topic, topic.tests[0], [], fixed);
  const previous = first.questions.map(q => q.taskId);
  const next = drawTest(topic, topic.tests[0], previous, fixed);
  assert.ok(next.questions.every(q => !previous.includes(q.taskId)));
});

test('small pool uses all fresh questions before repeating and never loses coverage', () => {
  const topic = fixture(); topic.tests[0].draw[0].count = 7;
  const previous = topic.tests[0].questions.slice(0, 7).map(q => q.taskId);
  const attempt = drawTest(topic, topic.tests[0], previous, fixed);
  assert.ok(attempt.questions.some(q => q.taskId === 'a-7'));
  assert.equal(attempt.questions.filter(q => q.taskId.startsWith('a')).length, 7);
  assert.equal(attempt.questions.length, 9);
});

test('legacy fixed tests remain fixed and sampling errors do not silently shorten exams', () => {
  const topic = fixture(), definition = {...topic.tests[0], shuffleQuestions: false}; delete definition.draw;
  assert.deepEqual(drawTest(topic, definition).questions, definition.questions);
  assert.deepEqual(testSummary(topic, definition), {count: 16, maxPoints: 24, bankSize: 16});
  topic.tests[0].draw[0].count = 99;
  assert.throws(() => drawTest(topic, topic.tests[0]), /puli/);
});

test('practice exhausts each slot pool before repeats and avoids immediate repetition at rollover', () => {
  const topic = fixture(); let history = {}, last;
  const seen = [];
  for (let i = 0; i < 7; i++) {
    const next = drawLearning(topic, ['a-0'], history, fixed);
    const id = next.selected['a-0'];
    assert.notEqual(id, last);
    if (i < 3) seen.push(id);
    history = next.seen; last = id;
  }
  assert.equal(new Set(seen).size, 3);
  assert.equal(topic.learningVariants['a-0'].length, 2);
});

test('practice tolerates stale history and fixed legacy slots, without mutating progress', () => {
  const topic = fixture(), history = {'a-0': ['missing', 'a-1', 'a-1']};
  const snapshot = structuredClone(history);
  const next = drawLearning(topic, ['a-0', 'b-7'], history, fixed);
  assert.notEqual(next.selected['a-0'], 'a-1');
  assert.equal(next.selected['b-7'], 'b-7');
  assert.deepEqual(history, snapshot);
});
