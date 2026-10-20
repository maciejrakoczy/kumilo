// Run in a real browser on the application origin. Preserves its prior storage.
import {solveTask, shownTask, answerSignature} from './browser-helpers.mjs';
export async function runBrowserChecks() {
  const results = [];
  const key = 'kumilo.progress.v1';
  const previous = localStorage.getItem(key);
  const topic = await fetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(r => r.json());
  const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
  const {testSummary} = await import(new URL(`./assets/selection${extension}`, document.baseURI));
  const questionCount = testSummary(topic, topic.tests[0]).count;
  const app = document.getElementById('app');
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const click = selector => {
    const element = document.querySelector(selector);
    assert(element && !element.disabled, `Control unavailable: ${selector}`);
    element.click();
  };
  const wait = async predicate => {
    for (let i = 0; i < 100; i++) {
      if (predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    throw new Error('Timed out waiting for screen');
  };
  const check = async (name, run) => {
    try { await run(); results.push({name, status:'PASS'}); }
    catch (error) { results.push({name, status:'FAIL', reason:error.message}); throw error; }
  };
  function setInput(selector, value) {
    const input = document.querySelector(selector); input.value = value;
    input.dispatchEvent(new Event('input', {bubbles:true}));
  }
  function solve(task, mode = 'learn', wrong = false) {
    const root = app.querySelector('#task-area');
    assert(root.dataset.taskId === task.id, `Expected task ${task.id}`);
    solveTask(task, mode, wrong, root);
  }
  try {
    await check('JSON app loads with shared owl logo', async () => {
      await wait(() => app.querySelector('[data-action="learn"]'));
      assert(app.querySelector('h1').textContent === topic.title, 'Title is not from JSON');
      assert(document.querySelector('#brand img').getAttribute('src') === './assets/owl.svg', 'Shared owl logo missing');
      assert(document.querySelector('link[rel="icon"]').getAttribute('href') === './assets/owl.svg', 'Owl favicon missing');
    });
    await check('Complete all nine learning activities from JSON', async () => {
      const start = app.querySelector('[data-action="replay"]') ? '[data-action="replay"]' : '[data-action="learn"]';
      click(start);
      for (const id of topic.learningPath) {
        solve(shownTask(topic));
        assert(!app.querySelector('[data-action="next-learn"]').disabled, `${id} did not finish`);
        click('[data-action="next-learn"]');
      }
      assert(app.querySelector('h1').textContent.includes('medal'), 'Missing expedition completion');
      assert(JSON.parse(localStorage.getItem(key)), 'Progress was not saved');
    });
    await check('Lesson descriptions and mind map come from JSON', async () => {
      click('[data-action="home"]'); click('[data-action="lessons"]');
      assert(app.querySelectorAll('[data-lesson-id]').length === topic.lessons.length, 'Missing lessons');
      const details = app.querySelector('[data-lesson-id]'); details.open = true;
      await new Promise(resolve => setTimeout(resolve, 40));
      assert(app.querySelectorAll('.map-node').length >= topic.mindMap.children.length, 'Mind map is incomplete');
      click('#brand');
    });
    await check('Unavailable JSON shows recoverable error without deleting progress', async () => {
      const saved = localStorage.getItem(key);
      const originalFetch = window.fetch;
      window.fetch = (url, options) => originalFetch(String(url).includes('/topic.json') ? './data/missing-topic.json' : url, options);
      try {
        click('[data-action="picker"]'); document.getElementById('picker-form').requestSubmit();
        await wait(() => app.querySelector('[data-action="retry"]'));
        assert(localStorage.getItem(key) === saved, 'Load error deleted progress');
      } finally { window.fetch = originalFetch; }
      click('[data-action="retry"]');
      await wait(() => app.querySelector('[data-action="test-intro"]'));
    });
    await check('Full 16-question exam, back navigation and final grading', async () => {
      click('[data-action="test-intro"]'); setInput('#student-name', 'Browserowy Odkrywca');
      document.getElementById('test-form').requestSubmit();
      const definition = topic.tests[0];
      let firstAnswer;
      for (let index = 0; index < questionCount; index++) {
        const task = shownTask(topic);
        solve(task, 'test');
        if (index === 0) firstAnswer = answerSignature();
        assert(app.querySelector('#task-area .feedback').hidden, 'Test leaked immediate feedback');
        if (index === 1) {
          click('[data-action="exam-back"]');
          assert(answerSignature() === firstAnswer, 'Previous answer was lost');
          click('[data-action="exam-next"]');
        }
        click('[data-action="exam-next"]');
      }
      assert(app.querySelectorAll('[data-question]').length === questionCount, 'Missing final review');
      click('[data-action="submit-exam"]');
      assert(app.querySelector('.score').textContent === '16 / 16 pkt', 'Incorrect full exam grade');
      assert(!app.querySelector('.owl-reaction'), 'Perfect result showed a disappointed owl');
      assert(app.querySelectorAll('.review').length === questionCount, 'Missing answer explanations');
      assert(!localStorage.getItem(key).includes('Browserowy Odkrywca'), 'Student name was persisted');
      click('[data-action="home"]');
      assert(app.querySelector('[data-action="last-result"]'), 'Last result missing');
    });
    await check('Incorrect result leads to related learning, not repeated test questions', async () => {
      click('[data-action="test-intro"]'); setInput('#student-name', 'Powtórka');
      document.getElementById('test-form').requestSubmit();
      let failedTask;
      for (let index = 0; index < questionCount; index++) {
        const task = shownTask(topic);
        if (index === 0) failedTask = task;
        solve(task, 'test', index === 0);
        click('[data-action="exam-next"]');
      }
      click('[data-action="submit-exam"]');
      assert(app.querySelector('.score').textContent === '15 / 16 pkt', 'Wrong answer did not lose a point');
      assert(app.querySelector('.celebrate .owl-reaction.result-owl'), 'Submitted mistakes did not show owl reaction');
      click('[data-action="review-mistakes"]');
      assert(shownTask(topic).lessonIds.some(id => failedTask.lessonIds.includes(id)), 'Review did not select a related lesson activity');
      const expected = topic.learningPath.filter(id => topic.tasks.find(t => t.id === id).lessonIds.some(lesson => failedTask.lessonIds.includes(lesson))).length;
      assert(Number(app.querySelector('[role="progressbar"]').getAttribute('aria-valuemax')) === expected, 'Review contains unrelated tasks');
      click('#brand');
    });
    await check('All input renderers: reverse pairs, comma decimals and text escaping', async () => {
      const {mountTask} = await import(new URL(`./assets/tasks${extension}`, document.baseURI));
      const host = document.createElement('section'); document.body.append(host);
      try {
        const matching = topic.tasks.find(task => task.type === 'matching');
        let mounted = mountTask(host, matching, {mode:'test'});
        host.querySelector(`[data-side="right"][data-pair="${matching.pairs[0].id}"]`).click();
        host.querySelector(`[data-side="left"][data-pair="${matching.pairs[1].id}"]`).click();
        assert(host.querySelector('.feedback').hidden, 'Test matching leaked wrong-answer feedback');
        assert(host.querySelector('.linked') && !host.querySelector('.matched'), 'Test pairing implies correctness');
        mounted.destroy();
        const number = structuredClone(topic.tasks.find(task => task.type === 'number-answer'));
        number.answer = 1.5; let finished = false;
        mounted = mountTask(host, number, {onComplete: () => { finished = true; }});
        const input = host.querySelector('input'); input.value = '1,5'; input.dispatchEvent(new Event('input',{bubbles:true})); host.querySelector('[data-check]').click();
        assert(finished, 'Polish decimal answer failed'); mounted.destroy();
        const discovery = structuredClone(topic.tasks.find(task => task.type === 'discovery'));
        discovery.items[0].text = '<img src=x onerror=alert(1)>';
        mounted = mountTask(host, discovery);
        assert(host.querySelector('b').textContent === discovery.items[0].text, 'Data text not escaped');
        assert(!host.querySelector('img[src="x"]'), 'Data injected markup'); mounted.destroy();
      } finally { host.remove(); }
    });
    await check('Ordering: drag, touch cancellation and arrows share one answer', async () => {
      const {mountTask} = await import(new URL(`./assets/tasks${extension}`, document.baseURI));
      const host = document.createElement('section'); document.body.append(host);
      const task = topic.tasks.find(task => task.type === 'ordering');
      const mounted = mountTask(host, task, {mode:'test'});
      const initialOrder = mounted.getAnswer();
      try {
        host.scrollIntoView();
        const rows = host.querySelectorAll('[data-order-index]');
        const dataTransfer = new DataTransfer();
        rows[1].dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer}));
        const target = rows[0].getBoundingClientRect();
        rows[0].dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer,clientX:target.x+100,clientY:target.y+5}));
        assert(mounted.getAnswer()[0] === initialOrder[1], 'Native drag did not reorder');
        host.querySelector('[data-move="0,1"]').click();
        assert(mounted.getAnswer()[0] === initialOrder[0], 'Arrow did not restore order');
        host.scrollIntoView();
        const handle = host.querySelectorAll('.drag-handle')[1], rect=handle.getBoundingClientRect();
        const pointer = (node,type,x,y) => node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:37,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:y}));
        pointer(handle,'pointerdown',rect.x+10,rect.y+10);
        pointer(document,'pointermove',rect.x+10,rect.y-60);
        pointer(document,'pointercancel',rect.x+10,rect.y-60);
        assert(mounted.getAnswer()[0] === initialOrder[0], 'Cancelled touch changed order');
        assert(!document.querySelector('.drag-ghost'), 'Ghost leaked after cancellation');
      } finally { mounted.destroy();host.remove();window.scrollTo(0,0); }
    });
    await check('Clear own data only', async () => {
      const sentinel = 'kumilo.verification.sentinel';
      const old = localStorage.getItem(sentinel);
      localStorage.setItem(sentinel, 'keep');
      try {
        click('#privacy-button'); click('#clear-progress');
        assert(localStorage.getItem(key) === null, 'Kumilo progress was not removed');
        assert(localStorage.getItem(sentinel) === 'keep', 'Unrelated local storage was removed');
        click('[data-close="privacy"]');
      } finally { if (old === null) localStorage.removeItem(sentinel); else localStorage.setItem(sentinel, old); }
    });
  } catch { /* The failing check already includes its reason. */ }
  finally { if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous); }
  return results;
}
