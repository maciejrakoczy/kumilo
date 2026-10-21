import test from 'node:test';
import assert from 'node:assert/strict';
import {learningHome, learningTopics} from '../assets/learning-view.mjs';

const topic = {title: 'Dział <test>', summary: 'Opis', lessons: [{id: 'one', title: 'Temat <pierwszy>'}], tasks: [{id: 'old', title: 'Stary krok'}, {id: 'new', type: 'discovery', lessonIds: ['one']}], learningPath: ['old'], learningPlan: {
  defaults: {extraPractice: 0, reviewCount: 1, avoidImmediateRepeat: true}, requiredTypes: ['discovery'],
  steps: [{id: 'open', title: 'Odkryj', types: ['discovery'], count: 1, hints: true}], lessons: [{lessonId: 'one', steps: [{id: 'open', taskIds: ['new']}]}],
}};
const progress = {completedTaskIds: ['old'], learning: {completedSlotIds: [], activeLessonId: null, lastSlotId: null}};

test('topic menu comes from the plan and escapes titles without promoting old achievements', () => {
  const html = learningTopics(topic, progress);
  assert.ok(html.includes('Temat &lt;pierwszy&gt;'));
  assert.ok(html.includes('data-lesson="one"'));
  assert.ok(html.includes('0 / 1'));
  assert.ok(!html.includes('data-action="replay-lesson"'));
});

test('home preserves legacy rewards separately and provides manual mixed review', () => {
  const html = learningHome(topic, progress);
  assert.ok(html.includes('Dział &lt;test&gt;'));
  assert.ok(html.includes('data-legacy-rewards'));
  assert.ok(html.includes('data-action="mixed-review"'));
});
