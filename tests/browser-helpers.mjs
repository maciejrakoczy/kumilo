// Browser-only helpers: solve the activity actually drawn, never assume bank order.
export const shownTask = topic => topic.tasks.find(task => task.id === document.querySelector('#task-area')?.dataset.taskId);

export function solveTask(task, mode = 'learn', wrong = false, root = document.querySelector('#task-area')) {
  const press = selector => root.querySelector(selector).click();
  const input = value => {
    const node = root.querySelector('[data-text-answer]'); node.value = value;
    node.dispatchEvent(new Event('input', {bubbles: true}));
  };
  if (task.type === 'discovery') task.items.forEach(item => press(`[data-reveal="${item.id}"]`));
  if (task.type === 'flashcards') task.cards.forEach((card, i) => { press('[data-flip]'); if (i < task.cards.length - 1) press('[data-card="1"]'); });
  if (task.type === 'single-choice') press(`[data-option="${wrong ? task.options.find(o => o.id !== task.correctOptionId).id : task.correctOptionId}"]`);
  if (task.type === 'multiple-choice') (wrong ? [task.options.find(o => !task.correctOptionIds.includes(o.id))?.id].filter(Boolean) : task.correctOptionIds).forEach(id => press(`[data-option="${id}"]`));
  if (task.type === 'matching') {
    if (wrong) { press(`[data-side="left"][data-pair="${task.pairs[0].id}"]`); press(`[data-side="right"][data-pair="${task.pairs[1].id}"]`); }
    else task.pairs.forEach((pair, i) => {
      const side = i % 2 ? 'left' : 'right';
      press(`[data-side="${side}"][data-pair="${pair.id}"]`);
      press(`[data-side="${side === 'left' ? 'right' : 'left'}"][data-pair="${pair.id}"]`);
    });
  }
  if (task.type === 'sorting') task.items.forEach((item, i) => {
    const node = root.querySelector(`[data-category="${item.id}"]`);
    node.value = wrong && i === 0 ? task.categories.find(c => c.id !== item.categoryId).id : item.categoryId;
    node.dispatchEvent(new Event('change', {bubbles: true}));
  });
  if (task.type === 'ordering') (wrong ? [...task.correctOrder].reverse() : task.correctOrder).forEach((id, desired) => {
    const label = task.items.find(item => item.id === id).text;
    let index = [...root.querySelectorAll('.time-card b')].findIndex(item => item.textContent === label);
    while (index > desired) { press(`[data-move="${index},-1"]`); index--; }
  });
  if (task.type === 'short-answer') input(wrong ? 'nieznana odpowiedź' : `  ${task.acceptedAnswers[0].toUpperCase()}  `);
  if (task.type === 'number-answer') input(String(task.answer + (wrong ? task.tolerance + 1 : 0)).replace('.', ','));
  if (mode === 'learn') (root.querySelector('[data-check]') || root.closest('.question-card')?.querySelector('[data-check]'))?.click();
}

export function answerSignature(root = document.querySelector('#task-area')) {
  return JSON.stringify({
    inputs: [...root.querySelectorAll('input,select')].map(n => [n.dataset.category || 'answer', n.value]).sort(),
    options: [...root.querySelectorAll('.option.selected')].map(n => n.dataset.option).sort(),
    connections: [...root.querySelectorAll('[data-connection]')].map(n => n.dataset.connection + ':' + n.textContent).sort(),
    order: [...root.querySelectorAll('.time-card b')].map(n => n.textContent),
  });
}
