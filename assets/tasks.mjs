import {evaluateTask} from './core.mjs';
import {escapeHtml as h, shuffled} from './ui.mjs';
import {attachReordering} from './reorder.mjs';

const image = icon => ['letter', 'pot', 'story'].includes(icon)
  ? `<img src="./assets/${icon}.svg" alt="" width="82" height="77">` : '<span class="unknown-icon" aria-hidden="true">✦</span>';

export function mountTask(container, task, {mode = 'learn', answer: initialAnswer, onAnswer = () => {}, onComplete = () => {}} = {}) {
  const study = mode === 'learn';
  let answer = initialAnswer == null ? defaultAnswer(task) : structuredClone(initialAnswer);
  let selected = null;
  let message = '';
  let solved = false;
  let cardIndex = 0;
  let flipped = false;
  const seen = new Set();
  const rightPairs = task.type === 'matching' ? shuffled(task.pairs) : [];
  let disposeDrag = () => {};
  const controller = new AbortController();
  const options = {signal: controller.signal};

  function changed() { onAnswer(structuredClone(answer)); }
  function finish() {
    if (!solved) {
      solved = true;
      message = task.explanation;
      onComplete();
    }
  }
  function check() {
    if (!study) return;
    if (evaluateTask(task, answer)) finish();
    else message = task.hint || 'Jeszcze nie wszystko się zgadza. Spróbuj ponownie lub zajrzyj do objaśnienia lekcji.';
    render();
  }
  function render(focusSelector = null) {
    disposeDrag();
    let html = '';
    if (task.type === 'discovery') html = `<div class="objects">${task.items.map(item => `<button class="object ${seen.has(item.id) ? 'opened' : ''}" data-reveal="${item.id}">${seen.has(item.id) ? '<span class="check">✓</span>' : ''}${image(item.icon)}<b>${h(item.text)}</b><small>${seen.has(item.id) ? 'Odkryte' : 'Kliknij i odkryj'}</small></button>`).join('')}</div>`;
    if (task.type === 'flashcards') {
      const card = task.cards[cardIndex];
      html = `<p class="tiny-count">Karta ${cardIndex + 1} z ${task.cards.length}</p><button class="flashcard" data-flip aria-pressed="${flipped}"><span class="eyebrow">${flipped ? 'ODPOWIEDŹ' : 'POMYŚL I ODWRÓĆ'}</span><strong>${h(flipped ? card.back : card.front)}</strong><small>Kliknij, aby odwrócić</small></button><div class="footer-actions"><button class="secondary" data-card="-1" ${cardIndex === 0 ? 'disabled' : ''}>← Poprzednia</button><button class="secondary" data-card="1" ${cardIndex === task.cards.length - 1 ? 'disabled' : ''}>Następna →</button></div>`;
    }
    if (['single-choice', 'multiple-choice'].includes(task.type)) html = `<div class="options">${task.options.map(option => {
      const chosen = task.type === 'single-choice' ? answer === option.id : answer.includes(option.id);
      return `<button class="option ${chosen ? 'selected' : ''}" data-option="${option.id}" aria-pressed="${chosen}" ${study && solved ? 'disabled' : ''}>${task.type === 'multiple-choice' ? `<span class="letter" aria-hidden="true">${chosen ? '✓' : '□'}</span>` : ''}${h(option.text)}</button>`;
    }).join('')}</div>`;
    if (task.type === 'matching') {
      const column = (side, pairs) => `<div class="pair-column"><p>${side === 'left' ? 'JEDNA STRONA' : 'DRUGA STRONA'}</p>${pairs.map(pair => {
        const used = side === 'left' ? Object.hasOwn(answer, pair.id) : Object.values(answer).includes(pair.id);
        const picked = selected?.side === side && selected.id === pair.id;
        return `<button class="pair ${used ? study ? 'matched' : 'linked' : picked ? 'picked' : ''}" data-pair="${pair.id}" data-side="${side}" aria-pressed="${picked}" ${used ? 'disabled' : ''}>${used ? study ? '✓ ' : '↔ ' : ''}${h(pair[side])}</button>`;
      }).join('')}</div>`;
      const connections = !study ? `<ul class="pair-connections" aria-label="Twoje połączenia">${task.pairs.filter(pair => Object.hasOwn(answer, pair.id)).map(pair => `<li data-connection="${pair.id}"><span>${h(pair.left)} ↔ ${h(task.pairs.find(right => right.id === answer[pair.id])?.right)}</span><button class="text-button" data-unpair="${pair.id}" aria-label="Rozłącz: ${h(pair.left)}">Rozłącz</button></li>`).join('')}</ul>` : '';
      html = `<div class="pair-grid">${column('left', task.pairs)}${column('right', rightPairs)}</div>${connections}<p class="tiny-count">Połączone pary: ${Object.keys(answer).length} z ${task.pairs.length}</p>${!solved && Object.keys(answer).length ? '<button class="text-button" data-reset-pairs>Wyczyść połączenia</button>' : ''}`;
    }
    if (task.type === 'sorting') html = `<div class="sort-items">${task.items.map(item => `<label class="sort-row">${image(item.icon)}<span><b>${h(item.text)}</b><select data-category="${item.id}" aria-label="Kategoria: ${h(item.text)}" ${study && solved ? 'disabled' : ''}><option value="">Wybierz szufladkę…</option>${task.categories.map(category => `<option value="${category.id}" ${answer[item.id] === category.id ? 'selected' : ''}>${h(category.text)}</option>`).join('')}</select></span></label>`).join('')}</div>`;
    if (task.type === 'ordering') html = `<p class="small">Przeciągaj za uchwyt ⠿ albo użyj strzałek. Kolejność od góry do dołu.</p><ol class="timeline">${answer.map((id, index) => `<li class="time-card" data-order-index="${index}" draggable="${!study || !solved}"><button class="drag-handle" aria-label="Przeciągnij element; klawiaturą użyj strzałek obok" ${study && solved ? 'disabled' : ''}>⠿</button><b>${h(task.items.find(item => item.id === id)?.text)}</b><div class="move"><button data-move="${index},-1" aria-label="Przesuń ${h(task.items.find(item => item.id === id)?.text)} wyżej" ${index === 0 || study && solved ? 'disabled' : ''}>↑</button><button data-move="${index},1" aria-label="Przesuń ${h(task.items.find(item => item.id === id)?.text)} niżej" ${index === answer.length - 1 || study && solved ? 'disabled' : ''}>↓</button></div></li>`).join('')}</ol><p class="small axis-label">Schemat kolejności — bez skali czasu.</p>`;
    if (['short-answer', 'number-answer'].includes(task.type)) html = `<label class="field">${task.type === 'number-answer' ? `Twoja odpowiedź (${h(task.unit)})` : 'Twoja odpowiedź'}<input data-text-answer type="text" ${task.type === 'number-answer' ? 'inputmode="decimal"' : ''} autocomplete="off" maxlength="250" value="${h(answer)}" ${study && solved ? 'disabled' : ''}></label>`;
    if (study && !solved && ['multiple-choice', 'sorting', 'ordering', 'short-answer', 'number-answer'].includes(task.type)) html += '<div class="footer-actions"><button class="primary" data-check>Sprawdź</button></div>';
    html += `<div class="feedback ${solved ? 'success' : ''}" role="status" ${message ? '' : 'hidden'}>${h(message)}</div>`;
    container.innerHTML = html;
    if (task.type === 'ordering' && (!study || !solved)) disposeDrag = attachReordering(container, move);
    if (focusSelector) container.querySelector(focusSelector)?.focus({preventScroll: true});
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
      seen.add(id);
      message = task.items.find(item => item.id === id).explanation;
      if (seen.size === task.items.length) { finish(); message = `${task.items.find(item => item.id === id).explanation} ${task.explanation}`; }
      render(`[data-reveal="${id}"]`);
    }
    if (target.hasAttribute('data-flip')) {
      flipped = !flipped;
      if (flipped) seen.add(task.cards[cardIndex].id);
      if (seen.size === task.cards.length) finish();
      render('[data-flip]');
    }
    if (target.hasAttribute('data-card')) {
      cardIndex += Number(target.dataset.card); flipped = false;
      render(`[data-card="${target.dataset.card}"]`);
    }
    if (target.dataset.option) {
      const id = target.dataset.option;
      answer = task.type === 'single-choice' ? id : answer.includes(id) ? answer.filter(value => value !== id) : [...answer, id];
      message = ''; changed();
      if (study && task.type === 'single-choice') {
        if (evaluateTask(task, answer)) finish();
        else message = task.hint || 'To jeszcze nie ten trop. Spróbuj ponownie; objaśnienie lekcji jest poniżej.';
      }
      render(`[data-option="${id}"]`);
    }
    if (target.dataset.pair) {
      const {side, pair: id} = target.dataset;
      if (!selected || selected.side === side) {
        selected = selected?.id === id && selected.side === side ? null : {side, id};
        message = ''; render(`[data-side="${side}"][data-pair="${id}"]`);
      } else {
        const left = side === 'left' ? id : selected.id;
        const right = side === 'right' ? id : selected.id;
        if (study && left !== right) {
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
  return {getAnswer: () => structuredClone(answer), destroy: () => { disposeDrag(); controller.abort(); }};
}

function defaultAnswer(task) {
  if (task.type === 'ordering') return task.items.map(item => item.id);
  if (task.type === 'multiple-choice') return [];
  if (['matching', 'sorting'].includes(task.type)) return {};
  if (['short-answer', 'number-answer'].includes(task.type)) return '';
  return null;
}
