import test from 'node:test';
import assert from 'node:assert/strict';
import {startLearningSession, completeLearningEntry, markLearningSeen, mixedLearningReview} from '../assets/learning-session.mjs';
import {createProgressStore} from '../assets/core.mjs';

function fixture() {
  return {
    lessons: [{id: 'a', title: 'Temat A'}, {id: 'b', title: 'Temat B'}],
    learningPath: ['a-0', 'a-1', 'a-2', 'a-3', 'b-0', 'b-1', 'b-2', 'b-3'],
    tasks: ['a', 'b'].flatMap(lesson => Array.from({length: 4}, (_, i) => ({id: `${lesson}-${i}`, type: 'single-choice', lessonIds: [lesson]}))),
    learningPlan: {defaults: {extraPractice: 1, reviewCount: 2, avoidImmediateRepeat: true}, requiredTypes: ['single-choice'],
      steps: [{id: 'poznaj', title: 'Poznaj', types: ['single-choice'], count: 1, hints: true}, {id: 'utrwal', title: 'Utrwal', types: ['single-choice'], count: 1, hints: false}],
      lessons: ['a', 'b'].map(lessonId => ({lessonId, steps: [{id: 'poznaj', taskIds: [`${lessonId}-0`, `${lessonId}-1`]}, {id: 'utrwal', taskIds: [`${lessonId}-2`, `${lessonId}-3`]}]}))},
  };
}
const random = () => 0.3;

test('an unfinished replay resumes after switching to a different topic', () => {
  const topic = fixture(), progress = {};
  const first = startLearningSession(topic, progress, {lessonId: 'a', random});
  for (const entry of first.entries) completeLearningEntry(topic, progress.learning, entry, false, random);
  progress.learning.lastSlotId = null;
  const replay = startLearningSession(topic, progress, {lessonId: 'a', replay: true, random});
  completeLearningEntry(topic, progress.learning, replay.entries[0], false, random);
  progress.learning.lastSlotId = replay.entries[1].slotId;
  startLearningSession(topic, progress, {lessonId: 'b', random});
  const storage = {getItem: () => JSON.stringify({topic: progress}), setItem() {}, removeItem() {}};
  const restored = createProgressStore(storage).read('topic', topic);
  const resumed = startLearningSession(topic, restored, {lessonId: 'a', random});
  assert.equal(resumed.position, 1);
  assert.equal(resumed.entries[1].taskId, replay.entries[1].taskId);
});

test('corrupt cached selections cannot duplicate tasks or resume another topic cursor', () => {
  const topic = fixture(); topic.learningPlan.steps[0].count = 2;
  const value = {learning: {selected: {'a-poznaj-1': 'a-0', 'a-poznaj-2': 'a-0'}, activeLessonId: 'a', lastSlotId: 'b-poznaj-1'}};
  const storage = {getItem: () => JSON.stringify({topic: value}), setItem() {}, removeItem() {}};
  const progress = createProgressStore(storage).read('topic', topic);
  const selected = Object.values(progress.learning.selected);
  assert.equal(new Set(selected).size, selected.length);
  assert.equal(progress.learning.lastSlotId, null);
  const session = startLearningSession(topic, progress, {lessonId: 'a', random});
  assert.equal(session.position, 0);
  assert.equal(new Set(Object.values(progress.learning.selected)).size, Object.keys(progress.learning.selected).length);
});

test('repairing a partial multi-activity step never redraws an already retained task', () => {
  for (const value of [0, 0.5, 0.999]) {
    const topic = fixture(), progress = {};
    topic.learningPlan.steps[0].count = 2;
    startLearningSession(topic, progress, {lessonId: 'a', random: () => value});
    delete progress.learning.selected['a-poznaj-2'];
    const retained = progress.learning.selected['a-poznaj-1'];
    startLearningSession(topic, progress, {lessonId: 'a', random: () => value});
    assert.equal(progress.learning.selected['a-poznaj-1'], retained);
    assert.notEqual(progress.learning.selected['a-poznaj-2'], retained);
  }
});

test('topic learning prepares the whole plan but does not count unseen activities as viewed', () => {
  const topic = fixture(), progress = {completedTaskIds: ['old'], practice: {selected: {old: 'old'}}};
  const session = startLearningSession(topic, progress, {lessonId: 'a', random});
  assert.equal(session.entries.length, 2);
  assert.equal(Object.keys(progress.learning.selected).length, 4);
  assert.deepEqual(progress.learning.seen, {});
  assert.deepEqual(progress.learning.completedSlotIds, []);
  assert.deepEqual(progress.completedTaskIds, ['old']);
  assert.deepEqual(progress.practice.selected, {old: 'old'});
});

test('a mistake adds only one different same-step example, with no extra milestone', () => {
  const topic = fixture(), progress = {};
  const session = startLearningSession(topic, progress, {lessonId: 'a', random});
  const first = session.entries[0];
  markLearningSeen(topic, progress.learning, first);
  completeLearningEntry(topic, progress.learning, first, true, random);
  const resumed = startLearningSession(topic, progress, {lessonId: 'a', random});
  assert.equal(resumed.entries.length, 3);
  const extra = resumed.entries.find(entry => entry.extra);
  assert.notEqual(extra.taskId, first.taskId);
  assert.equal(extra.slotId, first.slotId);
  completeLearningEntry(topic, progress.learning, extra, true, random);
  completeLearningEntry(topic, progress.learning, first, true, random);
  assert.deepEqual(progress.learning.completedSlotIds, [first.slotId]);
  assert.equal(Object.keys(progress.learning.extraPractice).length, 1);
  assert.equal(progress.learning.extraPractice[first.slotId].done, true);
});

test('replaying one topic preserves other selections and all earned milestones', () => {
  const topic = fixture(), progress = {};
  const first = startLearningSession(topic, progress, {lessonId: 'a', random});
  completeLearningEntry(topic, progress.learning, first.entries[0], false, random);
  const others = Object.fromEntries(Object.entries(progress.learning.selected).filter(([id]) => id.startsWith('b-')));
  startLearningSession(topic, progress, {lessonId: 'a', replay: true, random});
  assert.deepEqual(Object.fromEntries(Object.entries(progress.learning.selected).filter(([id]) => id.startsWith('b-'))), others);
  assert.deepEqual(progress.learning.completedSlotIds, [first.entries[0].slotId]);
});

test('mixed review covers topics and never earns completion stars or changes saved selections', () => {
  const topic = fixture(), progress = {};
  startLearningSession(topic, progress, {lessonId: 'a', random});
  const selected = structuredClone(progress.learning.selected);
  const review = mixedLearningReview(topic, progress.learning, null, random);
  assert.equal(review.length, 2);
  assert.equal(new Set(review.map(entry => entry.lessonId)).size, 2);
  for (const entry of review) completeLearningEntry(topic, progress.learning, entry, true, random);
  assert.deepEqual(progress.learning.completedSlotIds, []);
  assert.deepEqual(progress.learning.selected, selected);
  assert.deepEqual(progress.learning.extraPractice, {});
});
