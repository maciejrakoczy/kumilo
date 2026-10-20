import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const normal = text => text.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('pl-PL');
const unique = (values, label) => assert.equal(new Set(values.map(normal)).size, values.length, label);

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
