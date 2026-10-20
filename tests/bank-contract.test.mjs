import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateTopic, createProgressStore} from '../assets/core.mjs';

const real = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
function fixture() {
  const topic = structuredClone(real);
  delete topic.learningVariants;
  const a = topic.tasks.find(t => t.type === 'single-choice' && t.lessonIds[0] === 'praca-historyka');
  const b = topic.tasks.find(t => t.type === 'number-answer' && t.lessonIds[0] === 'uplyw-lat');
  const anchor = topic.tasks.find(t => t.id === topic.learningPath[0]);
  const variant = {...structuredClone(anchor), id: 'fixture-variant'};
  topic.tasks.push(variant);
  topic.learningVariants = {[anchor.id]: [variant.id]};
  topic.tests = [{...topic.tests[0], questions: [a, b].map(t => ({taskId: t.id, points: 1})), draw: [a, b].map(t => ({lessonId: t.lessonIds[0], count: 1}))}];
  return topic;
}

test('runtime accepts valid optional banks and retains legacy documents', () => {
  assert.equal(validateTopic(fixture()).kind, 'topic');
  const topic = fixture(); delete topic.learningVariants; delete topic.tests[0].draw;
  assert.equal(validateTopic(topic), topic);
});

for (const [label, mutate] of [
  ['unknown anchor', t => { t.learningVariants.missing = ['fixture-variant']; }],
  ['unknown variant', t => { t.learningVariants[t.learningPath[0]] = ['missing']; }],
  ['anchor as variant', t => { t.learningVariants[t.learningPath[0]] = [t.learningPath[1]]; }],
  ['duplicated variant', t => { t.learningVariants[t.learningPath[0]].push('fixture-variant'); }],
  ['cross-slot variant', t => { t.learningVariants[t.learningPath[1]] = ['fixture-variant']; }],
  ['different lesson', t => { t.tasks.find(x => x.id === 'fixture-variant').lessonIds = ['chronologia']; }],
  ['unknown coverage', t => { t.tests[0].draw[0].lessonId = 'missing'; }],
  ['duplicate coverage', t => { t.tests[0].draw.push({...t.tests[0].draw[0]}); }],
  ['insufficient pool', t => { t.tests[0].draw[0].count = 2; }],
  ['zero quota', t => { t.tests[0].draw[0].count = 0; }],
  ['uncovered question', t => { t.tests[0].draw.pop(); }],
  ['ambiguous coverage', t => { const id = t.tests[0].questions[0].taskId; t.tasks.find(x => x.id === id).lessonIds.push('uplyw-lat'); }],
  ['variable points', t => { const q = t.tests[0].questions[0], clone = {...structuredClone(t.tasks.find(x => x.id === q.taskId)), id: 'fixture-extra'}; t.tasks.push(clone); t.tests[0].questions.push({taskId: clone.id, points: 2}); }],
]) test(`runtime rejects ${label}`, () => {
  const topic = fixture(); mutate(topic);
  assert.throws(() => validateTopic(topic), /Nieprawidłowe dane/);
});

test('practice selections and history survive storage and stale IDs are discarded', () => {
  const topic = fixture(), anchor = topic.learningPath[0], values = new Map();
  const store = createProgressStore({getItem: k => values.get(k), setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k)});
  store.write('topic', {completedTaskIds: [anchor], practice: {
    selected: {[anchor]: 'fixture-variant', missing: 'missing'},
    seen: {[anchor]: ['missing', anchor, 'fixture-variant', 'fixture-variant'], missing: ['missing']},
  }});
  const loaded = store.read('topic', topic);
  assert.deepEqual(loaded.completedTaskIds, [anchor]);
  assert.deepEqual(loaded.practice, {selected: {[anchor]: 'fixture-variant'}, seen: {[anchor]: [anchor, 'fixture-variant']}});
});
