import {solveTask, shownTask} from './browser-helpers.mjs';
import {runLearningPlanChecks, checkLearningPlanConfiguration} from './learning-plan-browser.mjs';
import {checkExpedition} from './expedition-browser.mjs';

export async function runBankChecks() {
  const key = 'kumilo.progress.v1', old = localStorage.getItem(key), results = [];
  const topic = await fetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(r => r.json());
  const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
  const {mountTask} = await import(new URL(`./assets/tasks${extension}`, document.baseURI));
  const {evaluateTask} = await import(new URL(`./assets/core${extension}`, document.baseURI));
  const {testSummary} = await import(new URL(`./assets/selection${extension}`, document.baseURI));
  const assert = (value, message) => { if (!value) throw Error(message); };
  const click = selector => { const node = document.querySelector(selector); assert(node && !node.disabled, `Missing ${selector}`); node.click(); };
  const reloadTopic = async () => {
    click('#brand'); click('[data-action="picker"]'); document.getElementById('picker-form').requestSubmit();
    for (let i = 0; i < 100; i++) { if (document.querySelector('[data-action="learn"]')) return; await new Promise(r => setTimeout(r, 30)); }
    throw Error('Topic did not load');
  };
  const check = async (name, fn) => { await fn(); results.push({name, status: 'PASS'}); };
  const runExam = () => {
    click('[data-action="test-intro"]'); document.getElementById('student-name').value = 'Losowanie'; document.getElementById('test-form').requestSubmit();
    const ids = [], count = testSummary(topic, topic.tests[0]).count;
    for (let i = 0; i < count; i++) {
      const task = shownTask(topic); ids.push(task.id); solveTask(task, 'test');
      assert(document.querySelector('#task-area .feedback').hidden, 'Immediate correctness during exam');
      click('[data-action="exam-next"]');
    }
    click('[data-action="submit-exam"]');
    assert(document.querySelector('.score').textContent === `${count} / ${count} pkt`, 'Exam graded bank instead of sample');
    assert(new Set(ids.map(id => topic.tasks.find(task => task.id === id).type)).size === 7, 'Exam omitted an activity type');
    const report = Object.values(JSON.parse(localStorage.getItem(key)))[0].lastResult;
    assert(report.results.length === count, 'Saved report contains unsampled questions');
    for (const group of topic.tests[0].draw) assert(ids.filter(id => topic.tasks.find(t => t.id === id).lessonIds.includes(group.lessonId)).length === group.count, `Coverage lost: ${group.lessonId}`);
    click('#brand'); return ids;
  };
  try {
    await check('Every bank activity can be rendered, solved and cleaned up', async () => {
      const host = document.createElement('section'); document.body.append(host);
      try {
        for (const task of topic.tasks) {
          let completed = false;
          const mounted = mountTask(host, task, {onComplete: () => { completed = true; }});
          try {
            if (task.type === 'ordering') assert(!evaluateTask(task, mounted.getAnswer()), `Ordering starts already solved: ${task.id}`);
            const choices = () => [...host.querySelectorAll('[data-option]')].map(n => n.dataset.option).join(',');
            const before = choices();
            solveTask(task, 'learn', false, host);
            assert(choices() === before, `Options jumped during answering: ${task.id}`);
            assert(completed, `Practice did not finish: ${task.id}`);
            if (!['discovery', 'flashcards'].includes(task.type)) assert(evaluateTask(task, mounted.getAnswer()), `Key not solvable: ${task.id}`);
          } finally { mounted.destroy(); }
        }
      } finally { host.remove(); }
    });
    localStorage.removeItem(key); await reloadTopic();
    await check('Two sampled exams preserve coverage and have no shared questions', async () => {
      const first = runExam();
      await reloadTopic();
      const second = runExam();
      assert(second.every(id => !first.includes(id)), 'Immediate repeat despite spare bank capacity');
      assert(new Set(second).size === second.length, 'Duplicate question within exam');
    });
    await check('Learning resumes the chosen variant and saves only milestone stars', async () => {
      if (topic.learningPlan) {
        const checks = [...await runLearningPlanChecks(), await checkLearningPlanConfiguration()];
        results.push(...checks);
        assert(checks.every(result => result.status === 'PASS'), 'Planned learning checks failed');
        const expedition = await checkExpedition();
        results.push(expedition);
        assert(expedition.status === 'PASS', expedition.reason);
        return;
      }
      click('[data-action="learn"]'); const first = shownTask(topic).id;
      const initialPractice = Object.values(JSON.parse(localStorage.getItem(key)))[0].practice;
      assert(Object.keys(initialPractice.seen).length === 1, 'Unseen queued activities counted as displayed');
      await reloadTopic(); click('[data-action="learn"]');
      assert(shownTask(topic).id === first, 'Resume rerolled unfinished activity');
      const partial = JSON.parse(localStorage.getItem(key));
      delete Object.values(partial)[0].practice.selected[topic.learningPath.at(-1)];
      localStorage.setItem(key, JSON.stringify(partial));
      await reloadTopic(); click('[data-action="learn"]');
      assert(shownTask(topic).id === first, 'Repairing a missing future selection rerolled the current activity');
      const finishRun = () => topic.learningPath.map(anchor => {
        const task = shownTask(topic); solveTask(task); click('[data-action="next-learn"]'); return [anchor, task.id];
      });
      const run = finishRun();
      assert(new Set(run.map(([, id]) => topic.tasks.find(task => task.id === id).type)).size === 9, 'Expedition omitted an activity type');
      click('#brand');
      await reloadTopic(); click('[data-action="replay"]');
      const replay = finishRun();
      assert(new Set(replay.map(([, id]) => topic.tasks.find(task => task.id === id).type)).size === 9, 'Replay omitted an activity type');
      assert(replay.every(([anchor, id], i) => id !== run[i][1]), 'Replay repeated a slot variant');
      const saved = Object.values(JSON.parse(localStorage.getItem(key)))[0];
      assert(saved.completedTaskIds.length === topic.learningPath.length, 'Variants farmed extra stars');
      assert(saved.completedTaskIds.every(id => topic.learningPath.includes(id)), 'Stored variant instead of stable milestone');
      click('#brand');
    });
  } catch (error) { results.push({status: 'FAIL', reason: error.message}); }
  finally { if (old === null) localStorage.removeItem(key); else localStorage.setItem(key, old); await reloadTopic(); }
  return results;
}
