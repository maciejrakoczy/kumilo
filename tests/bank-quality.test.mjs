import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateTask} from '../assets/core.mjs';
import {shuffled} from '../assets/ui.mjs';

const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const normal = text => text.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('pl-PL');
const unique = (values, label) => assert.equal(new Set(values.map(normal)).size, values.length, label);

test('fictional character answer accepts equivalent Polish adjectives', () => {
  const task = topic.tasks.find(task => task.id === 'u-historyk-15');
  assert.ok(task);
  for (const answer of ['fikcyjna', 'wymyślona', 'zmyślona']) {
    assert.equal(evaluateTask(task, `  ${answer.toUpperCase()}  `), true, answer);
  }
  for (const answer of ['historyczna', 'prawdziwa', '']) {
    assert.equal(evaluateTask(task, answer), false, answer);
  }
});

test('expanded bank balances activity formats across all lessons', () => {
  assert.ok(topic.tasks.length >= 260, 'Expected at least 260 activities');
  for (const [type, minimum] of Object.entries({
    'multiple-choice': 42, sorting: 28, matching: 33, ordering: 23, 'short-answer': 18,
  })) assert.ok(topic.tasks.filter(task => task.type === type).length >= minimum, `Too few ${type} activities`);
  for (const lesson of topic.lessons) {
    const tasks = topic.tasks.filter(task => task.lessonIds.includes(lesson.id));
    assert.ok(tasks.length >= 30, `${lesson.id}: too few activities`);
    assert.ok(new Set(tasks.map(task => task.type)).size >= 5, `${lesson.id}: too few activity formats`);
  }
});

test('multiple choice avoids a fixed answer count in both learning and assessment', () => {
  const practice = new Set(topic.learningPath.flatMap(anchor => [anchor, ...(topic.learningVariants?.[anchor] || [])]));
  const exam = new Set(topic.tests[0].questions.map(question => question.taskId));
  for (const [name, ids] of [['learning', practice], ['assessment', exam]]) {
    const tasks = topic.tasks.filter(task => ids.has(task.id) && task.type === 'multiple-choice');
    for (const count of [1, 2, 3]) {
      assert.ok(tasks.filter(task => task.correctOptionIds.length === count).length >= 3, `${name}: too few questions with ${count} correct answers`);
    }
    assert.deepEqual([...new Set(tasks.map(task => task.options.length))].sort(), [3, 4, 5], `${name}: vary option counts too`);
    for (const task of tasks) {
      assert.ok(task.correctOptionIds.length < task.options.length, `${task.id}: needs a distractor`);
      assert.ok(task.options.length >= 3 && task.options.length <= 5, `${task.id}: keep the choice manageable`);
    }
    for (const lesson of topic.lessons) {
      assert.ok(tasks.some(task => task.lessonIds.includes(lesson.id)), `${name}: missing multiple choice in ${lesson.id}`);
      const formats = new Set(topic.tasks.filter(task => ids.has(task.id) && task.lessonIds.includes(lesson.id)).map(task => task.type));
      assert.ok(formats.size >= 4, `${name}: too few activity formats in ${lesson.id}`);
    }
  }
});

test('every multiple-choice key accepts only the complete set after option shuffling', () => {
  for (const task of topic.tasks.filter(task => task.type === 'multiple-choice')) {
    for (const random of [0, 0.5, 0.999]) {
      const options = shuffled(task.options, () => random);
      const correctMask = options.reduce((mask, option, index) => mask | (task.correctOptionIds.includes(option.id) ? 1 << index : 0), 0);
      for (let mask = 0; mask < 1 << options.length; mask++) {
        const answer = options.filter((option, index) => mask & 1 << index).map(option => option.id);
        assert.equal(evaluateTask(task, answer), mask === correctMask, `${task.id}: subset ${mask}, random ${random}`);
      }
    }
  }
});

test('bank has distinguishable options, matching pairs and ordering labels', () => {
  for (const task of topic.tasks) {
    if (task.options) unique(task.options.map(o => o.text), `${task.id}: duplicate visible option`);
    if (task.pairs) {
      unique(task.pairs.map(p => p.left), `${task.id}: indistinguishable left cards`);
      unique(task.pairs.map(p => p.right), `${task.id}: indistinguishable right cards`);
    }
    if (task.type === 'ordering') unique(task.items.map(i => i.text), `${task.id}: indistinguishable ordering labels`);
  }
});

test('bank does not duplicate entire question payloads under different IDs', () => {
  const signatures = new Set();
  for (const task of topic.tasks) {
    const signature = JSON.stringify({
      type: task.type, title: normal(task.title), instruction: normal(task.instruction),
      options: task.options?.map(o => normal(o.text)).sort(),
      items: task.items?.map(i => normal(i.text)).sort(),
      pairs: task.pairs?.map(p => [normal(p.left), normal(p.right)]).sort(),
      cards: task.cards?.map(c => [normal(c.front), normal(c.back)]).sort(),
    });
    assert.ok(!signatures.has(signature), `Duplicate question payload: ${task.id}`);
    signatures.add(signature);
  }
});
