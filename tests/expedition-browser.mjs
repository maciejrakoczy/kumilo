import {solveTask, shownTask} from './browser-helpers.mjs';

export async function checkExpedition() {
  const key = 'kumilo.progress.v1', previous = localStorage.getItem(key);
  const topic = await fetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(response => response.json());
  const extension = document.querySelector('script[type="module"]').getAttribute('src').endsWith('.js') ? '.js' : '.mjs';
  const {learningSlots} = await import(new URL(`./assets/learning-plan${extension}`, document.baseURI));
  const slots = learningSlots(topic), total = slots.length;
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const click = selector => { const node = document.querySelector(selector); assert(node && !node.disabled, `Missing ${selector}`); node.click(); };
  const saved = () => Object.values(JSON.parse(localStorage.getItem(key)))[0].learning;
  const reload = async () => {
    click('#brand'); click('[data-action="picker"]'); document.querySelector('#picker-form').requestSubmit();
    for (let i = 0; i < 100; i++) {
      if (document.querySelector('[data-action="expedition"]')) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw Error('Expedition home failed to load');
  };
  try {
    localStorage.removeItem(key); await reload(); click('[data-action="expedition"]');
    const visited = [], themes = new Set();
    while (document.querySelector('#task-area') && visited.length < total + 2) {
      const task = shownTask(topic);
      themes.add(task.lessonIds[0]);
      assert(document.querySelectorAll('.journey-dot').length === topic.learningPlan.lessons.length, 'Expedition dots must represent topics, not overflow with every task');
      if (visited.length === 2) {
        const id = task.id;
        await reload();
        assert(document.querySelector('[data-action="expedition"]').textContent.includes('Kontynuuj wyprawę'), 'Home lost the expedition cursor');
        click('[data-action="expedition"]');
        assert(shownTask(topic).id === id, 'Expedition resume rerolled the activity');
      }
      if (visited.length === total - 1) {
        solveTask(task, 'learn', true);
        assert(document.querySelector('.feedback.retry'), 'Expected mistake feedback');
        if (task.type === 'multiple-choice') document.querySelectorAll('#task-area .option.selected').forEach(node => node.click());
        solveTask(task);
        assert(document.querySelector('[data-action="next-learn"]').textContent.includes('Dalej'), 'Last base task must not claim to finish before its extra example');
        click('[data-action="next-learn"]');
        const extra = shownTask(topic).id;
        await reload(); click('[data-action="expedition"]');
        assert(shownTask(topic).id === extra && extra !== task.id, 'Extra example did not resume');
        visited.push(task.id);
        continue;
      }
      solveTask(task); visited.push(task.id); click('[data-action="next-learn"]');
    }
    assert(visited.length === total + 1 && new Set(visited).size === visited.length, 'Expedition skipped or repeated an activity');
    assert(themes.size === topic.learningPlan.lessons.length, 'Expedition stopped before covering every topic');
    assert(document.querySelector('.celebrate h1')?.textContent === 'Cały dział odkryty!', 'Whole-expedition summary missing');
    assert(saved().completedSlotIds.length === total && saved().expeditionSlotId === null, 'Extra example changed milestones or completion cursor');
    click('#brand'); click('[data-action="expedition"]');
    solveTask(shownTask(topic)); click('[data-action="next-learn"]');
    const replayTask = shownTask(topic).id;
    await reload(); click('[data-action="expedition"]');
    assert(shownTask(topic).id === replayTask, 'Replay skipped earned milestones instead of resuming its cursor');
    assert(saved().completedSlotIds.length === total, 'Replay awarded additional stars');
    return {name: 'Full expedition covers all JSON topics, resumes, handles an extra example and preserves replay stars', status: 'PASS'};
  } catch (error) { return {status: 'FAIL', reason: error.message}; }
  finally {
    if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous);
    await reload();
  }
}
