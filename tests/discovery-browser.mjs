// Run against either the source app or the built release, without touching progress.
export async function runDiscoveryChecks() {
  const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
  const {mountTask} = await import(new URL(`./assets/tasks${extension}`, document.baseURI));
  const host = document.createElement('section'); document.body.append(host);
  const task = {id: 'discovery-regression', type: 'discovery', title: 'Ślady', instruction: 'Odkryj karty.', lessonIds: ['sources'], explanation: 'Wspólne podsumowanie.', items: [
    {id: 'letter', text: 'List', icon: 'letter', explanation: 'Treść listu można odczytać.'},
    {id: 'pot', text: 'Garnek', icon: 'pot', explanation: 'Kształt pomaga poznać zastosowanie naczynia.'},
    {id: 'story', text: 'Opowieść', icon: 'story', explanation: '<img src=x onerror="alert(1)"> to tekst, nie kod.'},
  ]};
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  let completions = 0, state, mounted;
  try {
    mounted = mountTask(host, task, {controls: false, onStateChange: value => { state = value; }, onComplete: () => completions++});
    const click = id => host.querySelector(`[data-reveal="${id}"]`).click();
    click('letter');
    assert(host.querySelector('[data-reveal="letter"] small').textContent === task.items[0].explanation, 'Revealed content is not inside the card');
    assert(host.querySelector('[data-reveal="pot"] small').textContent === 'Kliknij i odkryj', 'Unseen card disclosed its content');
    assert(!host.querySelector('.feedback:not([hidden])'), 'Separate discovery bubble remains visible');
    assert(state.count === 1 && completions === 0, 'One card incorrectly completed the activity');
    click('pot'); click('story');
    for (const item of task.items) assert(host.querySelector(`[data-reveal="${item.id}"] small`).textContent === item.explanation, `Content vanished from ${item.id}`);
    assert(!host.querySelector('img[src="x"]'), 'Explanation was interpreted as HTML');
    assert(host.firstElementChild.matches('.feedback.success'), 'Completion lacks a top success message');
    assert(!host.querySelector('.feedback').textContent.includes(task.explanation), 'Completion duplicated the discovery explanation outside the cards');
    assert(state.solved && state.count === 3 && completions === 1, 'Full discovery did not complete exactly once');
    click('letter');
    assert(completions === 1 && state.count === 3, 'Repeated reveal added progress or another reward');
    return [{name: 'Discovery explanations stay in each card; top completion praise does not duplicate content or rewards', status: 'PASS'}];
  } catch (error) { return [{status: 'FAIL', reason: error.message}]; }
  finally { mounted?.destroy(); host.remove(); }
}
