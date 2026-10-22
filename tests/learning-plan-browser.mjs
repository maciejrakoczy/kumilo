import {solveTask, shownTask} from './browser-helpers.mjs';

export async function checkLearningPlanConfiguration() {
  const key = 'kumilo.progress.v1', previous = localStorage.getItem(key), originalFetch = window.fetch;
  const topic = await originalFetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(response => response.json());
  const fixture = structuredClone(topic), lesson = fixture.learningPlan.lessons[0];
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const click = selector => document.querySelector(selector).click();
  const reload = async () => {
    click('#brand'); click('[data-action="picker"]'); document.querySelector('#picker-form').requestSubmit();
    for (let i = 0; i < 100; i++) {
      if (document.querySelector('[data-action="learn"]')) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw Error('Configuration fixture failed to reload');
  };
  [lesson.steps[0], lesson.steps[1]] = [lesson.steps[1], lesson.steps[0]];
  lesson.steps[0].hints = false; lesson.steps[0].title = 'Trop z konfiguracji';
  const expanded = lesson.steps.find(step => step.taskIds.length >= 2);
  expanded.count = 2;
  window.fetch = (url, options) => String(url).endsWith('/topic.json')
    ? Promise.resolve(new Response(JSON.stringify(fixture), {headers: {'Content-Type': 'application/json'}})) : originalFetch(url, options);
  try {
    localStorage.removeItem(key); await reload(); click('[data-action="learn"]');
    click(`[data-action="learn-lesson"][data-lesson="${lesson.lessonId}"]`);
    const selected = Object.values(JSON.parse(localStorage.getItem(key)))[0].learning.selected;
    assert(Object.keys(selected).length === 43 && new Set(Object.values(selected)).size === 43, 'Count override produced duplicates or hardcoded course size');
    assert(document.querySelectorAll('.journey-dot').length === 7, 'UI hardcoded six activities');
    assert(lesson.steps[0].taskIds.includes(shownTask(fixture).id), 'UI ignored configured step order');
    assert(!document.querySelector('[data-action="toggle-hint"]'), 'UI ignored a per-topic hint override');
    assert(document.querySelector('.session-heading h2').textContent.startsWith('Trop z konfiguracji'), 'UI ignored a title override');
    let count = 0;
    while (document.querySelector('#task-area') && count++ < 10) { solveTask(shownTask(fixture)); click('[data-action="next-learn"]'); }
    assert(count === 7 && document.querySelector('.celebrate'), 'Expanded topic did not finish after seven activities');
    assert(Object.values(JSON.parse(localStorage.getItem(key)))[0].learning.completedSlotIds.length === 7, 'Count override did not award seven independent milestones');
    return {name: 'JSON overrides order, count, hints and titles without changing application code', status: 'PASS'};
  } catch (error) { return {status: 'FAIL', reason: error.message}; }
  finally {
    window.fetch = originalFetch;
    if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous);
    await reload();
  }
}

