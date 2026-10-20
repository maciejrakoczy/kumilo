import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCatalog, validateTopic, catalogEntries, evaluateTask, gradeTest, createProgressStore, fetchJson } from '../assets/core.mjs';
import {drawTest} from '../assets/selection.mjs';

const catalog = JSON.parse(await readFile(new URL('../data/catalog.json', import.meta.url)));
const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const task = type => topic.tasks.find(t => t.type === type);
const clone = value => structuredClone(value);
const defaultProgress = () => ({ completedTaskIds: [], readLessonIds: [], lastTaskId: null, lastResult: null });
function memoryStorage() {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}

test('real documents validate without mutation and catalog flattens', () => {
  assert.equal(validateCatalog(catalog), catalog);
  assert.equal(validateTopic(topic), topic);
  assert.deepEqual(catalogEntries(catalog), [{ gradeId: 'klasa-4', gradeTitle: 'Klasa IV', grade: 4, subjectId: 'historia', subjectTitle: 'Historia', id: topic.id, title: topic.title, path: catalog.classes[0].subjects[0].topics[0].path }]);
});

for (const [name, change] of [
  ['version', d => { d.schemaVersion = '2.0'; }],
  ['kind', d => { d.kind = 'catalog'; }],
  ['required field', d => { delete d.summary; }],
  ['unknown type', d => { d.tasks[0].type = 'unknown'; }],
  ['duplicate task', d => { d.tasks.push(clone(d.tasks[0])); }],
  ['duplicate lesson', d => { d.lessons.push(clone(d.lessons[0])); }],
  ['lesson reference', d => { d.tasks[0].lessonIds = ['missing']; }],
  ['options', d => { d.tasks.find(t => t.type === 'single-choice').correctOptionId = 'missing'; }],
  ['duplicate options', d => { const t = d.tasks.find(t => t.options); t.options.push(clone(t.options[0])); }],
  ['category', d => { d.tasks.find(t => t.type === 'sorting').items[0].categoryId = 'missing'; }],
  ['order', d => { d.tasks.find(t => t.type === 'ordering').correctOrder.pop(); }],
  ['path reference', d => { d.learningPath.push('missing'); }],
  ['test reference', d => { d.tests[0].questions[0].taskId = 'missing'; }],
  ['non-scoreable test', d => { d.tests[0].questions[0].taskId = d.tasks[0].id; }],
  ['duplicate questions', d => { d.tests[0].questions.push(clone(d.tests[0].questions[0])); }],
  ['points', d => { d.tests[0].questions[0].points = 0; }],
  ['map IDs', d => { d.mindMap.children[0].id = d.mindMap.id; }],
  ['normalization', d => { d.tasks.find(t => t.type === 'short-answer').normalization = 'guess'; }],
  ['normalized duplicate answers', d => { d.tasks.find(t => t.type === 'short-answer').acceptedAnswers = ['ŻÓŁĆ', ' żółć ']; }],
  ['finite number', d => { d.tasks.find(t => t.type === 'number-answer').answer = Infinity; }],
  ['negative tolerance', d => { d.tasks.find(t => t.type === 'number-answer').tolerance = -1; }],
]) test(`topic rejects ${name}`, () => {
  const doc = clone(topic); change(doc);
  assert.throws(() => validateTopic(doc), error => error instanceof Error && /Nieprawidłowe dane/.test(error.message));
});

for (const [name, change] of [
  ['version', d => { d.schemaVersion = 1; }],
  ['duplicate grade', d => { d.classes.push(clone(d.classes[0])); }],
  ['grade mismatch', d => { d.classes[0].grade = 5; }],
  ['unsafe path', d => { d.classes[0].subjects[0].topics[0].path = '../topic.json'; }],
  ['missing subjects', d => { delete d.classes[0].subjects; }],
]) test(`catalog rejects ${name}`, () => { const doc = clone(catalog); change(doc); assert.throws(() => validateCatalog(doc), /Nieprawidłowe dane/); });

