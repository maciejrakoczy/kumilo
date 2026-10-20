// Run on the app origin, in the browser. Works with sources and built .js modules.
import {solveTask, shownTask} from './browser-helpers.mjs';
export async function runRewardChecks() {
  const results = [], key = 'kumilo.progress.v1', previous = localStorage.getItem(key);
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const click = selector => {
    const node = document.querySelector(selector);
    assert(node && !node.disabled, `Unavailable: ${selector}`); node.click();
  };
  const wait = async predicate => {
    for (let i = 0; i < 100; i++) {
      if (predicate()) return;
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    throw new Error('Screen did not appear');
  };
  const reloadTopic = async () => {
    click('#brand'); click('[data-action="picker"]');
    document.getElementById('picker-form').requestSubmit();
    await wait(() => document.querySelector('[data-action="learn"]'));
  };
  const check = async (name, run) => {
    await run(); results.push({name, status: 'PASS'});
  };
  try {
    localStorage.removeItem(key); await reloadTopic();
    const topic = await fetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(r => r.json());
    const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
    const {testSummary} = await import(new URL(`./assets/selection${extension}`, document.baseURI));
    const solveFirst = () => solveTask(shownTask(topic));
    await check('First completion awards one star, a badge and a temporary celebration', async () => {
      click('[data-action="learn"]');
      assert(document.getElementById('reward-area').hidden, 'Reward visible before completing activity');
      assert(!document.querySelector('[data-action="next-learn"]:not(:disabled)'), 'Next unlocked too early');
      solveFirst();
      assert(document.getElementById('learn-stars').textContent === `1 / ${topic.learningPath.length}`, 'Star not awarded');
      assert(document.getElementById('reward-area').textContent.includes('Pierwszy krok'), 'First badge missing');
      assert(!document.querySelector('[data-action="next-learn"]').disabled, 'Next remained locked');
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) assert(document.querySelector('.star-burst'), 'Star burst missing');
      click('#brand'); assert(!document.querySelector('.star-burst'), 'Effects leaked across screens');
    });
    await check('Rewards survive topic reload and replay cannot farm more stars', async () => {
      await reloadTopic();
      assert(document.querySelector('.star-total').textContent.includes(`1 z ${topic.learningPath.length}`), 'Saved star missing');
      assert(document.querySelectorAll('.adventure-badge.earned').length === 1, 'Badge state not restored');
      click('[data-action="replay"]'); solveFirst();
      assert(document.getElementById('learn-stars').textContent.startsWith('1 /'), 'Replay duplicated star');
      assert(!document.getElementById('reward-area').textContent.includes('+1'), 'Replay claimed a new star');
      click('#brand');
    });
    await check('Untimed exam has no timer text, rewards or correctness effects before submission', async () => {
      click('[data-action="test-intro"]');
      assert(!/Bez stopera|Bez limitu czasu/.test(document.querySelector('main').textContent), 'Unwanted timer text');
      document.getElementById('student-name').value = 'Kontrola';
      document.getElementById('test-form').requestSubmit();
      assert(!document.getElementById('time-left'), 'Untimed exam renders timer');
      solveTask(shownTask(topic), 'test');
      assert(!document.querySelector('.star-burst,.reward-toast,.learning-loot'), 'Reward leaked into exam');
      assert(document.querySelector('#task-area .feedback').hidden, 'Correctness leaked into exam');
      for (let i = 0; i < testSummary(topic, topic.tests[0]).count; i++) click('[data-action="exam-next"]');
      click('[data-action="submit-exam"]'); click('#brand');
      assert(document.querySelector('.star-total').textContent.includes(`1 z ${topic.learningPath.length}`), 'Exam altered learning stars');
    });
    await check('Reduced motion skips particles without removing the static reward', async () => {
      const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
      const {celebrate} = await import(new URL(`./assets/rewards${extension}`, document.baseURI));
      const host = document.createElement('div'); document.body.append(host);
      const original = window.matchMedia;
      try {
        window.matchMedia = () => ({matches: true});
        const cleanup = celebrate(host);
        assert(!host.children.length, 'Reduced motion still created particles'); cleanup();
      } finally { window.matchMedia = original; host.remove(); }
      assert(document.querySelector('.adventure-badge.earned'), 'Static reward disappeared');
    });
  } catch (error) { results.push({status: 'FAIL', reason: error.message}); }
  finally {
    if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous);
    await reloadTopic();
  }
  return results;
}
