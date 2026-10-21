import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const byId = new Map(topic.tasks.map(task => [task.id, task]));
const learningIds = topic.learningPath.flatMap(anchor => [anchor, ...(topic.learningVariants[anchor] || [])]);
const examIds = new Set(topic.tests.flatMap(exam => exam.questions.map(question => question.taskId)));

for (const lesson of topic.lessons) {
  for (const type of ['flashcards', 'discovery']) {
    test(`${lesson.id}: nowe autorskie ${type} w puli nauki`, () => {
      const fresh = topic.tasks.filter(task => task.id.startsWith('karty-') && task.type === type && task.lessonIds.includes(lesson.id));
      assert.ok(fresh.length >= 1, 'Brak nowej aktywności');
      for (const task of fresh) {
        const owners = Object.entries(topic.learningVariants).filter(([, ids]) => ids.includes(task.id));
        assert.equal(owners.length, 1, task.id);
        assert.deepEqual([...task.lessonIds].sort(), [...byId.get(owners[0][0]).lessonIds].sort());
        assert.ok(!examIds.has(task.id), task.id);
        const cards = type === 'flashcards' ? task.cards : task.items;
        assert.ok(cards.length >= 2 && cards.length <= 3, task.id);
        assert.equal(new Set(cards.map(card => card.id)).size, cards.length);
        for (const card of cards) {
          for (const field of type === 'flashcards' ? ['front', 'back'] : ['text', 'explanation']) {
            assert.ok(typeof card[field] === 'string' && card[field].trim().length >= 10, `${task.id}: ${field}`);
          }
        }
      }
      const count = learningIds.map(id => byId.get(id)).filter(task => task.type === type && task.lessonIds.includes(lesson.id)).length;
      const needsThree = (lesson.id === 'praca-historyka' && type === 'flashcards') || (lesson.id === 'zrodla-historyczne' && type === 'discovery');
      assert.ok(count >= (needsThree ? 3 : 1), `Za mało wariantów: ${count}`);
    });
  }
}

test('kotwice, warianty i bank testowy pozostają rozłączne', () => {
  assert.equal(topic.learningPath.length, 9);
  assert.equal(new Set(learningIds).size, learningIds.length);
  assert.equal(byId.size, topic.tasks.length);
  for (const anchor of topic.learningPath) {
    for (const id of topic.learningVariants[anchor] || []) {
      assert.ok(byId.has(id));
      assert.deepEqual([...byId.get(id).lessonIds].sort(), [...byId.get(anchor).lessonIds].sort(), id);
    }
  }
  for (const id of learningIds) assert.ok(!examIds.has(id), id);
});
