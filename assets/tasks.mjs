import {evaluateTask} from './core.mjs';
import {escapeHtml as h, shuffled, sadOwl} from './ui.mjs';
import {attachReordering} from './reorder.mjs';
import {illustration} from './illustrations.mjs';
import {attachPairLines} from './pair-lines.mjs';

const image = icon => illustration(icon) || '<span class="unknown-icon" aria-hidden="true">✦</span>';

export function mountTask(container, task, {mode = 'learn', answer: initialAnswer, presentation = {}, controls = true, onStateChange = () => {}, onAnswer = () => {}, onComplete = () => {}} = {}) {
  const study = mode === 'learn';
  const checkable = ['multiple-choice', 'sorting', 'ordering', 'short-answer', 'number-answer'].includes(task.type);
  let answer = initialAnswer == null ? defaultAnswer(task) : structuredClone(initialAnswer);
  let selected = null;
  let message = '';
  let incorrect = false;
  let solved = false;
  let cardIndex = 0;
  let flipped = false;
  let flipMotion = false, revealedId = null;
  const seen = new Set();
  const rightPairs = presentation.rightPairs ??= task.type === 'matching' ? shuffled(task.pairs) : [];
  const choices = presentation.choices ??= task.options ? shuffled(task.options) : [];
  let disposeDrag = () => {};
  let disposeLinks = () => {};
  const controller = new AbortController();
  const options = {signal: controller.signal};

  function getState() {
    const count = task.type === 'discovery' || task.type === 'flashcards' ? seen.size
      : task.type === 'matching' || task.type === 'sorting' ? Object.keys(answer).length
      : task.type === 'multiple-choice' ? answer.length
      : task.type === 'ordering' ? answer.length : Number(String(answer ?? '').trim().length > 0);
    const total = task.type === 'flashcards' ? task.cards.length : task.pairs?.length || task.items?.length || task.options?.length || 1;
    const progressText = task.type === 'matching' ? `Połączono ${count} z ${total} par`
      : task.type === 'sorting' ? `Przyporządkowano ${count} z ${total} elementów`
      : task.type === 'discovery' ? `Odkryto ${count} z ${total} kart`
      : task.type === 'flashcards' ? `Odwrócono ${count} z ${total} fiszek`
      : task.type === 'multiple-choice' ? count === 1 ? 'Wybrano 1 odpowiedź' : `Wybrano ${count} odpowiedzi`
      : task.type === 'ordering' ? solved ? 'Kolejność sprawdzona' : `${total} elementów do uporządkowania`
      : solved ? 'Zadanie ukończone' : count ? task.type === 'single-choice' ? 'Wybrano odpowiedź' : 'Wpisano odpowiedź' : 'Czekamy na Twoją odpowiedź';
    return {solved, incorrect: study && incorrect, count, total, progressText, checkable, canCheck: study && checkable && !solved && (task.type === 'sorting' ? count === total : count > 0)};
  }

  function changed() {
    message = ''; incorrect = false;
    const feedback = container.querySelector('.feedback');
    if (feedback) { feedback.hidden = true; feedback.classList.remove('retry'); feedback.innerHTML = ''; }
    onAnswer(structuredClone(answer));
    onStateChange(getState());
  }
  function finish() {
    if (!solved) {
      solved = true;
      incorrect = false;
      message = task.explanation;
      onComplete();
    }
  }
  function check() {
    if (!study || solved || !checkable) return;
    if (evaluateTask(task, answer)) finish();
    else { incorrect = true; message = task.hint || 'Jeszcze nie wszystko się zgadza. Spróbuj ponownie lub zajrzyj do objaśnienia lekcji.'; }
    render('[data-check]');
  }
  function render(focusSelector = null) {
    disposeDrag();
    disposeLinks();
    container.dataset.mode = mode;
    container.classList.toggle('task-solved', solved);
    let html = '';
    if (task.type === 'discovery') html = `<div class="objects">${task.items.map(item => `<button class="object ${seen.has(item.id) ? 'opened' : ''} ${revealedId === item.id ? 'revealed-now' : ''}" data-reveal="${item.id}" aria-expanded="${seen.has(item.id)}">${seen.has(item.id) ? '<span class="check">✓</span>' : ''}${image(item.icon)}<b>${h(item.text)}</b><small class="${seen.has(item.id) ? 'discovery-content' : ''}">${h(seen.has(item.id) ? item.explanation : 'Kliknij i odkryj')}</small></button>`).join('')}</div><div class="discovery-dots" role="progressbar" aria-label="Odkryte karty" aria-valuemin="0" aria-valuemax="${task.items.length}" aria-valuenow="${seen.size}">${task.items.map(item => `<span class="${seen.has(item.id) ? 'found' : ''}"></span>`).join('')}</div>`;
    if (task.type === 'flashcards') {
      const card = task.cards[cardIndex];
      html = `<p class="tiny-count">Karta ${cardIndex + 1} z ${task.cards.length}</p><button class="flashcard ${flipMotion ? flipped ? 'turn-back' : 'turn-front' : ''}" data-flip aria-pressed="${flipped}"><span class="eyebrow">${flipped ? 'ODPOWIEDŹ' : 'POMYŚL I ODWRÓĆ'}</span>${illustration(card.icon)}<strong>${h(flipped ? card.back : card.front)}</strong><small>Kliknij, aby odwrócić</small></button><div class="discovery-dots" role="progressbar" aria-label="Odkryte fiszki" aria-valuemin="0" aria-valuemax="${task.cards.length}" aria-valuenow="${seen.size}">${task.cards.map(item => `<span class="${seen.has(item.id) ? 'found' : ''}"></span>`).join('')}</div><div class="footer-actions"><button class="secondary" data-card="-1" ${cardIndex === 0 ? 'disabled' : ''}>← Poprzednia</button><button class="secondary" data-card="1" ${cardIndex === task.cards.length - 1 ? 'disabled' : ''}>Następna →</button></div>`;
    }
    if (['single-choice', 'multiple-choice'].includes(task.type)) html = `<div class="options">${choices.map(option => {
      const chosen = task.type === 'single-choice' ? answer === option.id : answer.includes(option.id);
      return `<button class="option ${chosen ? 'selected' : ''}" data-option="${option.id}" aria-pressed="${chosen}" ${study && solved ? 'disabled' : ''}>${task.type === 'multiple-choice' ? `<span class="letter" aria-hidden="true">${chosen ? '✓' : '□'}</span>` : ''}${illustration(option.icon)}<span>${h(option.text)}</span></button>`;
    }).join('')}</div>`;
    if (task.type === 'matching') {
      const connected = Object.keys(answer).map(id => task.pairs.find(pair => pair.id === id)).filter(Boolean);
      const column = (side, pairs) => `<div class="pair-column"><p>${h(side === 'left' ? task.leftLabel || 'Połącz te karty' : task.rightLabel || 'Z pasującą odpowiedzią')}</p>${pairs.map(pair => {
        const used = side === 'left' ? Object.hasOwn(answer, pair.id) : Object.values(answer).includes(pair.id);
        const picked = selected?.side === side && selected.id === pair.id;
        const number = connected.findIndex(left => side === 'left' ? left.id === pair.id : answer[left.id] === pair.id) + 1;
        return `<button class="pair ${used ? study ? 'matched' : 'linked' : picked ? 'picked' : ''}" data-pair="${pair.id}" data-side="${side}" aria-pressed="${picked}" ${used ? 'disabled' : ''}>${side === 'left' ? illustration(pair.leftIcon) : ''}<span>${h(pair[side])}</span>${used ? `<span class="pair-number" aria-label="Połączenie ${number}">${number}</span>` : ''}</button>`;
      }).join('')}</div>`;
      const connections = !study ? `<ul class="pair-connections" aria-label="Twoje połączenia">${task.pairs.filter(pair => Object.hasOwn(answer, pair.id)).map(pair => `<li data-connection="${pair.id}"><span>${h(pair.left)} ↔ ${h(task.pairs.find(right => right.id === answer[pair.id])?.right)}</span><button class="text-button" data-unpair="${pair.id}" aria-label="Rozłącz: ${h(pair.left)}">Rozłącz</button></li>`).join('')}</ul>` : '';
      html = `<div class="pair-grid">${column('left', task.pairs)}${column('right', rightPairs)}</div>${connections}${controls ? `<p class="tiny-count">Połączone pary: ${Object.keys(answer).length} z ${task.pairs.length}</p>` : ''}${!solved && Object.keys(answer).length ? '<button class="text-button" data-reset-pairs>Wyczyść połączenia</button>' : ''}`;
    }
    if (task.type === 'sorting') html = `<div class="sort-items">${task.items.map(item => `<label class="sort-row">${image(item.icon)}<span><b>${h(item.text)}</b><select data-category="${item.id}" aria-label="Kategoria: ${h(item.text)}" ${study && solved ? 'disabled' : ''}><option value="">Wybierz szufladkę…</option>${task.categories.map(category => `<option value="${category.id}" ${answer[item.id] === category.id ? 'selected' : ''}>${h(category.text)}</option>`).join('')}</select></span></label>`).join('')}</div>`;
    if (task.type === 'ordering') html = `<p class="small">Przeciągaj za uchwyt ⠿ albo użyj strzałek. Kolejność od góry do dołu.</p><ol class="timeline">${answer.map((id, index) => `<li class="time-card" data-order-index="${index}" draggable="${!study || !solved}"><button class="drag-handle" aria-label="Przeciągnij element; klawiaturą użyj strzałek obok" ${study && solved ? 'disabled' : ''}>⠿</button><span class="time-label">${illustration(task.items.find(item => item.id === id)?.icon)}<b>${h(task.items.find(item => item.id === id)?.text)}</b></span><div class="move"><button data-move="${index},-1" aria-label="Przesuń ${h(task.items.find(item => item.id === id)?.text)} wyżej" ${index === 0 || study && solved ? 'disabled' : ''}>↑</button><button data-move="${index},1" aria-label="Przesuń ${h(task.items.find(item => item.id === id)?.text)} niżej" ${index === answer.length - 1 || study && solved ? 'disabled' : ''}>↓</button></div></li>`).join('')}</ol><p class="small axis-label">Schemat kolejności — bez skali czasu.</p>`;
    if (['short-answer', 'number-answer'].includes(task.type)) html = `<label class="field">${task.type === 'number-answer' ? `Twoja odpowiedź (${h(task.unit)})` : 'Twoja odpowiedź'}<input data-text-answer type="text" ${task.type === 'number-answer' ? 'inputmode="decimal"' : ''} autocomplete="off" maxlength="250" value="${h(answer)}" ${study && solved ? 'disabled' : ''}></label>`;
    if (controls && study && !solved && checkable) html += '<div class="footer-actions"><button class="primary" data-check>Sprawdź</button></div>';
    const retry = study && incorrect && !solved;
    html += `<div class="feedback ${solved ? 'success' : retry ? 'retry' : ''}" role="status" ${message ? '' : 'hidden'}>${retry ? `${sadOwl()}<div><strong>Spróbujmy jeszcze raz!</strong><span>${h(message)}</span></div>` : h(message)}</div>`;
    container.innerHTML = illustration(task.icon, 'question-illustration') + html;
    if (task.type === 'ordering' && (!study || !solved)) disposeDrag = attachReordering(container, move);
    if (task.type === 'matching') disposeLinks = attachPairLines(container, answer);
    onStateChange(getState());
    if (focusSelector) {
      let focus = container.querySelector(focusSelector);
      if (!focus || focus.disabled) focus = container.closest('.question-card')?.querySelector('[data-check], [data-action="next-learn"]:not(:disabled)');
      focus?.focus({preventScroll: true});
    }
  }
  function move(from, to) {
    if (study && solved || to < 0 || to >= answer.length) return;
    const [value] = answer.splice(from, 1);
    answer.splice(to, 0, value);
    message = '';
    changed();
    render(`[data-order-index="${to}"] .drag-handle`);
  }
  container.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target || target.disabled) return;
    if (target.hasAttribute('data-reveal')) {
      const id = target.dataset.reveal;
      revealedId = id;
      seen.add(id);
      if (seen.size === task.items.length) finish();
      message = '';
      render(`[data-reveal="${id}"]`);
    }
    if (target.hasAttribute('data-flip')) {
      flipMotion = true;
      flipped = !flipped;
      if (flipped) seen.add(task.cards[cardIndex].id);
      if (seen.size === task.cards.length) finish();
      render('[data-flip]');
    }
    if (target.hasAttribute('data-card')) {
      cardIndex += Number(target.dataset.card); flipped = false; flipMotion = false;
      render(`[data-card="${target.dataset.card}"]`);
    }
    if (target.dataset.option) {
      const id = target.dataset.option;
      answer = task.type === 'single-choice' ? id : answer.includes(id) ? answer.filter(value => value !== id) : [...answer, id];
      message = ''; changed();
      if (study && task.type === 'single-choice') {
        if (evaluateTask(task, answer)) finish();
        else { incorrect = true; message = task.hint || 'To jeszcze nie ten trop. Spróbuj ponownie; objaśnienie lekcji jest poniżej.'; }
      }
      render(`[data-option="${id}"]`);
    }
    if (target.dataset.pair) {
      const {side, pair: id} = target.dataset;
      if (!selected || selected.side === side) {
        selected = selected?.id === id && selected.side === side ? null : {side, id};
        message = ''; incorrect = false; render(`[data-side="${side}"][data-pair="${id}"]`);
      } else {
        const left = side === 'left' ? id : selected.id;
        const right = side === 'right' ? id : selected.id;
        if (study && left !== right) {
          incorrect = true;
          message = 'Te tropy jeszcze się nie łączą. Pierwsza karta nadal czeka.';
          render(`[data-side="${side}"][data-pair="${id}"]`);
        } else {
          answer[left] = right; selected = null; changed();
          if (study && Object.keys(answer).length === task.pairs.length) finish();
          render('.pair:not(:disabled)');
        }
      }
    }
    if (target.dataset.unpair && !study) {
      delete answer[target.dataset.unpair]; selected = null; message = ''; changed();
      render(`[data-side="left"][data-pair="${target.dataset.unpair}"]`);
    }
    if (target.hasAttribute('data-reset-pairs')) { answer = {}; selected = null; message = ''; changed(); render(); }
    if (target.dataset.move) { const [from, delta] = target.dataset.move.split(',').map(Number); move(from, from + delta); }
    if (target.hasAttribute('data-check')) check();
  }, options);
  container.addEventListener('change', event => {
    if (event.target.dataset.category) {
      const {category: id} = event.target.dataset;
      if (event.target.value) answer[id] = event.target.value; else delete answer[id];
      message = ''; changed();
    }
  }, options);
  container.addEventListener('input', event => {
    if (event.target.hasAttribute('data-text-answer')) { answer = event.target.value; changed(); }
  }, options);
  container.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target.hasAttribute('data-text-answer') && study && !solved) { event.preventDefault(); check(); }
  }, options);
  render();
  return {getAnswer: () => structuredClone(answer), getState, check, destroy: () => { disposeDrag(); disposeLinks(); controller.abort(); }};
}

function defaultAnswer(task) {
  if (task.type === 'ordering') {
    const order = shuffled(task.items.map(item => item.id));
    if (order.every((id, i) => id === task.correctOrder[i])) [order[0], order[1]] = [order[1], order[0]];
    return order;
  }
  if (task.type === 'multiple-choice') return [];
  if (['matching', 'sorting'].includes(task.type)) return {};
  if (['short-answer', 'number-answer'].includes(task.type)) return '';
  return null;
}
