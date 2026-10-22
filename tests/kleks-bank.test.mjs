import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateCatalog, validateTopic, catalogEntries, evaluateTask} from '../assets/core.mjs';
import {learningSlots, drawPlanLearning} from '../assets/learning-plan.mjs';
import {drawTest, testSummary} from '../assets/selection.mjs';

const path = 'klasa-4/jezyk-polski/akademia-pana-kleksa/topic.json';
const load = async () => JSON.parse(await readFile(new URL(`../data/${path}`, import.meta.url)));

test('Polish literature is discoverable through the production catalog', async () => {
  const catalog = validateCatalog(JSON.parse(await readFile(new URL('../data/catalog.json', import.meta.url))));
  const entry = catalogEntries(catalog).find(item => item.path === path);
  assert.ok(entry, 'Missing Polish literature topic in catalog');
  const topic = validateTopic(await load());
  assert.equal(entry.id, topic.id);
  assert.equal(entry.subjectId, topic.subjectId);
  assert.equal(entry.grade, topic.grade);
});

test('Kleks configures eight complete expeditions and separate reachable banks', async () => {
  const topic = validateTopic(await load());
  const slots = learningSlots(topic);
  assert.equal(topic.lessons.length, 8);
  assert.equal(slots.length, 48);
  const learning = [...topic.learningPath, ...Object.values(topic.learningVariants).flat()];
  const pool = slots.flatMap(slot => slot.taskIds);
  assert.deepEqual([...pool].sort(), [...learning].sort());
  assert.equal(new Set(pool).size, pool.length);
  assert.ok(learning.length >= 120 && learning.length <= 160);
  const exam = topic.tests[0].questions.map(question => question.taskId);
  assert.ok(exam.length >= 60 && exam.length <= 80);
  assert.ok(exam.every(id => !learning.includes(id)));
  assert.equal(new Set([...learning, ...exam]).size, topic.tasks.length);
  const tasks = new Map(topic.tasks.map(task => [task.id, task]));
  for (const lesson of topic.lessons) assert.equal(slots.filter(slot => slot.lessonId === lesson.id).length, 6);
  for (const slot of slots) {
    if (slot.taskIds.every(id => !['discovery', 'flashcards'].includes(tasks.get(id).type))) assert.ok(slot.taskIds.length >= 2, `No extra example: ${slot.id}`);
  }
  assert.ok(!topic.tasks.some(task => task.type === 'number-answer'), 'Do not force arithmetic into literature');
  for (let i = 0; i < 100; i++) {
    const {selected} = drawPlanLearning(topic, slots.map(slot => slot.id));
    assert.equal(new Set(Object.values(selected)).size, 48);
    const types = new Set(Object.values(selected).map(id => tasks.get(id).type));
    for (const type of topic.learningPlan.requiredTypes) assert.ok(types.has(type));
    const sample = drawTest(topic, topic.tests[0]);
    assert.equal(testSummary(topic, topic.tests[0]).count, 16);
    assert.equal(sample.questions.length, 16);
    assert.equal(new Set(sample.questions.map(question => question.taskId)).size, 16);
    assert.deepEqual(new Set(sample.questions.map(question => tasks.get(question.taskId).type)), new Set(exam.map(id => tasks.get(id).type)), 'Sample omits an available scored format');
    for (const group of sample.draw) assert.equal(sample.questions.filter(question => tasks.get(question.taskId).lessonIds.includes(group.lessonId)).length, group.count);
    assert.ok(sample.questions.every(question => !['discovery', 'flashcards'].includes(tasks.get(question.taskId).type)));
  }
});

test('Kleks text keys accept declared variants and reject unrelated answers', async () => {
  const topic = await load();
  for (const task of topic.tasks.filter(task => task.type === 'short-answer')) {
    for (const answer of task.acceptedAnswers) assert.ok(evaluateTask(task, `  ${answer.toUpperCase()}  `), `${task.id}: ${answer}`);
    assert.equal(evaluateTask(task, 'zupełnie inna odpowiedź'), false, task.id);
  }
  for (const bank of [topic.tasks.filter(task => topic.learningPath.includes(task.id) || Object.values(topic.learningVariants).flat().includes(task.id)), topic.tasks.filter(task => topic.tests[0].questions.some(question => question.taskId === task.id))]) {
    const keys = new Set(bank.filter(task => task.type === 'multiple-choice').map(task => task.correctOptionIds.length));
    assert.ok(keys.size >= 2, 'Vary the number of correct selections within each bank');
  }
});

test('Polish choices and pairs are distinguishable and select-all keys are exact', async () => {
  const topic = await load();
  const normalize = value => value.normalize('NFC').trim().toLocaleLowerCase('pl');
  for (const task of topic.tasks) {
    for (const labels of [task.options?.map(option => option.text), task.pairs?.map(pair => pair.left), task.pairs?.map(pair => pair.right)].filter(Boolean)) {
      assert.equal(new Set(labels.map(normalize)).size, labels.length, `Ambiguous labels: ${task.id}`);
    }
    if (task.type === 'multiple-choice') {
      assert.ok(task.correctOptionIds.length < task.options.length, `No distractor: ${task.id}`);
      for (let mask = 0; mask < 2 ** task.options.length; mask++) {
        const answer = task.options.filter((_, index) => mask & 2 ** index).map(option => option.id);
        const correct = answer.length === task.correctOptionIds.length && task.correctOptionIds.every(id => answer.includes(id));
        assert.equal(evaluateTask(task, answer), correct, `${task.id}: ${answer}`);
      }
    }
  }
});
