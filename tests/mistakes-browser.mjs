// Run on a source or release app page; no changes to stored learner progress.
export async function runMistakeChecks() {
  const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
  const {mountTask} = await import(new URL(`./assets/tasks${extension}`, document.baseURI));
  const topic = await fetch(new URL('./data/klasa-4/historia/detektywi-przeszlosci/topic.json', document.baseURI)).then(r => r.json());
  const host = document.createElement('section'); document.body.append(host);
  const results = [];
  const assert = (value, label) => { if (!value) throw new Error(label); };
  const click = selector => { const button = host.querySelector(selector); assert(button && !button.disabled, `Unavailable: ${selector}`); button.click(); };
  let mounted;
  try {
    for (const type of ['single-choice', 'multiple-choice', 'matching', 'sorting', 'ordering', 'short-answer', 'number-answer']) {
      const task = topic.tasks.find(t => t.type === type);
      assert(task, `Missing fixture: ${type}`);
      let completions = 0;
      mounted = mountTask(host, task, {onComplete: () => completions++});
      if (type === 'single-choice') click(`[data-option="${task.options.find(o => o.id !== task.correctOptionId).id}"]`);
      else if (type === 'matching') { click(`[data-side="left"][data-pair="${task.pairs[0].id}"]`); click(`[data-side="right"][data-pair="${task.pairs[1].id}"]`); }
      else if (type === 'ordering') { // Guarantee an incorrect permutation, independent of source ordering.
        for (let i = 0; i < task.correctOrder.length; i++) {
          const desired = [...task.correctOrder].reverse()[i];
          let index = mounted.getAnswer().indexOf(desired);
          while (index > i) { click(`[data-move="${index},-1"]`); index--; }
        }
        click('[data-check]');
      } else click('[data-check]');
      assert(host.querySelector('.feedback.retry .owl-reaction'), `Sad owl missing for ${type}`);
      assert(host.querySelector('.owl-tear'), `Tear missing for ${type}`);
      assert(host.querySelector('.feedback').textContent.includes('Spróbujmy jeszcze raz'), `Encouragement missing for ${type}`);
      assert(completions === 0, `Wrong answer completed ${type}`);
      if (type === 'single-choice') click(`[data-option="${task.correctOptionId}"]`);
      if (type === 'multiple-choice') { task.correctOptionIds.forEach(id => click(`[data-option="${id}"]`)); click('[data-check]'); }
      if (type === 'matching') for (const pair of task.pairs) {
        // Deselect the retained first card before connecting all pairs.
        const picked = host.querySelector('.pair.picked'); if (picked) picked.click();
        click(`[data-side="left"][data-pair="${pair.id}"]`); click(`[data-side="right"][data-pair="${pair.id}"]`);
      }
      if (type === 'sorting') {
        for (const item of task.items) { const select = host.querySelector(`[data-category="${item.id}"]`); select.value = item.categoryId; select.dispatchEvent(new Event('change', {bubbles: true})); }
        click('[data-check]');
      }
      if (type === 'ordering') {
        for (let i = 0; i < task.correctOrder.length; i++) { let index = mounted.getAnswer().indexOf(task.correctOrder[i]); while (index > i) { click(`[data-move="${index},-1"]`); index--; } }
        click('[data-check]');
      }
      if (['short-answer', 'number-answer'].includes(type)) {
        const input = host.querySelector('[data-text-answer]'); input.value = type === 'short-answer' ? task.acceptedAnswers[0] : String(task.answer);
        input.dispatchEvent(new Event('input', {bubbles: true}));
        assert(!host.querySelector('.feedback.retry'), 'Stale disappointment while editing');
        click('[data-check]');
      }
      assert(completions === 1, `Correction did not complete ${type}`);
      assert(!host.querySelector('.owl-reaction'), `Sad owl remained after success: ${type}`);
      mounted.destroy();
      // Test mode must not reveal whether an answer is right.
      mounted = mountTask(host, task, {mode: 'test'});
      if (type === 'single-choice') click(`[data-option="${task.options.find(o => o.id !== task.correctOptionId).id}"]`);
      if (type === 'matching') { click(`[data-side="left"][data-pair="${task.pairs[0].id}"]`); click(`[data-side="right"][data-pair="${task.pairs[1].id}"]`); }
      assert(!host.querySelector('.owl-reaction,.feedback.retry'), `Emotion leaked into exam: ${type}`);
      assert(host.querySelector('.feedback').hidden, `Feedback leaked into exam: ${type}`);
      mounted.destroy();
      results.push({name: `${type}: retry, correction, no exam hint`, status: 'PASS'});
    }
  } catch (error) { results.push({status: 'FAIL', reason: error.message}); }
  finally { mounted?.destroy(); host.remove(); }
  return results;
}
