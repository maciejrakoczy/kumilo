import test from 'node:test';
import assert from 'node:assert/strict';
import {activityScreen} from '../assets/activity-view.mjs';
import {validateTopic} from '../assets/core.mjs';
import {readFile} from 'node:fs/promises';

const types = ['discovery', 'flashcards', 'single-choice', 'multiple-choice', 'matching', 'sorting', 'ordering', 'short-answer', 'number-answer'];
const task = {id: 'card', type: 'single-choice', title: '<img src=x>', instruction: '<b>tekst & pytanie</b>', hint: 'tajna-podpowiedź'};

test('shared card covers every task type and escapes educational text', () => {
  for (const type of types) {
    const html = activityScreen({task: {...task, type}, index: 2, total: 9});
    assert.ok(html.includes('question-card') && html.includes('task-controls') && html.includes('journey-track'), type);
    assert.ok(html.includes('&lt;img src=x&gt;') && html.includes('&lt;b&gt;tekst &amp; pytanie&lt;/b&gt;'), type);
    assert.ok(!html.includes('<img src=x>'), type);
    assert.ok(html.includes('aria-valuenow="2"') && html.includes('aria-valuemax="9"'), type);
  }
});

test('assessment card hides content hints and permits advancing an unanswered question', () => {
  const html = activityScreen({task, index: 1, total: 16, mode: 'test', points: 1, deadline: null, notes: 'private-lesson-notes'});
  assert.ok(!html.includes('tajna-podpowiedź') && !html.includes('private-lesson-notes'));
  assert.ok(!html.includes('toggle-hint') && !html.includes('time-left'));
  assert.match(html, /data-action="exam-next">/);
  assert.match(html, /data-action="exam-back" disabled/);
});

test('matching column labels are optional but nonempty strings when supplied', async () => {
  const topic = JSON.parse(await readFile(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
  for (const label of ['leftLabel', 'rightLabel']) {
    for (const invalid of ['', 42]) {
      const broken = structuredClone(topic); broken.tasks.find(t => t.type === 'matching')[label] = invalid;
      assert.throws(() => validateTopic(broken), new RegExp(label));
    }
  }
});
