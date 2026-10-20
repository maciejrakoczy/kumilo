import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const task = id => {
  const found = topic.tasks.find(task => task.id === id);
  assert.ok(found, `Missing mathematical fixture: ${id}`);
  return found;
};
const dates = text => [...text.matchAll(/(\d+)\s+(p\.n\.e\.|n\.e\.)/g)].map(match => ({year: Number(match[1]), before: match[2] === 'p.n.e.'}));
const position = date => date.before ? 1 - date.year : date.year;
const interval = text => {
  const parsed = dates(text);
  assert.equal(parsed.length, 2, text);
  return Math.abs(position(parsed[0]) - position(parsed[1]));
};
const roman = text => {
  const signs = {I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000};
  return [...text].reduce((sum, sign, index) => sum + (signs[sign] < (signs[text[index + 1]] || 0) ? -signs[sign] : signs[sign]), 0);
};
const checkChoices = (id, predicate) => {
  const t = task(id);
  assert.deepEqual([...t.correctOptionIds].sort(), t.options.filter(option => predicate(option.text)).map(option => option.id).sort(), id);
};

test('expanded chronological and Roman choice keys agree with independent calculations', () => {
  checkChoices('u-czas-01', text => dates(text).length === 1 && position(dates(text)[0]) === position({year: 2, before: true}) + 1);
  checkChoices('u-czas-02', text => position(dates(text)[0]) < position({year: 3, before: false}));
  checkChoices('u-czas-03', text => {
    const [earlier, later] = dates(text);
    return position(earlier) < position(later);
  });
  checkChoices('u-rzym-01', text => Math.ceil(dates(text)[0].year / 100) === 10);
  checkChoices('u-rzym-02', text => {
    const [, numeral, value] = text.match(/^([IVXLCDM]+) = (\d+)$/);
    return roman(numeral) === Number(value);
  });
  checkChoices('u-rzym-03', text => {
    const century = roman(text.match(/^[IVXLCDM]+/)[0]);
    const actual = [...text.matchAll(/\d+/g)].map(match => Number(match[0]));
    const expected = text.includes('p.n.e.') ? [century * 100, (century - 1) * 100 + 1] : [(century - 1) * 100 + 1, century * 100];
    return JSON.stringify(actual) === JSON.stringify(expected);
  });
});

test('expanded sorting keys respect eras, century boundaries and calculation rules', () => {
  for (const item of task('u-czas-05').items) assert.equal(item.categoryId, dates(item.text)[0].before ? 'a' : 'b', item.text);
  for (const item of task('u-czas-07').items) assert.equal(item.categoryId, position(dates(item.text)[0]) < position({year: 10, before: true}) ? 'a' : 'b', item.text);
  for (const id of ['u-rzym-04', 'u-rzym-05']) {
    const t = task(id);
    for (const item of t.items) {
      const century = roman(t.categories.find(category => category.id === item.categoryId).text.match(/^[IVXLCDM]+/)[0]);
      assert.equal(century, Math.ceil(dates(item.text)[0].year / 100), item.text);
    }
  }
  for (const item of task('u-odstep-04').items) {
    const [first, second] = dates(item.text);
    assert.equal(item.categoryId, first.before === second.before ? 'a' : 'b', item.text);
  }
  for (const item of task('u-odstep-05').items) {
    const match = item.text.match(/Od (\d+)(?: (p\.n\.e\.|n\.e\.))? do (\d+) (p\.n\.e\.|n\.e\.) upłyn(?:ęło|ęły) (\d+)/);
    assert.ok(match, item.text);
    const first = {year: Number(match[1]), before: (match[2] || match[4]) === 'p.n.e.'};
    const second = {year: Number(match[3]), before: match[4] === 'p.n.e.'};
    const correct = Math.abs(position(first) - position(second)) === Number(match[5]);
    assert.equal(item.categoryId, correct ? 'a' : 'b', item.text);
  }
});

test('expanded matching, ordering and short answers use computed values', () => {
  for (const pair of task('u-rzym-06').pairs) assert.equal(roman(pair.left), Number(pair.right));
  for (const pair of task('u-odstep-06').pairs) assert.equal(interval(pair.left), Number(pair.right.match(/\d+/)[0]));
  const durations = {'Jeden rok': 1, 'Jeden wiek': 100, 'Dwa wieki': 2 * 100, 'Jedno tysiąclecie': 1000};
  const cases = [
    ['u-czas-10', item => durations[item.text], 1],
    ['u-rzym-08', item => roman(item.text), 1],
    ['u-rzym-09', item => position(dates(item.text)[0]), 1],
    ['u-odstep-08', item => interval(item.text), 1],
    ['u-odstep-10', item => interval(item.text), -1],
  ];
  for (const [id, value, direction] of cases) {
    const t = task(id);
    const expected = [...t.items].sort((first, second) => direction * (value(first) - value(second))).map(item => item.id);
    assert.deepEqual(t.correctOrder, expected, id);
  }
  assert.ok(task('u-rzym-10').acceptedAnswers.every(answer => roman(answer) === 4));
  assert.ok(task('u-rzym-11').acceptedAnswers.every(answer => roman(answer) === Math.ceil(2000 / 100)));
});