test('single and multiple choice use exact IDs and unique exact sets', () => {
  const single = task('single-choice'), multiple = task('multiple-choice');
  assert.equal(evaluateTask(single, single.correctOptionId), true);
  assert.equal(evaluateTask(single, [single.correctOptionId]), false);
  assert.equal(evaluateTask(multiple, [...multiple.correctOptionIds].reverse()), true);
  for (const answer of [null, multiple.correctOptionIds[0], [], [...multiple.correctOptionIds, multiple.correctOptionIds[0]], [...multiple.correctOptionIds, 'missing']]) assert.equal(evaluateTask(multiple, answer), false);
});

test('matching and sorting require all own mappings, no extras', () => {
  for (const type of ['matching', 'sorting']) {
    const t = task(type), entries = type === 'matching' ? t.pairs.map(p => [p.id, p.id]) : t.items.map(i => [i.id, i.categoryId]);
    const answer = Object.fromEntries(entries);
    assert.equal(evaluateTask(t, answer), true);
    assert.equal(evaluateTask(t, { ...answer, extra: 'x' }), false);
    assert.equal(evaluateTask(t, Object.create(answer)), false);
    delete answer[entries[0][0]];
    assert.equal(evaluateTask(t, answer), false);
  }
});

test('ordering is a full exact sequence', () => {
  const t = task('ordering');
  assert.equal(evaluateTask(t, [...t.correctOrder]), true);
  assert.equal(evaluateTask(t, [...t.correctOrder].reverse()), false);
  assert.equal(evaluateTask(t, t.correctOrder.slice(1)), false);
});

test('short answer handles whitespace, Polish case and NFC, not synonyms', () => {
  const t = { ...task('short-answer'), acceptedAnswers: ['Żółć babcią'] };
  assert.equal(evaluateTask(t, '  ŻÓŁĆ\n BABCIĄ  '.normalize('NFD')), true);
  assert.equal(evaluateTask(t, 'zolc babcia'), false);
  assert.equal(evaluateTask(t, null), false);
});

test('numbers parse the complete finite decimal with Polish comma and tolerance', () => {
  const t = { ...task('number-answer'), answer: 12.5, tolerance: 0.25 };
  for (const answer of ['12,5', ' 12.50 ', '+12.5', '12.25', '12.75', '1.25e1']) assert.equal(evaluateTask(t, answer), true, answer);
  for (const answer of ['', ' ', '12.5 lat', '12,5,0', '0xC', 'Infinity', 'NaN', '1e999', '12 5', '12.751', null, true, 12.5]) assert.equal(evaluateTask(t, answer), false, String(answer));
});

test('discovery, flashcards and unknown types are not scoreable', () => {
  for (const type of ['discovery', 'flashcards', 'unknown']) assert.equal(evaluateTask({ type }, true), false);
});

test('weighted grading, missing answers, rounded percentage and lesson references', () => {
  const a = task('single-choice'), b = task('number-answer');
  const definition = { questions: [{ taskId: a.id, points: 2 }, { taskId: b.id, points: 1 }] };
  const result = gradeTest(topic, definition, { [a.id]: a.correctOptionId });
  assert.deepEqual(result, { points: 2, maxPoints: 3, percent: 67, results: [
    { taskId: a.id, correct: true, points: 2, maxPoints: 2, lessonIds: a.lessonIds },
    { taskId: b.id, correct: false, points: 0, maxPoints: 1, lessonIds: b.lessonIds },
  ] });
  assert.equal(gradeTest(topic, topic.tests[0], {}).points, 0);
});

test('progress stores independent topics, sanitizes stale IDs and clears only its key', () => {
  const storage = memoryStorage(), store = createProgressStore(storage), id = topic.tasks[0].id, lessonId = topic.lessons[0].id;
  assert.deepEqual(store.read('one', topic), defaultProgress());
  store.write('one', { completedTaskIds: [id, id, 'stale'], readLessonIds: [lessonId, 'stale'], lastTaskId: 'stale', lastResult: { nonsense: true } });
  store.write('two', { ...defaultProgress(), lastTaskId: id });
  assert.deepEqual(store.read('one', topic), { completedTaskIds: [id], readLessonIds: [lessonId], lastTaskId: null, lastResult: null });
  assert.equal(store.read('two', topic).lastTaskId, id);
  storage.setItem('unrelated', 'keep'); store.clear();
  assert.equal(storage.getItem('unrelated'), 'keep');
  assert.deepEqual(store.read('two', topic), defaultProgress());
  assert.equal(store.available, true);
});

