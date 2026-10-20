// Runtime checks protect the UI; the Python/JSON Schema validator remains authoritative.
const own = (object, key) => Object.hasOwn(object, key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function check(condition, path, message) {
  if (!condition) throw new Error(`Nieprawidłowe dane (${path}): ${message}.`);
}
function record(value, path) { check(object(value), path, 'oczekiwano obiektu'); }
function text(value, path) { check(typeof value === 'string' && value.trim().length > 0, path, 'oczekiwano niepustego tekstu'); }
function id(value, path) { check(typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), path, 'niepoprawny identyfikator'); }
function list(value, path, min = 1) { check(Array.isArray(value) && value.length >= min, path, `oczekiwano listy (minimum ${min})`); }
function unique(values, path) { check(new Set(values).size === values.length, path, 'powtórzony identyfikator lub wartość'); }
function positive(value, path) { check(Number.isInteger(value) && value > 0, path, 'oczekiwano dodatniej liczby całkowitej'); }
function strings(values, path, validator = text) {
  list(values, path); values.forEach((value, i) => validator(value, `${path}[${i}]`));
}
function ids(values, path) { strings(values, path, id); unique(values, path); }
function rows(values, path, fields, min = 1) {
  list(values, path, min);
  values.forEach((value, i) => {
    const p = `${path}[${i}]`; record(value, p); id(value.id, `${p}.id`);
    fields.forEach(field => text(value[field], `${p}.${field}`));
    if (own(value, 'icon')) id(value.icon, `${p}.icon`);
  });
  unique(values.map(value => value.id), path);
}
function header(doc, kind) {
  record(doc, kind);
  check(doc.schemaVersion === '1.0', 'schemaVersion', 'obsługiwana wersja to 1.0');
  check(doc.kind === kind, 'kind', `oczekiwano ${kind}`);
  if (own(doc, '$schema')) text(doc.$schema, '$schema');
}
const normalize = value => value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('pl-PL');
const scoreable = new Set(['single-choice', 'multiple-choice', 'matching', 'sorting', 'ordering', 'short-answer', 'number-answer']);

export function validateCatalog(doc) {
  header(doc, 'catalog'); rows(doc.classes, 'classes', ['title']);
  unique(doc.classes.map(grade => grade.grade), 'classes.grade');
  const paths = [];
  for (const grade of doc.classes) {
    positive(grade.grade, 'grade');
    check(grade.id === `klasa-${grade.grade}`, grade.id, 'identyfikator klasy nie odpowiada grade');
    rows(grade.subjects, `${grade.id}.subjects`, ['title']);
    for (const subject of grade.subjects) {
      rows(subject.topics, `${subject.id}.topics`, ['title', 'path']);
      for (const entry of subject.topics) {
        check(entry.path === `${grade.id}/${subject.id}/${entry.id}/topic.json`, entry.id, 'niepoprawna ścieżka tematu');
        paths.push(entry.path);
      }
    }
  }
  unique(paths, 'path'); return doc;
}

export function catalogEntries(catalog) {
  return catalog.classes.flatMap(grade => grade.subjects.flatMap(subject => subject.topics.map(entry => ({
    gradeId: grade.id, gradeTitle: grade.title, grade: grade.grade,
    subjectId: subject.id, subjectTitle: subject.title,
    id: entry.id, title: entry.title, path: entry.path,
  }))));
}

