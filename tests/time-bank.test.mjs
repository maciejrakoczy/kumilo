import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const dates = text => [...text.matchAll(/(\d+)\s*(p\.n\.e\.|n\.e\.)/g)].map(m => ({year: Number(m[1]), before: m[2] === 'p.n.e.'}));
const position = date => date.before ? 1 - date.year : date.year;
const interval = text => { const parsed = dates(text); return parsed.length === 1 ? 0 : Math.abs(position(parsed[0]) - position(parsed[1])); };
const roman = value => {
  const signs = {I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000};
  return [...value].reduce((sum, ch, i) => sum + (signs[ch] < (signs[value[i + 1]] || 0) ? -signs[ch] : signs[ch]), 0);
};
const correctText = task => task.options.find(o => o.id === task.correctOptionId).text;

test('new interval keys independently account for reversed dates and absent year zero', () => {
  const tasks = topic.tasks.filter(t => /^[pe]-odstep-/.test(t.id)); assert.equal(tasks.length, 24);
  for (const task of tasks) {
    if (task.type === 'number-answer') assert.equal(task.answer, interval(task.instruction), task.id);
    if (task.type === 'single-choice') assert.match(correctText(task), new RegExp(`\\b${interval(task.instruction)} (?:lat|lata|rok)`), task.id);
    if (task.type === 'matching') for (const pair of task.pairs) assert.equal(Number(pair.right.match(/\d+/)[0]), interval(pair.left), task.id);
    if (task.type === 'ordering') {
      const expected = [...task.items].sort((a, b) => interval(a.text) - interval(b.text)).map(i => i.id);
      assert.deepEqual(task.correctOrder, expected, task.id);
    }
  }
});

test('new chronological sequences and unit conversions have independently computed keys', () => {
  const tasks = topic.tasks.filter(t => /^[pe]-czas-/.test(t.id)); assert.equal(tasks.length, 24);
  for (const task of tasks.filter(t => t.type === 'ordering')) {
    const direction = task.instruction.includes('najpóźniejszej do najwcześniejszej') ? -1 : 1;
    const expected = [...task.items].sort((a, b) => direction * (position(dates(a.text)[0]) - position(dates(b.text)[0]))).map(i => i.id);
    assert.deepEqual(task.correctOrder, expected, task.id);
  }
  const expected = {'p-czas-10': 2 * 100, 'p-czas-11': 1000 / 100, 'e-czas-10': 3 * 100, 'e-czas-11': 1000 + 2 * 100};
  for (const [id, answer] of Object.entries(expected)) assert.equal(topic.tasks.find(t => t.id === id).answer, answer, id);
});

test('new Roman numeral, century membership and boundary keys agree with independent arithmetic', () => {
  const tasks = topic.tasks.filter(t => /^[pe]-rzym-/.test(t.id)); assert.equal(tasks.length, 24);
  for (const task of tasks) {
    if (task.type === 'matching') for (const pair of task.pairs) {
      if (/^[IVXLCDM]+$/.test(pair.left)) assert.equal(Number(pair.right), roman(pair.left), task.id);
      else assert.equal(roman(pair.right.match(/^[IVXLCDM]+/)[0]), Math.ceil(dates(pair.left)[0].year / 100), task.id);
    }
    if (task.type === 'number-answer') {
      const year = dates(task.instruction)[0], numeral = task.instruction.match(/\b[IVXLCDM]+\b/)?.[0];
      let expected;
      if (year) expected = Math.ceil(year.year / 100);
      else {
        const century = roman(numeral), before = task.instruction.includes('p.n.e.');
        expected = /pierwsz/.test(task.instruction) ? before ? century * 100 : (century - 1) * 100 + 1
          : /ostatni/.test(task.instruction) ? before ? (century - 1) * 100 + 1 : century * 100 : century;
      }
      assert.equal(task.answer, expected, task.id);
    }
    if (task.type === 'single-choice') {
      const key = correctText(task);
      if (/^[IVXLCDM]+$/.test(key)) assert.equal(roman(key), Number(task.instruction.match(/\d+/)[0]), task.id);
      else {
        const century = roman(task.instruction.match(/\b[IVXLCDM]+\b/)[0]);
        const bounds = [...key.matchAll(/\d+/g)].map(m => Number(m[0]));
        assert.deepEqual(bounds, task.instruction.includes('p.n.e.') ? [century * 100, (century - 1) * 100 + 1] : [(century - 1) * 100 + 1, century * 100], task.id);
      }
    }
  }
});
