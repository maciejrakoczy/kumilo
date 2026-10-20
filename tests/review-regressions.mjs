// Focused real-DOM regressions reported by code review.
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const wait = async predicate => {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  throw new Error('Screen did not appear');
};
export async function checkRegression(name) {
  try {
    const topic = await fetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(r => r.json());
    const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
    const {mountTask} = await import(new URL(`./assets/tasks${extension}`, document.baseURI));
    if (name === 'flashcard-accessibility') {
      const host = document.createElement('section'); document.body.append(host);
      const task = topic.tasks.find(t => t.type === 'flashcards');
      const mounted = mountTask(host, task);
      try {
        const card = () => host.querySelector('[data-flip]');
        assert(!card().hasAttribute('aria-label'), 'aria-label hides flashcard content from accessible name');
        assert(card().textContent.includes(task.cards[0].front), 'Front text missing');
        card().click();
        assert(!card().hasAttribute('aria-label') && card().textContent.includes(task.cards[0].back), 'Back text hidden');
      } finally { mounted.destroy();host.remove(); }
    }
    if (name === 'inspect-and-edit-pairs') {
      const host = document.createElement('section'); document.body.append(host);
      const task = topic.tasks.find(t => t.type === 'matching');
      let mounted = mountTask(host, task, {mode:'test'});
      try {
        const left = task.pairs[0], right = task.pairs[1];
        host.querySelector(`[data-side="right"][data-pair="${right.id}"]`).click();
        host.querySelector(`[data-side="left"][data-pair="${left.id}"]`).click();
        const pair = host.querySelector(`[data-connection="${left.id}"]`);
        assert(pair?.textContent.includes(left.left) && pair.textContent.includes(right.right), 'User cannot inspect the actual chosen pair');
        const saved = mounted.getAnswer();mounted.destroy();
        mounted = mountTask(host, task, {mode:'test',answer:saved});
        assert(host.querySelector(`[data-connection="${left.id}"]`)?.textContent.includes(right.right), 'Connection lost when returning');
        host.querySelector(`[data-unpair="${left.id}"]`).click();
        assert(!Object.keys(mounted.getAnswer()).length, 'Disconnect did not clear this pair');
        assert(!host.querySelector(`[data-side="right"][data-pair="${right.id}"]`).disabled, 'Right card stayed locked');
        assert(host.querySelector('.feedback').hidden, 'Pair editor reveals correctness in test');
      } finally { mounted.destroy();host.remove(); }
    }
    if (name === 'review-without-related-activity') {
      const {validateTopic} = await import(new URL(`./assets/core${extension}`, document.baseURI));
      const fixture = structuredClone(topic);
      delete fixture.learningVariants;
      fixture.tests.forEach(test => { delete test.draw; });
      const failedTask = topic.tasks.find(t => t.id === topic.tests[0].questions[0].taskId);
      fixture.learningPath = [topic.learningPath.find(id => !topic.tasks.find(t => t.id === id).lessonIds.some(lesson => failedTask.lessonIds.includes(lesson)))];
      fixture.tests[0].questions = [fixture.tests[0].questions[0]];
      validateTopic(fixture);
      const originalFetch = window.fetch, key = 'kumilo.progress.v1', old = localStorage.getItem(key);
      const click = selector => { const node=document.querySelector(selector);assert(node,`Missing ${selector}`);node.click(); };
      window.fetch = (url, options) => String(url).includes('/topic.json')
        ? Promise.resolve(new Response(JSON.stringify(fixture), {headers:{'Content-Type':'application/json'}})) : originalFetch(url,options);
      try {
        click('#brand');click('[data-action="picker"]');document.getElementById('picker-form').requestSubmit();
        await wait(() => document.querySelector('[data-action="test-intro"]'));
        click('[data-action="test-intro"]');document.getElementById('student-name').value='Regresja';document.getElementById('test-form').requestSubmit();
        const task=fixture.tasks.find(t=>t.id===fixture.tests[0].questions[0].taskId);
        click(`[data-option="${task.options.find(o=>o.id!==task.correctOptionId).id}"]`);
        click('[data-action="exam-next"]');click('[data-action="submit-exam"]');click('[data-action="review-mistakes"]');
        assert(document.querySelector('[data-review-lessons]'), 'Empty activity review did not fall back to lesson revision');
        const lessons=[...document.querySelectorAll('[data-lesson-id]')];
        assert(lessons.length===task.lessonIds.length && lessons.every(node=>task.lessonIds.includes(node.dataset.lessonId)), 'Review includes unrelated lessons');
        assert(!document.querySelector('#task-area'), 'Empty activity was mounted');
      } finally {
        window.fetch=originalFetch;
        if(old===null)localStorage.removeItem(key);else localStorage.setItem(key,old);
        click('#brand');click('[data-action="picker"]');document.getElementById('picker-form').requestSubmit();
        await wait(()=>document.querySelector('[data-action="test-intro"]'));
      }
    }
    return {name,status:'PASS'};
  } catch(error) { return {name,status:'FAIL',reason:error.message}; }
}
