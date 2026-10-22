import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {evaluateTask} from '../assets/core.mjs';

const load = async () => JSON.parse(await readFile(new URL('../data/klasa-4/jezyk-polski/akademia-pana-kleksa/topic.json', import.meta.url)));
const get = (topic, id) => {
  const task = topic.tasks.find(item => item.id === id);
  assert.ok(task, `Missing source objective: ${id}`);
  return task;
};
const options = task => Object.fromEntries(task.options.map(option => [option.text, option.id]));

test('corrected scans have reachable practice and assessment, not just distractor mentions', async () => {
  const topic = await load();
  const practice = new Set([...topic.learningPath, ...Object.values(topic.learningVariants).flat()]);
  const exam = new Set(topic.tests[0].questions.map(question => question.taskId));
  const objectives = [
    ['witaj-w-akademii-zastosuj-alfabet', 'witaj-w-akademii-test-alfabet'],
    ['portret-profesora-zastosuj-kieszenie', 'portret-profesora-test-kieszenie'],
    ['portret-profesora-utrwal-spojrzenie', 'portret-profesora-test-spojrzenie'],
    ['sekrety-kleksa-polacz-kamizelka', 'sekrety-kleksa-test-kamizelka'],
    ['sekrety-kleksa-utrwal-przysmaki', 'sekrety-kleksa-test-przysmaki'],
    ['plan-wydarzen-polacz-przygody', 'plan-wydarzen-test-przygody'],
    ['plan-wydarzen-zastosuj-kolejnosc-opowiadania', 'plan-wydarzen-test-kolejnosc-opowiadania'],
    ['rzeczywistosc-i-basn-polacz-powiedzenia', 'rzeczywistosc-i-basn-test-powiedzenia'],
  ];
  for (const [learningId, testId] of objectives) {
    get(topic, learningId); get(topic, testId);
    assert.ok(practice.has(learningId), learningId);
    assert.ok(exam.has(testId), testId);
  }
});

test('alphabetical order uses later letters and pocket counts agree with the book', async () => {
  const topic = await load();
  const task = get(topic, 'witaj-w-akademii-zastosuj-alfabet');
  const ids = Object.fromEntries(task.items.map(item => [item.text, item.id]));
  const correct = ['Adam', 'Aleksander', 'Alfred', 'Anatol'].map(name => ids[name]);
  assert.ok(evaluateTask(task, correct));
  assert.equal(evaluateTask(task, [ids.Adam, ids.Alfred, ids.Aleksander, ids.Anatol]), false);
  const pockets = get(topic, 'portret-profesora-zastosuj-kieszenie');
  assert.deepEqual(Object.fromEntries(pockets.pairs.map(pair => [pair.left, pair.right])), {
    Spodnie: '16 kieszeni', Kamizelka: '24 kieszenie', Surdut: '1 kieszeń z tyłu',
  });
});

test('professor food and waistcoat inventory have independent factual keys', async () => {
  const topic = await load();
  const food = get(topic, 'sekrety-kleksa-utrwal-przysmaki');
  const f = options(food);
  assert.ok(evaluateTask(food, ['Motyle', 'Kwiaty', 'Kolorowe szkiełka'].map(text => f[text])));
  assert.equal(evaluateTask(food, [f.Motyle, f.Kwiaty, f['Złote kluczyki']]), false);
  const inventory = get(topic, 'sekrety-kleksa-test-kamizelka');
  const i = options(inventory);
  assert.ok(evaluateTask(inventory, ['Złote kluczyki', 'Płomyki świec', 'Tabakierka z piegami'].map(text => i[text])));
  assert.equal(evaluateTask(inventory, [i['Srebrne kluczyki'], i['Płomyki świec'], i['Tabakierka z piegami']]), false);
});

test('ordinary equivalents for a piercing look are accepted, literal drilling is rejected', async () => {
  const topic = await load();
  const task = get(topic, 'rzeczywistosc-i-basn-utrwal-spojrzenie');
  for (const answer of ['przenikliwe', 'badawcze', 'wnikliwe', 'uważne', 'dociekliwe', 'przeszywające']) assert.ok(evaluateTask(task, `  ${answer.toUpperCase()}  `), answer);
  for (const answer of ['wiercenie dziur', 'senne', 'nieuważne']) assert.equal(evaluateTask(task, answer), false, answer);
});

test('order of telling is explicit and differs from the time of remembered adventures', async () => {
  const topic = await load();
  const task = get(topic, 'plan-wydarzen-zastosuj-kolejnosc-opowiadania');
  assert.match(task.instruction, /czytamy|opowiadania/);
  const items = Object.fromEntries(task.items.map(item => [item.text, item.id]));
  assert.ok(evaluateTask(task, [
    'Wyprawa Adasia po zapałki',
    'Wizyta u Śpiącej Królewny i siedmiu braci',
    'Opowieść Mateusza o księciu',
  ].map(text => items[text])));
  const adventures = get(topic, 'plan-wydarzen-test-przygody');
  assert.equal(adventures.pairs.find(pair => pair.left === 'Alojzy po rozłożeniu na części').right, 'Walizka profesora');
});

test('heavy-handed is not a synonym for clumsy and questions use child-facing wording', async () => {
  const topic = await load();
  const task = get(topic, 'rzeczywistosc-i-basn-test-powiedzenia');
  const ids = options(task);
  assert.match(task.instruction, /NIE/);
  assert.ok(evaluateTask(task, ids['Mocno uderza.']));
  assert.equal(evaluateTask(task, ids['Wszystko wypada mu z rąk.']), false);
  const visible = JSON.stringify({lessons: topic.lessons, tasks: topic.tasks, mindMap: topic.mindMap});
  assert.equal(/kondygnac|stylizac|relacjon|bezpośredni impuls|podważa prostą dosłowną interpretację|Klasyfikacja wymaga|Przyjmujemy równoważne/iu.exec(visible)?.[0], undefined, 'Replace unnecessarily adult wording');
});

test('feedback never refers to shuffled choices by their original positions', async () => {
  const topic = await load();
  for (const task of topic.tasks) assert.doesNotMatch(task.explanation, /trzy pierwsze|dwa pierwsze|dwie pierwsze|cztery pierwsze/iu, task.id);
});

test('spinning letters accepts natural Polish answers matching the wording of the question', async () => {
  const task = get(await load(), 'niezwykle-lekcje-utrwal-02');
  for (const answer of ['w nitki', 'w nici', 'nitkę', 'nici']) assert.ok(evaluateTask(task, answer), answer);
  for (const answer of ['we włosy', 'w atrament', 'w guziki']) assert.equal(evaluateTask(task, answer), false, answer);
});