export function validateTopic(doc) {
  header(doc, 'topic'); id(doc.id, 'id'); id(doc.subjectId, 'subjectId'); positive(doc.grade, 'grade');
  check(doc.language === 'pl-PL', 'language', 'obsługiwany język to pl-PL');
  text(doc.title, 'title'); text(doc.summary, 'summary');
  rows(doc.lessons, 'lessons', ['title']);
  for (const lesson of doc.lessons) {
    strings(lesson.goals, `${lesson.id}.goals`); strings(lesson.paragraphs, `${lesson.id}.paragraphs`);
  }
  const lessons = new Set(doc.lessons.map(lesson => lesson.id));
  rows(doc.tasks, 'tasks', ['type', 'title', 'instruction', 'explanation']);
  for (const task of doc.tasks) {
    const p = task.id;
    ids(task.lessonIds, `${p}.lessonIds`);
    task.lessonIds.forEach(ref => check(lessons.has(ref), p, `nieznana lekcja ${ref}`));
    if (own(task, 'hint')) text(task.hint, `${p}.hint`);
    switch (task.type) {
      case 'discovery': rows(task.items, `${p}.items`, ['text', 'explanation']); break;
      case 'flashcards': rows(task.cards, `${p}.cards`, ['front', 'back']); break;
      case 'single-choice':
      case 'multiple-choice': {
        rows(task.options, `${p}.options`, ['text'], 2);
        const answers = task.type === 'single-choice' ? [task.correctOptionId] : task.correctOptionIds;
        ids(answers, `${p}.correctOptionIds`);
        answers.forEach(ref => check(task.options.some(option => option.id === ref), p, `nieznana opcja ${ref}`));
        break;
      }
      case 'matching':
        rows(task.pairs, `${p}.pairs`, ['left', 'right'], 2);
        if (own(task, 'leftLabel')) text(task.leftLabel, `${p}.leftLabel`);
        if (own(task, 'rightLabel')) text(task.rightLabel, `${p}.rightLabel`);
        break;
      case 'sorting':
        rows(task.categories, `${p}.categories`, ['text'], 2);
        rows(task.items, `${p}.items`, ['text', 'explanation'], 2);
        task.items.forEach(item => check(task.categories.some(category => category.id === item.categoryId), p, `nieznana kategoria ${item.categoryId}`));
        break;
      case 'ordering':
        rows(task.items, `${p}.items`, ['text'], 2); ids(task.correctOrder, `${p}.correctOrder`);
        check(task.correctOrder.length === task.items.length && task.items.every(item => task.correctOrder.includes(item.id)), p, 'kolejność musi zawierać wszystkie elementy');
        break;
      case 'short-answer': {
        strings(task.acceptedAnswers, `${p}.acceptedAnswers`);
        unique(task.acceptedAnswers.map(normalize), `${p}.acceptedAnswers`);
        check(task.normalization === 'trim-collapse-casefold', p, 'nieobsługiwana normalizacja'); break;
      }
      case 'number-answer':
        check(Number.isFinite(task.answer), p, 'odpowiedź musi być skończoną liczbą');
        check(Number.isFinite(task.tolerance) && task.tolerance >= 0, p, 'tolerancja musi być nieujemną skończoną liczbą');
        text(task.unit, `${p}.unit`); break;
      default: check(false, p, `nieobsługiwany typ zadania ${task.type}`);
    }
  }
  const tasks = new Map(doc.tasks.map(task => [task.id, task]));
  ids(doc.learningPath, 'learningPath');
  doc.learningPath.forEach(ref => check(tasks.has(ref), 'learningPath', `nieznane zadanie ${ref}`));
  if (own(doc, 'learningVariants')) {
    record(doc.learningVariants, 'learningVariants');
    const assigned = new Set();
    for (const [anchor, variants] of Object.entries(doc.learningVariants)) {
      check(doc.learningPath.includes(anchor), 'learningVariants', `nieznany etap ${anchor}`);
      ids(variants, `learningVariants.${anchor}`);
      for (const ref of variants) {
        check(tasks.has(ref) && !doc.learningPath.includes(ref) && !assigned.has(ref), anchor, `niepoprawny lub powtórzony wariant ${ref}`);
        const lessonIds = tasks.get(anchor).lessonIds, candidate = tasks.get(ref).lessonIds;
        check(candidate.length === lessonIds.length && candidate.every(id => lessonIds.includes(id)), ref, 'wariant dotyczy innych lekcji');
        assigned.add(ref);
      }
    }
  }
  const nodeIds = [], visited = new Set();
  function visit(node) {
    record(node, 'mindMap'); check(!visited.has(node), 'mindMap', 'mapa nie jest drzewem'); visited.add(node);
    id(node.id, 'mindMap.id'); text(node.title, 'mindMap.title'); text(node.text, 'mindMap.text');
    nodeIds.push(node.id); list(node.children, 'mindMap.children', 0); node.children.forEach(visit);
  }
  visit(doc.mindMap); unique(nodeIds, 'mindMap');
  rows(doc.tests, 'tests', ['title']);
  for (const test of doc.tests) {
    list(test.questions, `${test.id}.questions`);
    test.questions.forEach(question => {
      record(question, test.id); id(question.taskId, `${test.id}.taskId`); positive(question.points, `${test.id}.points`);
      check(tasks.has(question.taskId), test.id, `nieznane zadanie ${question.taskId}`);
      check(scoreable.has(tasks.get(question.taskId).type), test.id, 'zadanie nie podlega ocenie');
    });
    unique(test.questions.map(question => question.taskId), `${test.id}.questions`);
    if (own(test, 'draw')) {
      list(test.draw, `${test.id}.draw`);
      test.draw.forEach(group => {
        record(group, `${test.id}.draw`); id(group.lessonId, `${test.id}.draw.lessonId`); positive(group.count, `${test.id}.draw.count`);
        check(lessons.has(group.lessonId), test.id, `nieznana lekcja ${group.lessonId}`);
      });
      unique(test.draw.map(group => group.lessonId), `${test.id}.draw`);
      for (const question of test.questions) check(test.draw.filter(group => tasks.get(question.taskId).lessonIds.includes(group.lessonId)).length === 1, test.id, 'pytanie musi należeć do jednej puli losowania');
      for (const group of test.draw) {
        const pool = test.questions.filter(question => tasks.get(question.taskId).lessonIds.includes(group.lessonId));
        check(pool.length >= group.count, test.id, `za mała pula ${group.lessonId}`);
        check(pool.every(question => question.points === pool[0].points), test.id, 'punktacja w puli musi być jednakowa');
      }
    }
    check(test.feedback === 'after-submit', test.id, 'nieobsługiwany tryb informacji zwrotnej');
    check(test.scoring === 'all-or-nothing', test.id, 'nieobsługiwany sposób oceniania');
    check(typeof test.shuffleQuestions === 'boolean', test.id, 'shuffleQuestions musi być wartością logiczną');
    if (test.timeLimitSeconds !== null) positive(test.timeLimitSeconds, `${test.id}.timeLimitSeconds`);
  }
  return doc;
}