test('progress result round trips, invalid and stale results are discarded', () => {
  const storage = memoryStorage(), store = createProgressStore(storage);
  const result = gradeTest(topic, topic.tests[0], {});
  store.write('x', { ...defaultProgress(), lastResult: result });
  assert.deepEqual(store.read('x', topic).lastResult, result);
  for (const invalid of [{ ...result, percent: 100 }, { ...result, points: -1 }, { ...result, results: [{ taskId: 'missing' }] }]) {
    store.write('x', { ...defaultProgress(), lastResult: invalid });
    assert.equal(store.read('x', topic).lastResult, null);
  }
});

test('corrupt, blocked, unavailable and quota-limited storage never crash', () => {
  const storage = memoryStorage(); storage.setItem('kumilo.progress.v1', '{bad');
  assert.deepEqual(createProgressStore(storage).read('x', topic), defaultProgress());
  for (const value of [null, [], 42, { x: null }]) {
    storage.setItem('kumilo.progress.v1', JSON.stringify(value));
    assert.deepEqual(createProgressStore(storage).read('x', topic), defaultProgress());
  }
  for (const storage of [undefined, { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); }, removeItem() { throw Error('blocked'); } }]) {
    const store = createProgressStore(storage); store.read('x', topic); store.write('x', defaultProgress()); store.clear(); assert.equal(store.available, false);
  }
  const quota = createProgressStore({ ...memoryStorage(), setItem() { throw Error('quota'); } });
  quota.write('x', defaultProgress()); assert.equal(quota.available, false);
});

test('every task type rejects missing type-specific required fields', () => {
  const fields = { discovery: 'items', flashcards: 'cards', 'single-choice': 'correctOptionId', 'multiple-choice': 'correctOptionIds', matching: 'pairs', sorting: 'categories', ordering: 'correctOrder', 'short-answer': 'acceptedAnswers', 'number-answer': 'unit' };
  for (const [type, field] of Object.entries(fields)) {
    const doc = clone(topic); delete doc.tasks.find(t => t.type === type)[field];
    assert.throws(() => validateTopic(doc), /Nieprawidłowe dane/, type);
  }
});

test('complete real test scores 100 percent and stale full results are discarded', () => {
  const answers = Object.fromEntries(topic.tasks.map(t => [t.id,
    t.type === 'single-choice' ? t.correctOptionId : t.type === 'multiple-choice' ? t.correctOptionIds : t.type === 'matching' ? Object.fromEntries(t.pairs.map(p => [p.id, p.id])) : t.type === 'sorting' ? Object.fromEntries(t.items.map(i => [i.id, i.categoryId])) : t.type === 'ordering' ? t.correctOrder : t.type === 'short-answer' ? t.acceptedAnswers[0] : String(t.answer),
  ]));
  const result = gradeTest(topic, drawTest(topic, topic.tests[0]), answers);
  assert.equal(result.percent, 100); assert.equal(result.points, result.maxPoints);
  const store = createProgressStore(memoryStorage());
  store.write('x', { ...defaultProgress(), lastResult: result });
  const changedTopic = clone(topic); changedTopic.tasks = changedTopic.tasks.filter(t => t.id !== result.results[0].taskId);
  assert.equal(store.read('x', changedTopic).lastResult, null);
});

test('fetchJson returns data and rejects HTTP, malformed JSON and network failures', async () => {
  assert.deepEqual(await fetchJson('/x', async url => { assert.equal(url, '/x'); return { ok: true, json: async () => ({ x: 1 }) }; }), { x: 1 });
  await assert.rejects(fetchJson('/x', async () => ({ ok: false, status: 404, json: async () => ({}) })), /404/);
  await assert.rejects(fetchJson('/x', async () => ({ ok: true, json: async () => { throw SyntaxError('bad'); } })), /JSON/);
  await assert.rejects(fetchJson('/x', async () => { throw Error('offline'); }), /offline/);
});
