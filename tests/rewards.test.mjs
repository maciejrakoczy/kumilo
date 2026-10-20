import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const rewards = () => import('../assets/rewards.mjs');
const path = ['one', 'two', 'three', 'four', 'five'];

test('learning stars count unique completed path activities, not repetitions or unrelated tasks', async () => {
  const {learningRewards} = await rewards();
  const result = learningRewards(path, ['one', 'one', 'outside']);
  assert.equal(result.stars, 1);
  assert.equal(result.total, 5);
  assert.deepEqual(result.badges.map(badge => badge.earned), [true, false, false]);
});

test('badges follow first activity, halfway and full path completion', async () => {
  const {learningRewards} = await rewards();
  assert.deepEqual(learningRewards(path, []).badges.map(badge => badge.earned), [false, false, false]);
  assert.deepEqual(learningRewards(path, path.slice(0, 3)).badges.map(badge => badge.earned), [true, true, false]);
  assert.deepEqual(learningRewards(path, path).badges.map(badge => badge.earned), [true, true, true]);
  assert.deepEqual(learningRewards([], []).badges, []);
  assert.equal(learningRewards(['one'], ['one']).stars, 1);
});

test('reward markup labels completion, escapes task titles and does not imply mastery', async () => {
  const {rewardShelf} = await rewards();
  const tasks = [{id: 'one', title: '<img src=x onerror=alert(1)>'}];
  const html = rewardShelf(['one'], ['one'], tasks);
  assert.match(html, /1 z 1/);
  assert.match(html, /Za ukończone aktywności/);
  assert.doesNotMatch(html, /<img src=x|onerror="|opanowan/i);
  assert.match(html, /&lt;img/);
});

test('untimed exam has no no-timer copy, while actual deadlines remain visible', async () => {
  const app = await readFile(new URL('../assets/app.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(app, /Bez stopera|Bez limitu czasu/);
  assert.match(app, /Pozostało/);
});