export function evaluateTask(task, answer) {
  switch (task.type) {
    case 'single-choice': return typeof answer === 'string' && answer === task.correctOptionId;
    case 'multiple-choice': return Array.isArray(answer) && answer.length === task.correctOptionIds.length && new Set(answer).size === answer.length && answer.every(id => task.correctOptionIds.includes(id));
    case 'matching': return object(answer) && Object.keys(answer).length === task.pairs.length && task.pairs.every(pair => own(answer, pair.id) && answer[pair.id] === pair.id);
    case 'sorting': return object(answer) && Object.keys(answer).length === task.items.length && task.items.every(item => own(answer, item.id) && answer[item.id] === item.categoryId);
    case 'ordering': return Array.isArray(answer) && answer.length === task.correctOrder.length && answer.every((id, i) => id === task.correctOrder[i]);
    case 'short-answer': return typeof answer === 'string' && task.acceptedAnswers.some(value => normalize(value) === normalize(answer));
    case 'number-answer': {
      if (typeof answer !== 'string') return false;
      const value = answer.trim().replace(',', '.');
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)) return false;
      const number = Number(value);
      return Number.isFinite(number) && Math.abs(number - task.answer) <= task.tolerance;
    }
    default: return false;
  }
}

export function gradeTest(topic, test, answers = {}) {
  const tasks = new Map(topic.tasks.map(task => [task.id, task]));
  const results = test.questions.map(question => {
    const task = tasks.get(question.taskId);
    check(Boolean(task), 'test', `nieznane zadanie ${question.taskId}`);
    const correct = object(answers) && own(answers, task.id) && evaluateTask(task, answers[task.id]);
    return { taskId: task.id, correct, points: correct ? question.points : 0, maxPoints: question.points, lessonIds: [...task.lessonIds] };
  });
  const points = results.reduce((sum, result) => sum + result.points, 0);
  const maxPoints = results.reduce((sum, result) => sum + result.maxPoints, 0);
  return { points, maxPoints, percent: maxPoints ? Math.round(points / maxPoints * 100) : 0, results };
}