export async function runLearningPlanChecks() {
  const results = [], key = 'kumilo.progress.v1', previous = localStorage.getItem(key);
  const topic = await fetch('./data/klasa-4/historia/detektywi-przeszlosci/topic.json').then(response => response.json());
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const click = selector => { const element = document.querySelector(selector); assert(element && !element.disabled, `Missing control: ${selector}`); element.click(); };
  const saved = () => Object.values(JSON.parse(localStorage.getItem(key)))[0];
  const reload = async () => {
    click('#brand'); click('[data-action="picker"]'); document.querySelector('#picker-form').requestSubmit();
    for (let i = 0; i < 100; i++) {
      if (document.querySelector('[data-action="learn"]')) return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw Error('Topic failed to reload');
  };
  const check = async (name, run) => { await run(); results.push({name, status: 'PASS'}); };
  try {
    localStorage.removeItem(key); await reload();
    await check('Topic chooser uses JSON and new progress is independent of legacy achievements', () => {
      click('[data-action="learn"]');
      assert(document.querySelectorAll('[data-action="learn-lesson"]').length === topic.lessons.length, 'Missing topic menu');
      assert(topic.learningPlan, 'Missing data-driven plan');
    });
    const lessonId = topic.learningPlan.lessons[0].lessonId;
    await check('A topic draws six activities; resume preserves the active task and only displayed history', async () => {
      click(`[data-action="learn-lesson"][data-lesson="${lessonId}"]`);
      const first = shownTask(topic).id;
      assert(document.querySelectorAll('.journey-dot').length === 6, 'Topic did not draw six steps');
      assert(Object.keys(saved().learning.selected).length === 42, 'The full plan was not prepared');
      assert(Object.keys(saved().learning.seen).length === 1, 'Future tasks counted as displayed');
      await reload(); click('[data-action="learn"]'); click(`[data-action="learn-lesson"][data-lesson="${lessonId}"]`);
      assert(shownTask(topic).id === first, 'Resume rerolled current activity');
    });
    await check('A corrected mistake adds one different example, resumes it and awards no additional star', async () => {
      for (let i = 0; i < 2; i++) { solveTask(shownTask(topic)); click('[data-action="next-learn"]'); }
      const base = shownTask(topic);
      solveTask(base, 'learn', true);
      assert(document.querySelector('.feedback.retry'), 'Mistake feedback missing');
      if (base.type === 'multiple-choice') document.querySelectorAll('#task-area .option.selected').forEach(option => option.click());
      solveTask(base);
      const entry = Object.values(saved().learning.extraPractice)[0];
      assert(entry && entry.taskId !== base.id && !entry.done, 'Different extra example was not scheduled');
      assert(document.querySelectorAll('.journey-dot').length === 7, 'Progress dots did not include the scheduled extra example');
      click('[data-action="next-learn"]');
      assert(shownTask(topic).id === entry.taskId, 'Extra example not shown after base activity');
      await reload(); click('[data-action="learn"]'); click(`[data-action="learn-lesson"][data-lesson="${lessonId}"]`);
      assert(shownTask(topic).id === entry.taskId, 'Pending extra did not survive reload');
      const stars = saved().learning.completedSlotIds.length;
      solveTask(shownTask(topic)); click('[data-action="next-learn"]');
      assert(saved().learning.completedSlotIds.length === stars, 'Extra example farmed a star');
      assert(Object.values(saved().learning.extraPractice).filter(extra => !extra.done).length === 0, 'Extra example looped');
      let guard = 0;
      while (document.querySelector('#task-area') && guard++ < 10) {
        if (document.querySelector('.session-heading h2').textContent.startsWith('Utrwal')) assert(!document.querySelector('[data-action="toggle-hint"]'), 'Retrieval exposed the hint panel');
        solveTask(shownTask(topic)); click('[data-action="next-learn"]');
      }
      assert(saved().learning.completedSlotIds.length === 6, 'Topic completion did not award six distinct milestones');
      assert(document.querySelector('.celebrate'), 'Topic summary missing');
    });
    await check('Completed topics retain their summary; unfinished topics resume and mixed review cannot increase stars', async () => {
      click('#brand'); click('[data-action="learn"]');
      assert(!document.querySelector('[data-action="replay-lesson"]'), 'Topic menu restored a removed replay control');
      const selected = JSON.stringify(saved().learning.selected);
      click(`[data-action="learn-lesson"][data-lesson="${lessonId}"]`);
      assert(document.querySelector('.celebrate') && !document.querySelector('#task-area'), 'Completed topic did not open its summary');
      assert(JSON.stringify(saved().learning.selected) === selected, 'Opening a completed topic rerolled the plan');
      const unfinishedId = topic.learningPlan.lessons[1].lessonId;
      click('#brand'); click('[data-action="learn"]');
      click(`[data-action="learn-lesson"][data-lesson="${unfinishedId}"]`);
      const current = shownTask(topic).id;
      await reload(); click('[data-action="learn"]');
      assert(document.querySelector(`[data-action="learn-lesson"][data-lesson="${unfinishedId}"]`).textContent.includes('Kontynuuj'), 'Paused topic lost its continuation label');
      click(`[data-action="learn-lesson"][data-lesson="${lessonId}"]`);
      assert(document.querySelector('.celebrate'), 'Completed topic lost its summary after switching');
      click('#brand'); click('[data-action="learn"]');
      click(`[data-action="learn-lesson"][data-lesson="${unfinishedId}"]`);
      assert(shownTask(topic).id === current, 'Switching topics rerolled the unfinished activity');
      click('#brand'); click('[data-action="mixed-review"]');
      const lessons = new Set(); let count = 0;
      while (document.querySelector('#task-area') && count++ < 20) {
        const task = shownTask(topic); task.lessonIds.forEach(id => lessons.add(id));
        assert(!['flashcards', 'discovery'].includes(task.type), 'Mixed review did not select retrieval questions');
        solveTask(task); click('[data-action="next-learn"]');
      }
      assert(count === topic.learningPlan.defaults.reviewCount, 'Mixed review ignored configured count');
      assert(lessons.size === topic.lessons.length, 'Mixed review omitted a topic despite sufficient capacity');
      assert(saved().learning.completedSlotIds.length === 6, 'Opening a summary or mixed review farmed stars');
    });
    await check('Legacy stars and badges remain visible without completing new topic milestones', async () => {
      const value = saved(); value.completedTaskIds = [...topic.learningPath]; delete value.learning;
      const all = JSON.parse(localStorage.getItem(key)); all[Object.keys(all)[0]] = value;
      localStorage.setItem(key, JSON.stringify(all)); await reload();
      assert(document.querySelector('[data-legacy-rewards]'), 'Legacy achievements disappeared');
      click('[data-action="learn"]'); click(`[data-action="learn-lesson"][data-lesson="${lessonId}"]`);
      assert(saved().learning.completedSlotIds.length === 0, 'Legacy achievements promoted new milestones');
      assert(saved().completedTaskIds.length === topic.learningPath.length, 'Legacy stars were deleted');
    });
  } catch (error) { results.push({status: 'FAIL', reason: error.message}); }
  finally { if (previous === null) localStorage.removeItem(key); else localStorage.setItem(key, previous); await reload(); }
  return results;
}
