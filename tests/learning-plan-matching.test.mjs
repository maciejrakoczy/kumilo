import test from 'node:test';
import assert from 'node:assert/strict';
import {learningSlots, drawPlanLearning} from '../assets/learning-plan.mjs';

const types = ['single-choice', 'number-answer', 'short-answer'];

test('small configured plans agree with exhaustive assignment priorities', () => {
  let seed = 94723;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  for (let trial = 0; trial < 100; trial++) {
    const topic = {lessons: ['a', 'b'].map(id => ({id, title: id})), tasks: [], learningPath: [], learningPlan: {
      defaults: {extraPractice: 0, reviewCount: 2, avoidImmediateRepeat: random() < 0.5}, requiredTypes: [],
      steps: [{id: 'step', title: 'Krok', types, count: 1, hints: false}], lessons: [],
    }};
    for (const {id} of topic.lessons) {
      const tasks = Array.from({length: 3}, (_, i) => ({id: `${id}-${i}`, type: types[Math.floor(random() * types.length)], lessonIds: [id]}));
      topic.tasks.push(...tasks); topic.learningPath.push(...tasks.map(task => task.id));
      topic.learningPlan.lessons.push({lessonId: id, steps: [{id: 'step', count: random() < 0.5 ? 1 : 2, taskIds: tasks.map(task => task.id)}]});
    }
    if (trial % 2) topic.learningPlan.requiredTypes = [topic.tasks[0].type];
    const slots = learningSlots(topic), history = {}, reserved = trial % 3 ? [] : [types[0]];
    const tasks = new Map(topic.tasks.map(task => [task.id, task]));
    for (const slot of slots) history[slot.id] = slot.taskIds.filter(() => random() < 0.5).reverse();
    const quality = selected => {
      const chosenTypes = new Set(Object.values(selected).map(id => tasks.get(id).type));
      const required = topic.learningPlan.requiredTypes;
      const newTypes = [...chosenTypes].filter(type => !required.includes(type) && !reserved.includes(type)).length;
      let repeats = 0, seen = 0;
      for (const [id, taskId] of Object.entries(selected)) {
        if (topic.learningPlan.defaults.avoidImmediateRepeat && history[id].at(-1) === taskId) repeats++;
        if (history[id].includes(taskId)) seen++;
      }
      return [required.filter(type => chosenTypes.has(type)).length, newTypes, -repeats, -seen];
    };
    const compare = (a, b) => {
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
      return 0;
    };
    let best = null;
    const visit = (i, selected, used) => {
      if (i === slots.length) {
        const result = quality(selected);
        if (best === null || compare(result, best) > 0) best = result;
        return;
      }
      for (const id of slots[i].taskIds) if (!used.has(id)) {
        used.add(id); selected[slots[i].id] = id;
        visit(i + 1, selected, used);
        delete selected[slots[i].id]; used.delete(id);
      }
    };
    visit(0, {}, new Set());
    const {selected} = drawPlanLearning(topic, slots.map(slot => slot.id), history, random, reserved);
    assert.equal(new Set(Object.values(selected)).size, slots.length, `duplicate in trial ${trial}`);
    assert.deepEqual(quality(selected), best, `suboptimal assignment in trial ${trial}`);
  }
});
