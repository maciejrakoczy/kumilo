import {solveTask, shownTask} from './browser-helpers.mjs';

// Run from a disposable preview origin; restores the user's stored progress.
export async function runKleksChecks() {
  const key = 'kumilo.progress.v1', previous = localStorage.getItem(key);
  const path = 'klasa-4/jezyk-polski/akademia-pana-kleksa/topic.json';
  const topic = await fetch(`./data/${path}`).then(response => response.json());
  const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
  const {mountTask} = await import(new URL(`./assets/tasks${extension}`, document.baseURI));
  const {evaluateTask} = await import(new URL(`./assets/core${extension}`, document.baseURI));
  const {activityScreen} = await import(new URL(`./assets/activity-view${extension}`, document.baseURI));
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const click = selector => {
    const node = document.querySelector(selector);
    assert(node && !node.disabled, `Missing ${selector}`);
    node.click();
  };
  const chooseTopic = async subject => {
    click('#brand'); click('[data-action="picker"]');
    const select = document.querySelector('#subject-select');
    select.value = subject; select.dispatchEvent(new Event('change', {bubbles: true}));
    document.querySelector('#picker-form').requestSubmit();
    for (let i = 0; i < 100; i++) {
      if (document.querySelector('[data-action="expedition"]')) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw Error(`Topic failed to load: ${subject}`);
  };
  const results = [];
  try {
    localStorage.removeItem(key);
    const historyPath = 'klasa-4/historia/detektywi-przeszlosci/topic.json';
    const history = await fetch(`./data/${historyPath}`).then(response => response.json());
    await chooseTopic('historia');
    click('[data-action="expedition"]');
    solveTask(shownTask(history)); click('[data-action="next-learn"]');
    const historyProgress = JSON.parse(localStorage.getItem(key))[historyPath];
    await chooseTopic('jezyk-polski');
    assert(document.title === `${topic.title} · Kumilo`, 'Catalog loaded another topic');
    const host = document.createElement('section'); document.body.append(host);
    try {
      for (const task of topic.tasks) {
        let completed = false;
        host.innerHTML = activityScreen({task, index: 1, total: 8});
        const area = host.querySelector('#task-area');
        const mounted = mountTask(area, task, {onComplete: () => { completed = true; }});
        try {
          solveTask(task, 'learn', false, area);
          assert(completed, `Could not finish ${task.id}`);
          assert(host.scrollWidth <= host.clientWidth + 1, `Activity overflows the viewport: ${task.id}`);
          if (!['discovery', 'flashcards'].includes(task.type)) assert(evaluateTask(task, mounted.getAnswer()), `Unsolvable key: ${task.id}`);
        } finally { mounted.destroy(); }
      }
    } finally { host.remove(); }
    results.push({name: 'Every Polish activity renders and accepts its answer', status: 'PASS', count: topic.tasks.length});
    click('[data-action="expedition"]');
    const visited = [];
    while (document.querySelector('#task-area') && visited.length < 49) {
      const task = shownTask(topic);
      assert(task, 'Displayed activity does not belong to Polish topic');
      assert(document.querySelectorAll('.journey-dot').length === 8, 'Wrong number of topic dots');
      if (visited.length === 3) {
        const current = task.id;
        await chooseTopic('historia');
        await chooseTopic('jezyk-polski');
        click('[data-action="expedition"]');
        assert(shownTask(topic).id === current, 'Subject switch lost the expedition cursor');
      }
      solveTask(task); visited.push(task.id); click('[data-action="next-learn"]');
    }
    assert(visited.length === 48 && new Set(visited).size === 48, 'Incomplete expedition');
    assert(document.querySelector('.celebrate h1')?.textContent === 'Cały dział odkryty!', 'Missing full expedition finish');
    const stored = JSON.parse(localStorage.getItem(key));
    assert(stored[path].learning.completedSlotIds.length === 48, 'Incorrect earned milestones');
    assert(JSON.stringify(stored[historyPath]) === JSON.stringify(historyProgress), 'Polish expedition changed saved history progress');
    results.push({name: 'All 48 steps complete and resume across subject switching', status: 'PASS'});
    click('#brand'); click('[data-action="lessons"]');
    assert(document.querySelectorAll('[data-lesson-id]').length === 8, 'Incomplete lesson library');
    assert(document.querySelector('.mindmap'), 'Missing mind map');
    click('#brand'); click('[data-action="test-intro"]');
    document.querySelector('#student-name').value = 'Próba';
    document.querySelector('#test-form').requestSubmit();
    const examIds = [];
    for (let i = 0; i < 16; i++) {
      const task = shownTask(topic); examIds.push(task.id); solveTask(task, 'test');
      assert(document.querySelector('#task-area .feedback').hidden, 'Exam reveals correctness before submission');
      click('[data-action="exam-next"]');
    }
    click('[data-action="submit-exam"]');
    assert(document.querySelector('.score').textContent === '16 / 16 pkt', 'Wrong exam score');
    const report = JSON.parse(localStorage.getItem(key))[path].lastResult;
    assert(report.results.length === 16 && new Set(examIds).size === 16, 'Saved unsampled questions');
    const tasks = new Map(topic.tasks.map(task => [task.id, task]));
    for (const group of topic.tests[0].draw) assert(examIds.filter(id => tasks.get(id).lessonIds.includes(group.lessonId)).length === group.count, `Omitted ${group.lessonId}`);
    results.push({name: 'Sampled exam covers all lessons and hides correctness until submission', status: 'PASS'});
    return results;
  } finally {
    if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous);
    await chooseTopic('jezyk-polski');
  }
}
