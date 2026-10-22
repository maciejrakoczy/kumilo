import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as sessions from '../assets/learning-session.mjs';
import {learningSlots} from '../assets/learning-plan.mjs';
import {createProgressStore} from '../assets/core.mjs';

const topic = JSON.parse(readFileSync(new URL('../data/klasa-4/historia/detektywi-przeszlosci/topic.json', import.meta.url)));
const random = () => 0.3;
const restore = value => createProgressStore({getItem: () => JSON.stringify({topic: value}), setItem() {}, removeItem() {}}).read('topic', topic);

test('the full expedition follows every JSON lesson and step in one queue', () => {
  assert.equal(typeof sessions.startLearningExpedition, 'function');
  const progress = restore({});
  const session = sessions.startLearningExpedition(topic, progress, {random});
  assert.equal(session.position, 0);
  assert.deepEqual(session.entries.map(entry => entry.slotId), learningSlots(topic).map(slot => slot.id));
  assert.equal(new Set(session.entries.map(entry => entry.taskId)).size, session.entries.length);
  assert.deepEqual(progress.learning.seen, {});
  assert.deepEqual(progress.learning.completedSlotIds, []);
});

test('the expedition resumes its own cursor after reload and individual topic learning', () => {
  const progress = restore({});
  const first = sessions.startLearningExpedition(topic, progress, {random});
  progress.learning.expeditionSlotId = first.entries[8].slotId;
  sessions.startLearningSession(topic, progress, {lessonId: topic.lessons[0].id, random});
  const saved = restore(progress);
  const resumed = sessions.startLearningExpedition(topic, saved, {random});
  assert.equal(resumed.position, 8);
  assert.deepEqual(saved.learning.selected, progress.learning.selected);
  const invalid = restore({...progress, learning: {...progress.learning, expeditionSlotId: 'unknown-slot'}});
  assert.equal(invalid.learning.expeditionSlotId, null);
});