const emptyProgress = () => ({ completedTaskIds: [], readLessonIds: [], lastTaskId: null, lastResult: null });
function practiceProgress(value, topic) {
  if (!object(value)) return {};
  const selected = [], seen = [];
  for (const anchor of topic.learningPath) {
    const variants = topic.learningVariants && own(topic.learningVariants, anchor) ? topic.learningVariants[anchor] : [];
    const allowed = new Set([anchor, ...variants]);
    if (object(value.selected) && own(value.selected, anchor) && allowed.has(value.selected[anchor])) selected.push([anchor, value.selected[anchor]]);
    const history = object(value.seen) && own(value.seen, anchor) ? value.seen[anchor] : null;
    if (Array.isArray(history)) seen.push([anchor, [...new Set(history.filter(id => allowed.has(id)))]]);
  }
  return {practice: {selected: Object.fromEntries(selected), seen: Object.fromEntries(seen)}};
}
function validResult(result, topic) {
  if (!object(result) || !Array.isArray(result.results) || !result.results.length) return false;
  const tasks = new Map(topic.tasks.map(task => [task.id, task]));
  const ids = new Set(); let points = 0, maxPoints = 0;
  for (const row of result.results) {
    if (!object(row) || !tasks.has(row.taskId) || ids.has(row.taskId)) return false;
    const task = tasks.get(row.taskId); ids.add(row.taskId);
    if (!scoreable.has(task.type) || typeof row.correct !== 'boolean' || !Number.isInteger(row.maxPoints) || row.maxPoints <= 0 || row.points !== (row.correct ? row.maxPoints : 0)) return false;
    if (!Array.isArray(row.lessonIds) || row.lessonIds.length !== task.lessonIds.length || !row.lessonIds.every((id, i) => id === task.lessonIds[i])) return false;
    points += row.points; maxPoints += row.maxPoints;
  }
  return result.points === points && result.maxPoints === maxPoints && result.percent === Math.round(points / maxPoints * 100);
}

export function createProgressStore(storage, key = 'kumilo.progress.v1') {
  let available = Boolean(storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function' && typeof storage.removeItem === 'function');
  function load() {
    if (!available) return {};
    let raw;
    try { raw = storage.getItem(key); } catch { available = false; return {}; }
    try { const value = JSON.parse(raw); return object(value) ? value : {}; } catch { return {}; }
  }
  return {
    get available() { return available; },
    read(topicKey, topic) {
      const all = load(), value = own(all, topicKey) ? all[topicKey] : null;
      if (!object(value)) return emptyProgress();
      const tasks = new Set(topic.tasks.map(task => task.id)), lessons = new Set(topic.lessons.map(lesson => lesson.id));
      const sanitize = (ids, allowed) => Array.isArray(ids) ? [...new Set(ids.filter(id => allowed.has(id)))] : [];
      return {
        completedTaskIds: sanitize(value.completedTaskIds, tasks), readLessonIds: sanitize(value.readLessonIds, lessons),
        lastTaskId: tasks.has(value.lastTaskId) ? value.lastTaskId : null,
        lastResult: validResult(value.lastResult, topic) ? structuredClone(value.lastResult) : null,
        ...practiceProgress(value.practice, topic),
      };
    },
    write(topicKey, progress) {
      const all = load();
      if (!available) return false;
      Object.defineProperty(all, topicKey, { value: progress, enumerable: true, writable: true, configurable: true });
      try { storage.setItem(key, JSON.stringify(all)); return true; } catch { available = false; return false; }
    },
    clear() {
      if (!available) return false;
      try { storage.removeItem(key); return true; } catch { available = false; return false; }
    },
  };
}

export async function fetchJson(url, fetcher = globalThis.fetch) {
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`Nie udało się pobrać danych: HTTP ${response.status} (${url}).`);
  try { return await response.json(); } catch (cause) { throw new Error(`Nieprawidłowy JSON (${url}).`, { cause }); }
}
