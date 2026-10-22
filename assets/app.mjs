import {fetchJson, validateCatalog, validateTopic, catalogEntries, createProgressStore, gradeTest} from './core.mjs';
import {mountTask} from './tasks.mjs';
import {escapeHtml as h, button, owl, sadOwl} from './ui.mjs';
import {learningRewards, rewardShelf, celebrate} from './rewards.mjs';
import {drawTest, drawLearning, testSummary} from './selection.mjs';
import {activityScreen, journeyTrack} from './activity-view.mjs';
import {learningLessons, learningSlots} from './learning-plan.mjs';
import {startLearningSession, startLearningExpedition, expeditionEntries, learningEntries, completeLearningEntry, markLearningSeen, mixedLearningReview} from './learning-session.mjs';
import {learningHome, learningTopics, planRewardShelf} from './learning-view.mjs';

const app = document.getElementById('app');
const catalogUrl = new URL('./data/catalog.json', document.baseURI);
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const store = createProgressStore(storage);
let catalog, entries = [], selected, topic, progress;
let view = 'loading', requestId = 0, taskView = null, queue = [], position = 0, reviewing = false;
let exam = null, student = '', report = null, timer = null, retry = null, reviewLessonIds = [];
let stopCelebration = () => {};
let planEntries = [], planLessonId = null, fullExpedition = false;
const taskById = id => topic.tasks.find(task => task.id === id);
const currentTask = () => {
  if (view === 'exam') return taskById(exam.questions[position].taskId);
  if (topic.learningPlan && planEntries.length) return taskById(planEntries[position].taskId);
  const anchor = queue[position], selected = progress.practice?.selected || {};
  return taskById(Object.hasOwn(selected, anchor) ? selected[anchor] : anchor);
};

