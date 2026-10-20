import {solveTask, shownTask} from './browser-helpers.mjs';

export async function runPresentationChecks() {
  const topic = await fetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(r => r.json());
  const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
  const {mountTask} = await import(new URL(`./assets/tasks${extension}`, document.baseURI));
  const {count} = (await import(new URL(`./assets/selection${extension}`, document.baseURI))).testSummary(topic, topic.tests[0]);
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const order = host => [...host.querySelectorAll('[data-option], [data-side="right"]')].map(n => n.dataset.option || n.dataset.pair).join(',');
  const host = document.createElement('section'); document.body.append(host);
  const random = Math.random, results = [];
  let mounted;
  try {
    for (const type of ['single-choice', 'multiple-choice', 'matching']) {
      const task = topic.tasks.find(t => t.type === type), presentation = {};
      Math.random = () => 0;
      mounted = mountTask(host, task, {mode: 'test', presentation});
      solveTask(task, 'test', false, host);
      const before = order(host), answer = mounted.getAnswer(); mounted.destroy();
      Math.random = () => 0.999;
      mounted = mountTask(host, task, {mode: 'test', presentation, answer});
      assert(order(host) === before, `Presentation rerolled: ${task.id}`);
      assert(JSON.stringify(mounted.getAnswer()) === JSON.stringify(answer), 'Answer lost during remount');
      mounted.destroy();
    }
    results.push({name: 'Choice and pair layouts survive remounts', status: 'PASS'});
    Math.random = random;
    document.getElementById('brand').click();
    document.querySelector('[data-action="test-intro"]').click();
    document.getElementById('student-name').value = 'Układ odpowiedzi';
    document.getElementById('test-form').requestSubmit();
    for (let i = 0; i < count; i++) {
      const task = shownTask(topic), before = order(document.getElementById('task-area'));
      solveTask(task, 'test');
      document.querySelector('[data-action="exam-next"]').click();
      document.querySelector(i === count - 1 ? `[data-question="${i}"]` : '[data-action="exam-back"]').click();
      assert(order(document.getElementById('task-area')) === before, `Back navigation changed layout: ${task.id}`);
      document.querySelector('[data-action="exam-next"]').click();
    }
    results.push({name: 'All sampled question layouts survive back and review navigation', status: 'PASS'});
  } catch (error) { results.push({status: 'FAIL', reason: error.message}); }
  finally {
    Math.random = random; mounted?.destroy(); host.remove();
    const confirm = window.confirm; window.confirm = () => true;
    try { document.getElementById('brand').click(); } finally { window.confirm = confirm; }
  }
  return results;
}
