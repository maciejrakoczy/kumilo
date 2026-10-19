// Run in a real browser on the application origin. Preserves its prior storage.
export async function runBrowserChecks() {
  const results = [];
  const key = 'kumilo.progress.v1';
  const previous = localStorage.getItem(key);
  const topic = await fetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(r => r.json());
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
    const press = selector => root.querySelector(selector).click();
    if (task.type === 'discovery') task.items.forEach(item => press(`[data-reveal="${item.id}"]`));
    if (task.type === 'flashcards') task.cards.forEach((card, i) => { press('[data-flip]'); if (i < task.cards.length - 1) press('[data-card="1"]'); });
    if (task.type === 'single-choice') press(`[data-option="${wrong ? task.options.find(o => o.id !== task.correctOptionId).id : task.correctOptionId}"]`);
    if (task.type === 'multiple-choice') task.correctOptionIds.forEach(id => press(`[data-option="${id}"]`));
    if (task.type === 'matching') task.pairs.forEach((pair, index) => {
      const side = index % 2 ? 'left' : 'right';
      press(`[data-side="${side}"][data-pair="${pair.id}"]`);
      press(`[data-side="${side === 'left' ? 'right' : 'left'}"][data-pair="${pair.id}"]`);
    });
    if (task.type === 'sorting') task.items.forEach(item => {
      const select = root.querySelector(`[data-category="${item.id}"]`); select.value = item.categoryId;
      select.dispatchEvent(new Event('change', {bubbles:true}));
    });
    if (task.type === 'ordering') task.correctOrder.forEach((id, desired) => {
      const label = task.items.find(item => item.id === id).text;
      let index = [...root.querySelectorAll('.time-card b')].findIndex(item => item.textContent === label);
      while (index > desired) { press(`[data-move="${index},-1"]`); index--; }
    });
    if (task.type === 'short-answer') setInput('[data-text-answer]', `  ${task.acceptedAnswers[0].toUpperCase()}  `);
    if (task.type === 'number-answer') setInput('[data-text-answer]', String(task.answer).replace('.', ','));
    if (mode === 'learn' && root.querySelector('[data-check]')) press('[data-check]');
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
        solve(topic.tasks.find(task => task.id === id));
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
      for (let index = 0; index < definition.questions.length; index++) {
        const task = topic.tasks.find(task => task.id === definition.questions[index].taskId);
        solve(task, 'test');
        assert(app.querySelector('#task-area .feedback').hidden, 'Test leaked immediate feedback');
        if (index === 1) {
          click('[data-action="exam-back"]');
          assert(app.querySelector('.option.selected'), 'Previous answer was lost');
          click('[data-action="exam-next"]');
        }
        click('[data-action="exam-next"]');
      }
      assert(app.querySelectorAll('[data-question]').length === definition.questions.length, 'Missing final review');
      click('[data-action="submit-exam"]');
      assert(app.querySelector('.score').textContent === '16 / 16 pkt', 'Incorrect full exam grade');
      assert(app.querySelectorAll('.review').length === definition.questions.length, 'Missing answer explanations');
      assert(!localStorage.getItem(key).includes('Browserowy Odkrywca'), 'Student name was persisted');
      click('[data-action="home"]');
      assert(app.querySelector('[data-action="last-result"]'), 'Last result missing');
    });
    await check('Incorrect result leads to related learning, not repeated test questions', async () => {
      click('[data-action="test-intro"]'); setInput('#student-name', 'Powtórka');
      document.getElementById('test-form').requestSubmit();
      for (const [index, q] of topic.tests[0].questions.entries()) {
        solve(topic.tasks.find(task => task.id === q.taskId), 'test', index === 0);
        click('[data-action="exam-next"]');
      }
      click('[data-action="submit-exam"]');
      assert(app.querySelector('.score').textContent === '15 / 16 pkt', 'Wrong answer did not lose a point');
      click('[data-action="review-mistakes"]');
      assert(app.querySelector('#task-area').dataset.taskId === 'fiszki-historyka', 'Review did not select related lesson activity');
      assert(app.querySelector('[role="progressbar"]').getAttribute('aria-valuemax') === '1', 'Review contains unrelated tasks');
      click('#brand');
    });
    await check('All input renderers: reverse pairs, comma decimals and text escaping', async () => {
      const {mountTask} = await import(new URL('./assets/tasks.mjs', document.baseURI));
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
      const {mountTask} = await import(new URL('./assets/tasks.mjs', document.baseURI));
      const host = document.createElement('section'); document.body.append(host);
      const task = topic.tasks.find(task => task.type === 'ordering');
      const mounted = mountTask(host, task, {mode:'test'});
      try {
        host.scrollIntoView();
        const rows = host.querySelectorAll('[data-order-index]');
        const dataTransfer = new DataTransfer();
        rows[1].dispatchEvent(new DragEvent('dragstart',{bubbles:true,cancelable:true,dataTransfer}));
        const target = rows[0].getBoundingClientRect();
        rows[0].dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer,clientX:target.x+100,clientY:target.y+5}));
        assert(mounted.getAnswer()[0] === task.items[1].id, 'Native drag did not reorder');
        host.querySelector('[data-move="0,1"]').click();
        assert(mounted.getAnswer()[0] === task.items[0].id, 'Arrow did not restore order');
        host.scrollIntoView();
        const handle = host.querySelectorAll('.drag-handle')[1], rect=handle.getBoundingClientRect();
        const pointer = (node,type,x,y) => node.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:37,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:y}));
        pointer(handle,'pointerdown',rect.x+10,rect.y+10);
        pointer(document,'pointermove',rect.x+10,rect.y-60);
        pointer(document,'pointercancel',rect.x+10,rect.y-60);
        assert(mounted.getAnswer()[0] === task.items[0].id, 'Cancelled touch changed order');
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
