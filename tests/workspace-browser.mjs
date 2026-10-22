import {solveTask} from './browser-helpers.mjs';

export async function runWorkspaceChecks() {
  const ext = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
  const {mountTask} = await import(new URL(`./assets/tasks${ext}`, document.baseURI));
  const topic = await fetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(r => r.json());
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const results = [], host = document.createElement('section'); document.body.append(host);
  const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
  let mounted;
  try {
    for (const type of new Set(topic.tasks.map(t => t.type))) {
      const task = topic.tasks.find(t => t.type === type);
      let state, completions = 0;
      mounted = mountTask(host, task, {controls: false, onStateChange: value => { state = value; }, onComplete: () => completions++});
      assert(!host.querySelector('[data-check]'), `Duplicated shared-footer control: ${type}`);
      assert(state && !state.solved && state.progressText, `Missing initial state: ${type}`);
      if (type === 'multiple-choice') {
        assert([...host.querySelectorAll('.letter')].every(marker => marker.textContent === ''), 'Unchecked choice contains an extra square glyph');
        const option = host.querySelector('[data-option]');
        option.focus();
        option.click();
        assert(host.querySelector('.option.selected .letter')?.textContent === '✓', 'Selected choice lacks a checkmark');
        assert(host.querySelector('.option.selected')?.getAttribute('aria-pressed') === 'true', 'Selected choice lacks accessible state');
        host.querySelector('.option.selected').click();
        assert([...host.querySelectorAll('.letter')].every(marker => marker.textContent === ''), 'Deselected choice is not empty');
      }
      if (type === 'number-answer' || type === 'short-answer') {
        assert(!state.canCheck, `Empty input checkable: ${type}`);
        const input = host.querySelector('input'); input.value = type === 'number-answer' ? String(task.answer) : task.acceptedAnswers[0]; input.dispatchEvent(new Event('input', {bubbles: true}));
        assert(state.canCheck && state.count === 1, `Input did not update footer state: ${type}`);
      }
      solveTask(task, 'learn', false, host);
      if (state.checkable) mounted.check();
      assert(state.solved && completions === 1 && !state.canCheck, `External check did not finish: ${type}`);
      mounted.check(); assert(completions === 1, `Duplicate completion: ${type}`);
      mounted.destroy();
      if (!['discovery', 'flashcards'].includes(type)) {
        mounted = mountTask(host, task, {mode: 'test', controls: false, onStateChange: value => { state = value; }});
        solveTask(task, 'test', false, host); mounted.check();
        assert(!state.solved && !state.canCheck && host.querySelector('.feedback').hidden, `External check leaked correctness: ${type}`);
        mounted.destroy();
      }
    }
    results.push({name: 'Shared-footer state and external check work for all task types without assessment feedback', status: 'PASS'});
    const task = topic.tasks.find(t => t.type === 'matching'), first = task.pairs[0], second = task.pairs[1];
    mounted = mountTask(host, task, {mode: 'test'});
    host.querySelector(`[data-side="left"][data-pair="${first.id}"]`).click(); host.querySelector(`[data-side="right"][data-pair="${second.id}"]`).click();
    await frame();
    const line = host.querySelector('.pair-lines path');
    assert(line && line.dataset.linkLeft === first.id, 'SVG did not reflect chosen connection');
    const badges = [...host.querySelectorAll('.pair-number')].map(n => n.textContent);
    assert(badges.length === 2 && badges[0] === badges[1], 'Pair endpoints lack matching number');
    assert(!host.querySelector('.matched') && host.querySelector('.feedback').hidden, 'Wrong test pair was graded early');
    const svg = host.querySelector('.pair-lines'); mounted.destroy(); window.dispatchEvent(new Event('resize')); await frame();
    assert(!svg.isConnected && !host.querySelector('.pair-lines'), 'SVG survived renderer cleanup');
    results.push({name: 'Numbered SVG links reflect actual test choices and clean up on destroy', status: 'PASS'});
  } catch (error) { results.push({status: 'FAIL', reason: error.message}); }
  finally { mounted?.destroy(); host.remove(); }
  return results;
}