function storageStatus() {
  document.getElementById('storage-status').textContent = store.available
    ? '' : 'Zapis w przeglądarce jest niedostępny. Możesz się uczyć, ale postęp może zniknąć po zamknięciu karty.';
}
function save() { store.write(selected.path, progress); storageStatus(); }
function destroyTask() { taskView?.destroy(); taskView = null; stopCelebration(); stopCelebration = () => {}; }
function go(next) {
  destroyTask(); view = next; render();
  const heading = app.querySelector('h1,h2');
  if (heading) { heading.tabIndex = -1; heading.focus({preventScroll: true}); }
  window.scrollTo(0, 0);
}
function leaveForHome() {
  if (exam && !['result', 'home'].includes(view) && !window.confirm('Opuścić test? Niezatwierdzone odpowiedzi nie zostaną zapisane.')) return;
  stopTimer(); exam = null; go('home');
}
function stopTimer() { clearInterval(timer); timer = null; }
function contextual() {
  return `<div class="context"><span>${h(selected.gradeTitle)} · ${h(selected.subjectTitle)} · ${h(topic.title)}</span>${button('Zmień przedmiot lub dział', 'picker', 'scope-button')}</div>`;
}
function frame(content, label, index, total) {
  return `<section class="activity"><div class="activity-top"><button class="back" data-action="home" aria-label="Wróć na start">←</button><div class="meter" role="progressbar" aria-label="${h(label)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${index}"><span style="width:${total ? index / total * 100 : 0}%"></span></div><span class="step-label">${h(label)} ${index}/${total}</span></div>${content}</section>`;
}
function header(kicker, title, text = '') {
  return `<div class="stage-head"><p class="eyebrow">${h(kicker)}</p><h1>${h(title)}</h1>${text ? `<p>${h(text)}</p>` : ''}</div>`;
}
function lessonDetails(task) {
  return task.lessonIds.map(id => {
    const lesson = topic.lessons.find(item => item.id === id);
    return `<details class="lesson-notes" data-lesson-id="${id}"><summary>${owl('mini-owl')} Potrzebujesz objaśnienia? ${h(lesson.title)}</summary><div>${lesson.paragraphs.map(p => `<p>${h(p)}</p>`).join('')}</div></details>`;
  }).join('');
}
function render() {
  destroyTask();
  const session = view === 'learn' || view === 'exam';
  document.body.classList.toggle('work-session', session);
  const context = document.getElementById('session-context'), count = document.getElementById('session-count');
  context.hidden = count.hidden = !session;
  if (session) {
    const task = currentTask();
    context.textContent = `${selected.subjectTitle} · ${topic.lessons.find(lesson => lesson.id === task.lessonIds[0]).title}`;
    count.textContent = `${view === 'learn' ? 'Zadanie' : 'Pytanie'} ${position + 1} z ${view === 'learn' ? queue.length : exam.questions.length}`;
  }
  if (view === 'home') renderHome();
  if (view === 'topics') app.innerHTML = `${contextual()}${learningTopics(topic, progress)}`;
  if (view === 'lessons' || view === 'review-lessons') renderLessons();
  if (view === 'learn') renderLearn();
  if (view === 'finish') renderFinish();
  if (view === 'test-intro') renderTestIntro();
  if (view === 'exam') renderExam();
  if (view === 'exam-review') renderExamReview();
  if (view === 'result') renderResult();
  storageStatus();
}
function renderHome() {
  if (topic.learningPlan) { app.innerHTML = `${contextual()}${learningHome(topic, progress)}`; return; }
  const count = progress.completedTaskIds.filter(id => topic.learningPath.includes(id)).length;
  const inProgress = count > 0 && count < topic.learningPath.length;
  app.innerHTML = `${contextual()}<section class="hero"><div class="hero-copy"><p class="eyebrow">TWOJA WYPRAWA Z KUMILO</p><h1>${h(topic.title)}</h1><p>${h(topic.summary)}</p></div>${owl('mascot', 'Sowa Kumilo — Twoja towarzyszka odkryć')}</section><div class="choice-grid"><button class="choice learn" data-action="learn"><span class="choice-icon" aria-hidden="true">✦</span><span><b>${inProgress ? 'Kontynuuj wyprawę' : count === topic.learningPath.length ? 'Wyprawa ukończona!' : 'Ucz się przez zabawę'}</b><small>${count ? `${count} z ${topic.learningPath.length} aktywności ukończonych` : 'Odkrywaj, łącz tropy i próbuj.'}</small></span><span class="arrow" aria-hidden="true">→</span></button><button class="choice" data-action="test-intro"><span class="choice-icon" aria-hidden="true">✓</span><span><b>Sprawdź się</b><small>Test z całego działu</small></span><span class="arrow" aria-hidden="true">→</span></button></div><div class="home-links">${button('Lekcje i mapa myśli', 'lessons', 'text-button')}${progress.lastResult ? button('Ostatni wynik', 'last-result', 'text-button') : ''}${count ? button('Przejdź wyprawę od początku', 'replay', 'text-button') : ''}</div>`;
  app.insertAdjacentHTML('beforeend', rewardShelf(topic.learningPath, progress.completedTaskIds, topic.tasks));
}
function mapNode(node) {
  return `<details class="map-node"><summary>${h(node.title)}</summary><p>${h(node.text)}</p>${node.children.map(mapNode).join('')}</details>`;
}
function renderLessons() {
  const revision = view === 'review-lessons';
  const lessons = revision ? topic.lessons.filter(lesson => reviewLessonIds.includes(lesson.id)) : topic.lessons;
  const relatedIds = revision ? topic.learningPath.filter(id => taskById(id).lessonIds.some(lesson => reviewLessonIds.includes(lesson))) : [];
  const heading = revision ? header('POWTÓRKA TWOICH TROPÓW', 'Wróćmy do tych objaśnień.', 'Nie każdy z tych tematów ma osobną aktywność w wyprawie. Rozwiń lekcje poniżej, a potem spróbuj testu ponownie.') : header('POZNAJ POWIĄZANIA', 'Każde odkrycie ma swoją historię.');
  app.innerHTML = frame(`<div ${revision ? 'data-review-lessons' : ''}>${heading}<div class="stage"><div class="lesson-list">${lessons.map(lesson => `<details class="lesson-notes" data-lesson-id="${lesson.id}"><summary>${h(lesson.title)} ${progress.readLessonIds.includes(lesson.id) ? '<span class="read-mark">· otwierano</span>' : ''}</summary><ul>${lesson.goals.map(goal => `<li>${h(goal)}</li>`).join('')}</ul>${lesson.paragraphs.map(p => `<p>${h(p)}</p>`).join('')}</details>`).join('')}</div>${revision ? '' : `<section class="mindmap"><h2>Mapa myśli</h2>${mapNode(topic.mindMap)}</section>`}<div class="footer-actions">${revision ? `${relatedIds.length ? button('Poćwicz dostępne zadania', 'review-activities') : ''}${button('Nowe podejście do testu →', 'test-intro')}` : button('Ucz się przez zabawę →', 'learn')}</div></div></div>`, 'Lekcje otwarte', lessons.filter(lesson => progress.readLessonIds.includes(lesson.id)).length, lessons.length);
}
function beginLearning(forceStart = false, reviewIds = null) {
  if (topic.learningPlan) { stopTimer(); exam = null; go('topics'); return; }
  stopTimer(); exam = null;
  reviewing = Boolean(reviewIds);
  queue = reviewIds || [...topic.learningPath];
  position = forceStart || reviewing ? 0 : queue.findIndex(id => !progress.completedTaskIds.includes(id));
  if (!queue.length) { go('lessons'); return; }
  if (position < 0) { go('finish'); return; }
  const practice = progress.practice || {selected: {}, seen: {}};
  const missing = queue.filter(anchor => forceStart || reviewing || !Object.hasOwn(practice.selected, anchor));
  const reservedTypes = queue.filter(anchor => !missing.includes(anchor)).map(anchor => taskById(practice.selected[anchor]).type);
  const drawn = drawLearning(topic, missing, practice.seen, Math.random, reservedTypes);
  progress.practice = {selected: {...practice.selected, ...drawn.selected}, seen: practice.seen};
  progress.lastTaskId = queue[position]; save(); go('learn');
}
function renderLearn() {
  if (topic.learningPlan) { renderPlannedLearn(); return; }
  const task = currentTask();
  const anchor = queue[position];
  const history = Object.hasOwn(progress.practice.seen, anchor) ? progress.practice.seen[anchor] : [];
  if (history.at(-1) !== task.id) {
    progress.practice.seen[anchor] = [...(history.includes(task.id) ? history.filter(id => taskById(id).type !== task.type) : history), task.id];
    save();
  }
  const before = learningRewards(topic.learningPath, progress.completedTaskIds);
  app.innerHTML = activityScreen({task, index: position + 1, total: queue.length, reviewing, notes: lessonDetails(task), stars: `${before.stars} / ${before.total}`});
  const reward = document.getElementById('reward-area');
  taskView = mountTask(document.getElementById('task-area'), task, {controls: false, onStateChange: state => updateLearningTask(task, state, reward), onComplete: () => {
    const anchor = queue[position];
    if (!progress.completedTaskIds.includes(anchor)) progress.completedTaskIds.push(anchor);
    save();
    const after = learningRewards(topic.learningPath, progress.completedTaskIds);
    const badge = after.badges.filter(item => item.earned && !before.badges.find(previous => previous.id === item.id)?.earned).at(-1);
    const earnedStar = after.stars > before.stars;
    document.getElementById('learn-stars').textContent = `${after.stars} / ${after.total}`;
    reward.hidden = false;
    reward.innerHTML = `<div><strong>${earnedStar ? '+1 gwiazdka!' : 'Trop odświeżony!'}</strong>${badge ? `<span>Nowa odznaka: ${h(badge.title)}</span>` : ''}</div><span class="reward-token" aria-hidden="true">${badge ? badge.icon : '★'}</span>`;
    stopCelebration = celebrate(reward);
    const next = app.querySelector('.task-primary-group .primary');
    next.disabled = false; next.classList.add('ready-next'); next.focus({preventScroll: true});
  }});
}
function updateLearningTask(task, state, reward) {
  updateTaskFooter(task, state);
  if (state.solved) document.querySelector('#task-area .coach-bubble')?.append(reward);
}
function updateTaskFooter(task, state) {
  const status = document.getElementById('task-progress');
  const text = state.progressText;
  if (status.textContent !== text) status.innerHTML = text.split(/(\d+)/).map(part => /^\d+$/.test(part) ? `<strong>${part}</strong>` : h(part)).join('');
  if (view !== 'learn') return;
  const primary = app.querySelector('.task-primary-group .primary');
  const checking = state.checkable && !state.solved;
  primary.dataset.action = checking ? 'check-task' : 'next-learn';
  primary.toggleAttribute('data-check', checking);
  primary.disabled = checking ? !state.canCheck : !state.solved;
  primary.textContent = checking ? 'Sprawdź' : position === queue.length - 1 ? 'Zakończ wyprawę →' : 'Dalej →';
  const guidance = {matching: 'Połącz wszystkie pary', discovery: 'Odkryj wszystkie karty', flashcards: 'Odwróć wszystkie fiszki'};
  document.getElementById('task-next-help').textContent = state.solved ? 'Możesz przejść dalej' : checking ? state.canCheck ? 'Sprawdź odpowiedź, aby przejść dalej' : 'Uzupełnij odpowiedź' : guidance[task.type] || 'Wybierz poprawną odpowiedź';
}
function renderFinish() {
  if (topic.learningPlan) { renderPlannedFinish(); return; }
  app.innerHTML = frame(`<div class="stage"><div class="celebrate">${owl('award-owl')}<p class="eyebrow">${reviewing ? 'POWTÓRKA ZA TOBĄ' : 'WYPRAWA UKOŃCZONA'}</p><h1>${reviewing ? 'Tropy odświeżone!' : 'Odkrywca na medal!'}</h1><p>${reviewing ? 'Wróciłeś do tematów, które wymagały powtórki.' : 'Wszystkie aktywności tej wyprawy masz już za sobą.'}</p></div><div class="footer-actions">${button('Sprawdź się →', 'test-intro')}${button('Na start', 'home', 'secondary')}</div><details class="mindmap"><summary>Zobacz, jak łączą się Twoje odkrycia</summary>${mapNode(topic.mindMap)}</details></div>`, 'Aktywności', queue.length || topic.learningPath.length, queue.length || topic.learningPath.length);
  app.querySelector('.celebrate').insertAdjacentHTML('afterend', rewardShelf(topic.learningPath, progress.completedTaskIds, topic.tasks));
  stopCelebration = celebrate(app.querySelector('.celebrate'));
}
function beginPlannedLesson(lessonId, replay = false) {
  stopTimer(); exam = null; reviewing = false; fullExpedition = false;
  try {
    const session = startLearningSession(topic, progress, {lessonId, replay});
    planLessonId = lessonId; planEntries = session.entries;
    queue = planEntries.map(entry => entry.id); position = session.position;
    save(); go(position < 0 ? 'finish' : 'learn');
  } catch (error) { showError(error); }
}
function beginExpedition() {
  stopTimer(); exam = null; reviewing = false; fullExpedition = true; planLessonId = null;
  try {
    const session = startLearningExpedition(topic, progress);
    planEntries = session.entries; position = session.position;
    queue = planEntries.map(entry => entry.id);
    save(); go('learn');
  } catch (error) { showError(error); }
}
function beginPlannedReview(lessonIds = null) {
  stopTimer(); exam = null; reviewing = true; planLessonId = null; fullExpedition = false;
  try {
    planEntries = mixedLearningReview(topic, progress.learning, lessonIds);
    queue = planEntries.map(entry => entry.id); position = 0;
    go(queue.length ? 'learn' : 'lessons');
  } catch (error) { showError(error); }
}
function plannedTrack() {
  if (!fullExpedition) return {index: position + 1, total: queue.length};
  const lessons = learningLessons(topic);
  return {index: lessons.findIndex(lesson => lesson.lessonId === planEntries[position].lessonId) + 1, total: lessons.length};
}
function renderPlannedLearn() {
  const entry = planEntries[position], task = taskById(entry.taskId);
  markLearningSeen(topic, progress.learning, entry); save();
  const path = learningSlots(topic).map(slot => slot.id);
  const before = learningRewards(path, progress.learning.completedSlotIds);
  app.innerHTML = activityScreen({task, ...plannedTrack(), reviewing, hints: entry.hints, stageTitle: entry.title, notes: lessonDetails(task), stars: `${before.stars} / ${before.total}`});
  const reward = document.getElementById('reward-area');
  let hadMistake = false;
  taskView = mountTask(document.getElementById('task-area'), task, {controls: false,
    onStateChange: state => { hadMistake ||= state.incorrect; updateLearningTask(task, state, reward); },
    onComplete: () => {
      completeLearningEntry(topic, progress.learning, entry, hadMistake);
      if (!reviewing) {
        planEntries = fullExpedition ? expeditionEntries(topic, progress.learning) : learningEntries(topic, progress.learning, planLessonId);
        queue = planEntries.map(item => item.id);
        position = planEntries.findIndex(item => item.id === entry.id);
        progress.learning[fullExpedition ? 'expeditionSlotId' : 'lastSlotId'] = planEntries[position + 1]?.slotId || null;
      }
      save();
      const after = learningRewards(path, progress.learning.completedSlotIds);
      document.getElementById('learn-stars').textContent = `${after.stars} / ${after.total}`;
      reward.hidden = false;
      reward.innerHTML = `<div><strong>${after.stars > before.stars ? '+1 gwiazdka!' : entry.extra ? 'Dodatkowy trop odkryty!' : 'Trop odświeżony!'}</strong></div><span class="reward-token" aria-hidden="true">★</span>`;
      stopCelebration = celebrate(reward);
      document.getElementById('session-count').textContent = `Zadanie ${position + 1} z ${queue.length}`;
      app.querySelector('.journey-track').outerHTML = journeyTrack({...plannedTrack(), label: reviewing ? 'Powtórka' : fullExpedition ? 'Postęp tematów' : 'Postęp nauki'});
      const next = app.querySelector('.task-primary-group .primary');
      next.disabled = false; next.classList.add('ready-next'); next.focus({preventScroll: true});
    },
  });
}
function advancePlannedLearning() {
  position++;
  if (!reviewing) { progress.learning[fullExpedition ? 'expeditionSlotId' : 'lastSlotId'] = planEntries[position]?.slotId || null; save(); }
  go(position < queue.length ? 'learn' : 'finish');
}
function renderPlannedFinish() {
  if (fullExpedition) {
    app.innerHTML = frame(`<div class="stage"><div class="celebrate">${owl('award-owl')}<p class="eyebrow">WYPRAWA UKOŃCZONA</p><h1>Cały dział odkryty!</h1><p>Wszystkie tematy tej wyprawy masz już za sobą.</p></div>${planRewardShelf(topic, progress)}<div class="footer-actions">${button('Sprawdź się →', 'test-intro')}${button('Na start', 'home', 'secondary')}</div></div>`, 'Aktywności', queue.length, queue.length);
    stopCelebration = celebrate(app.querySelector('.celebrate'));
    return;
  }
  const lessons = learningLessons(topic), lesson = lessons.find(item => item.lessonId === planLessonId);
  const next = lesson ? lessons[lessons.indexOf(lesson) + 1] : null;
  const nextButton = next ? `<button class="primary" data-action="learn-lesson" data-lesson="${h(next.lessonId)}">Kolejny temat →</button>` : button('Wybierz temat', 'topics');
  app.innerHTML = frame(`<div class="stage"><div class="celebrate">${owl('award-owl')}<p class="eyebrow">${reviewing ? 'POWTÓRKA ZA TOBĄ' : 'TEMAT ODKRYTY'}</p><h1>${reviewing ? 'Tropy odświeżone!' : h(lesson.title)}</h1><p>${reviewing ? 'Wróć do tych tropów ponownie przy kolejnej okazji.' : 'Wszystkie kroki tej wyprawy masz już za sobą.'}</p></div>${!reviewing ? planRewardShelf(topic, progress, planLessonId) : ''}<div class="footer-actions">${reviewing ? button('Wybierz temat', 'topics') : nextButton}${button('Na start', 'home', 'secondary')}${button('Sprawdź się', 'test-intro', 'text-button')}</div></div>`, 'Aktywności', queue.length, queue.length);
  stopCelebration = celebrate(app.querySelector('.celebrate'));
}
function renderTestIntro() {
  app.innerHTML = frame(`${header('TO PRÓBA, NIE WYŚCIG', 'Zobacz, co już potrafisz.', 'Wyjaśnienia poznasz po zatwierdzeniu całego testu.')}<form class="stage test-intro" id="test-form"><label>Wybierz test<select id="exam-select">${topic.tests.map(test => `<option value="${test.id}">${h(test.title)} · ${testSummary(topic, test).count} pytań</option>`).join('')}</select></label><label class="field">Jak się do Ciebie zwracać?<input id="student-name" name="student" placeholder="Imię lub pseudonim" required maxlength="30" autocomplete="off"></label><p class="small" id="exam-description"></p><p class="small">Punktacja: cała poprawna odpowiedź daje pełną pulę punktów. Częściowych punktów nie przyznajemy. Możesz wracać do pytań.</p><p class="small">Imienia nie zapisujemy. Niezatwierdzony test nie przetrwa odświeżenia.</p><div class="footer-actions"><button class="primary" type="submit">Zaczynam →</button></div></form>`, 'Test', 0, 1);
  updateExamDescription();
}
function updateExamDescription() {
  const test = topic.tests.find(item => item.id === document.getElementById('exam-select').value);
  const summary = testSummary(topic, test);
  document.getElementById('exam-description').textContent = `${summary.count} pytań · ${summary.maxPoints} pkt${test.draw ? ` · Losowane z ${summary.bankSize} zadań` : ''}${test.timeLimitSeconds == null ? '' : ` · Limit: ${test.timeLimitSeconds} sekund`}`;
}
function beginExam(testId, name) {
  const template = topic.tests.find(test => test.id === testId);
  student = name.trim();
  if (!student) return;
  const definition = drawTest(topic, template, progress.lastResult?.results.map(row => row.taskId) || []);
  exam = {definition, questions: definition.questions, answers: {}, presentations: new Map(), deadline: definition.timeLimitSeconds == null ? null : Date.now() + definition.timeLimitSeconds * 1000};
  position = 0; go('exam');
  if (exam.deadline) timer = setInterval(() => {
    if (!exam) { stopTimer(); return; }
    const remaining = Math.max(0, Math.ceil((exam.deadline - Date.now()) / 1000));
    const label = document.getElementById('time-left');
    if (label) label.textContent = `Pozostało ${remaining} s`;
    if (!remaining) finishExam();
  }, 1000);
}
function rememberAnswer() {
  if (taskView && view === 'exam') exam.answers[currentTask().id] = taskView.getAnswer();
}
function renderExam() {
  const task = currentTask();
  const question = exam.questions[position];
  if (!exam.presentations.has(task.id)) exam.presentations.set(task.id, {});
  app.innerHTML = activityScreen({task, index: position + 1, total: exam.questions.length, mode: 'test', points: question.points, deadline: exam.deadline});
  taskView = mountTask(document.getElementById('task-area'), task, {mode: 'test', controls: false, answer: exam.answers[task.id], presentation: exam.presentations.get(task.id), onStateChange: state => updateTaskFooter(task, state), onAnswer: answer => { exam.answers[task.id] = answer; }});
}
function completeAnswer(task, answer) {
  if (answer == null) return false;
  if (task.type === 'matching') return Object.keys(answer).length === task.pairs.length;
  if (task.type === 'sorting') return task.items.every(item => answer[item.id]);
  if (Array.isArray(answer)) return answer.length > 0;
  return String(answer).trim().length > 0;
}
function renderExamReview() {
  const incomplete = exam.questions.filter(q => !completeAnswer(taskById(q.taskId), exam.answers[q.taskId]));
  app.innerHTML = frame(`${header('OSTATNI KROK', 'Gotowe do sprawdzenia?', incomplete.length ? `${incomplete.length} pytań nie ma pełnej odpowiedzi. Możesz je uzupełnić albo zakończyć test.` : 'Wszystkie pytania mają odpowiedzi. Możesz jeszcze do nich wrócić.')}<div class="stage"><div class="question-nav">${exam.questions.map((q, i) => `<button class="secondary ${completeAnswer(taskById(q.taskId), exam.answers[q.taskId]) ? 'answered' : ''}" data-question="${i}" aria-label="Pytanie ${i + 1}${completeAnswer(taskById(q.taskId), exam.answers[q.taskId]) ? ', odpowiedziano' : ', bez pełnej odpowiedzi'}">${i + 1}</button>`).join('')}</div><p class="small">Brak odpowiedzi oznacza zero punktów. Po zatwierdzeniu nie zmienisz odpowiedzi w tym podejściu.</p><div class="footer-actions">${button('Zatwierdź i zobacz wynik', 'submit-exam')}</div></div>`, 'Pytania', exam.questions.length, exam.questions.length);
}
function finishExam() {
  rememberAnswer();
  stopTimer();
  report = gradeTest(topic, exam.definition, exam.answers);
  report.answers = structuredClone(exam.answers);
  report.testId = exam.definition.id;
  progress.lastResult = report;
  save(); exam = null; go('result');
  if (report.percent === 100) stopCelebration = celebrate(app.querySelector('.celebrate'));
}
function answerLabel(task, answer) {
  if (answer == null || answer === '' || Array.isArray(answer) && !answer.length) return 'Brak odpowiedzi';
  if (['single-choice', 'multiple-choice'].includes(task.type)) return (Array.isArray(answer) ? answer : [answer]).map(id => task.options.find(o => o.id === id)?.text || 'Brak odpowiedzi').join('; ');
  if (task.type === 'ordering') return answer.map(id => task.items.find(i => i.id === id)?.text || '?').join(' → ');
  if (task.type === 'matching') return task.pairs.filter(pair => answer[pair.id]).map(pair => `${pair.left} — ${task.pairs.find(p => p.id === answer[pair.id])?.right || '?'}`).join('; ') || 'Brak odpowiedzi';
  if (task.type === 'sorting') return task.items.map(item => `${item.text}: ${task.categories.find(c => c.id === answer[item.id])?.text || 'brak'}`).join('; ');
  return String(answer);
}
function renderResult() {
  if (!report) { go('home'); return; }
  const mistakes = report.results.filter(result => !result.correct);
  app.innerHTML = frame(`<div class="stage"><div class="celebrate">${owl('award-owl')}<p class="eyebrow">TWOJE PODSUMOWANIE</p><h1>${h(student ? `${student}, oto Twoje tropy!` : 'Twój ostatni wynik')}</h1><div class="score">${report.points} / ${report.maxPoints} pkt</div><p>${report.percent}% · ${mistakes.length ? 'Wiesz już, do czego warto wrócić.' : 'Wszystkie odpowiedzi poprawne!'}</p></div><div class="footer-actions">${mistakes.length ? button('Poćwicz moje błędy →', 'review-mistakes') : button('Wróć do nauki', 'replay')}${button('Zapisz / wydrukuj wynik', 'print', 'secondary')}</div><div class="result-details">${report.results.map(result => {
    const task = taskById(result.taskId);
    return `<article class="review"><h2>${result.correct ? '✓' : '↻'} ${h(task.title)}</h2><p>${result.points} / ${result.maxPoints} pkt</p>${report.answers ? `<p>Twoja odpowiedź: ${h(answerLabel(task, report.answers[task.id]))}</p>` : ''}<p>${h(task.explanation)}</p>${!result.correct ? `<p class="small">Do powtórki: ${task.lessonIds.map(id => h(topic.lessons.find(l => l.id === id).title)).join(', ')}</p>` : ''}</article>`;
  }).join('')}</div><div class="footer-actions">${button('Na start', 'home', 'secondary')}</div></div>`, 'Wynik', 1, 1);
  if (mistakes.length) app.querySelector('.award-owl').outerHTML = sadOwl('result-owl');
}
async function loadTopic(entry) {
  const token = ++requestId;
  destroyTask(); view = 'loading'; app.innerHTML = `<p class="loading" role="status">${owl('mini-owl')} Sowa przygotowuje wyprawę…</p>`;
  retry = () => loadTopic(entry);
  try {
    const loaded = validateTopic(await fetchJson(new URL(entry.path, catalogUrl)));
    if (token !== requestId) return;
    if (loaded.id !== entry.id || loaded.grade !== entry.grade || loaded.subjectId !== entry.subjectId) throw new Error('Metadane tematu nie pasują do katalogu.');
    selected = entry; topic = loaded;
    progress = store.read(entry.path, topic);
    report = progress.lastResult; student = ''; queue = []; reviewing = false; planEntries = []; planLessonId = null;
    document.title = `${topic.title} · Kumilo`;
    go('home');
  } catch (error) { if (token === requestId) showError(error); }
}
function showError(error) {
  stopTimer(); destroyTask(); view = 'error';
  app.innerHTML = `<section class="stage error-state">${owl('award-owl')}<h1>Ten trop chwilowo się zgubił.</h1><p>Nie udało się wczytać poprawnych materiałów. Twoich zapisanych danych nie usunęliśmy.</p><p class="small">${h(error.message)}</p><div class="footer-actions">${button('Spróbuj ponownie', 'retry')}${entries.length ? button('Wybierz inny temat', 'picker', 'secondary') : ''}</div></section>`;
}
function openPicker() {
  if (exam && !window.confirm('Zmiana materiału zakończy bieżący test bez zapisywania odpowiedzi. Kontynuować?')) return;
  const grades = catalog.classes;
  document.getElementById('grade-select').innerHTML = grades.map(grade => `<option value="${grade.id}">${h(grade.title)}</option>`).join('');
  document.getElementById('grade-select').value = selected?.gradeId || grades[0].id;
  fillSubjects(selected?.subjectId, selected?.path);
  document.getElementById('picker').showModal();
}
function fillSubjects(preferred, topicPath) {
  const grade = catalog.classes.find(g => g.id === document.getElementById('grade-select').value);
  const select = document.getElementById('subject-select');
  select.innerHTML = grade.subjects.map(s => `<option value="${s.id}">${h(s.title)}</option>`).join('');
  if (grade.subjects.some(s => s.id === preferred)) select.value = preferred;
  fillTopics(topicPath);
}
function fillTopics(preferred) {
  const list = entries.filter(entry => entry.gradeId === document.getElementById('grade-select').value && entry.subjectId === document.getElementById('subject-select').value);
  const select = document.getElementById('topic-select');
  select.innerHTML = list.map(entry => `<option value="${h(entry.path)}">${h(entry.title)}</option>`).join('');
  if (list.some(entry => entry.path === preferred)) select.value = preferred;
}
app.addEventListener('click', event => {
  const target = event.target.closest('button');
  if (!target || target.disabled) return;
  if (target.dataset.question !== undefined) { position = Number(target.dataset.question); go('exam'); return; }
  const action = target.dataset.action;
  if (action === 'home') leaveForHome();
  if (action === 'picker') openPicker();
  if (action === 'learn') beginLearning();
  if (action === 'expedition') beginExpedition();
  if (action === 'topics') go('topics');
  if (action === 'learn-lesson' || action === 'replay-lesson') beginPlannedLesson(target.dataset.lesson, action === 'replay-lesson');
  if (action === 'mixed-review') beginPlannedReview();
  if (action === 'replay') beginLearning(true);
  if (action === 'lessons') go('lessons');
  if (action === 'test-intro') { student = ''; go('test-intro'); }
  if (action === 'check-task') taskView.check();
  if (action === 'toggle-hint') {
    const panel = document.getElementById('task-hint-panel');
    panel.hidden = !panel.hidden; target.setAttribute('aria-expanded', String(!panel.hidden));
  }
  if (action === 'next-learn') {
    if (topic.learningPlan) advancePlannedLearning();
    else { position++; if (position < queue.length) { progress.lastTaskId = queue[position]; save(); go('learn'); } else { progress.lastTaskId = null; save(); go('finish'); } }
  }
  if (action === 'exam-back') { rememberAnswer(); position--; go('exam'); }
  if (action === 'exam-next') { rememberAnswer(); if (position < exam.questions.length - 1) { position++; go('exam'); } else go('exam-review'); }
  if (action === 'submit-exam') finishExam();
  if (action === 'last-result') { report = progress.lastResult; student = ''; go('result'); }
  if (action === 'review-mistakes') {
    const lessonIds = new Set(report.results.filter(result => !result.correct).flatMap(result => result.lessonIds));
    if (topic.learningPlan) { beginPlannedReview([...lessonIds]); return; }
    const ids = topic.learningPath.filter(id => taskById(id).lessonIds.some(lesson => lessonIds.has(lesson)));
    const covered = new Set(ids.flatMap(id => taskById(id).lessonIds));
    if ([...lessonIds].some(id => !covered.has(id))) { reviewLessonIds = [...lessonIds]; go('review-lessons'); }
    else beginLearning(true, ids);
  }
  if (action === 'review-activities') {
    if (topic.learningPlan) beginPlannedReview(reviewLessonIds);
    else beginLearning(true, topic.learningPath.filter(id => taskById(id).lessonIds.some(lesson => reviewLessonIds.includes(lesson))));
  }
  if (action === 'print') window.print();
  if (action === 'retry') retry?.();
});
app.addEventListener('submit', event => {
  if (event.target.id !== 'test-form') return;
  event.preventDefault(); beginExam(document.getElementById('exam-select').value, document.getElementById('student-name').value);
});
app.addEventListener('change', event => { if (event.target.id === 'exam-select') updateExamDescription(); });
app.addEventListener('toggle', event => {
  const id = event.target.dataset?.lessonId;
  if (id && event.target.open && !progress.readLessonIds.includes(id)) { progress.readLessonIds.push(id); save(); }
}, true);
document.getElementById('brand').addEventListener('click', () => { if (topic) leaveForHome(); });
document.getElementById('privacy-button').addEventListener('click', () => { document.getElementById('clear-message').textContent = ''; document.getElementById('privacy').showModal(); });
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
document.getElementById('grade-select').addEventListener('change', () => fillSubjects());
document.getElementById('subject-select').addEventListener('change', () => fillTopics());
document.getElementById('picker-form').addEventListener('submit', event => {
  event.preventDefault();
  stopTimer(); exam = null;
  const entry = entries.find(item => item.path === document.getElementById('topic-select').value);
  document.getElementById('picker').close(); loadTopic(entry);
});
document.getElementById('clear-progress').addEventListener('click', () => {
  store.clear(); stopTimer(); exam = null; report = null; student = '';
  if (topic) { progress = store.read(selected.path, topic); go('home'); }
  document.getElementById('clear-message').textContent = store.available ? 'Usunięto zapisane dane Kumilo z tej przeglądarki.' : 'Wyczyszczono dane z tej karty. Pamięć przeglądarki jest niedostępna — jeśli zawiera wcześniejszy zapis, usuń go w ustawieniach przeglądarki.';
});
async function boot() {
  retry = boot;
  if (location.protocol === 'file:') { showError(new Error('Otwórz Kumilo przez HTTP(S) na hostingu statycznym lub w lokalnym podglądzie. Dwuklik pliku HTML nie pozwala wczytać danych JSON.')); return; }
  try {
    catalog = validateCatalog(await fetchJson(catalogUrl));
    entries = catalogEntries(catalog);
    if (!entries.length) throw new Error('Katalog nie zawiera dostępnych tematów.');
    await loadTopic(entries[0]);
  } catch (error) { showError(error); }
}
boot();
