import {escapeHtml as h, button} from './ui.mjs';

export const lamp = '<svg viewBox="0 0 24 28" fill="none" aria-hidden="true"><path d="M8 20c0-4-5-5-5-11a9 9 0 0 1 18 0c0 6-5 7-5 11M8 20h8M9 24h6M10 27h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

const formats = {
  discovery: ['Odkryj wszystkie ślady', 'Klikaj karty i poznawaj ich historie.'],
  flashcards: ['Pomyśl i odwróć kartę', 'Spróbuj odpowiedzieć przed odwróceniem.'],
  'single-choice': ['Wybierz jedną odpowiedź', 'Wskaż odpowiedź, która pasuje najlepiej.'],
  'multiple-choice': ['Wybierz wszystkie pasujące odpowiedzi', 'Możesz zaznaczyć więcej niż jedną kartę.'],
  matching: ['Połącz pasujące karty', 'Możesz zacząć z dowolnej strony.'],
  sorting: ['Przyporządkuj do grup', 'Wybierz grupę przy każdym elemencie.'],
  ordering: ['Ułóż we właściwej kolejności', 'Przeciągaj za uchwyt lub użyj strzałek.'],
  'short-answer': ['Wpisz swoją odpowiedź', 'Przeczytaj uważnie, o co pytamy.'],
  'number-answer': ['Oblicz i wpisz wynik', 'Zwróć uwagę na jednostkę odpowiedzi.'],
};

export function journeyTrack({index, total, label}) {
  return `<div class="journey-track" style="--journey-progress:${total > 1 ? (index - 1) / (total - 1) * 100 : 0}%" role="progressbar" aria-label="${h(label)}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${index}">${Array.from({length: total}, (_, i) => `<span class="journey-dot ${i + 1 < index ? 'past' : i + 1 === index ? 'current' : ''}" aria-hidden="true"></span>`).join('')}</div>`;
}

export function activityScreen({task, index, total, mode = 'learn', reviewing = false, points, deadline, notes = '', stars = '', hints = true, stageTitle = ''}) {
  const study = mode === 'learn';
  const [prompt, tip] = formats[task.type];
  const title = task.type === 'matching' && task.leftLabel === 'Źródło' ? 'Połącz źródło z informacją' : prompt;
  return `<section class="activity work-activity" data-session-mode="${mode}">
    <div class="session-heading"><h2>${stageTitle ? `${h(stageTitle)} · ` : ''}${h(task.title)}</h2>${journeyTrack({index, total, label: reviewing ? 'Powtórka' : study ? 'Postęp nauki' : 'Postęp testu'})}</div>
    <section class="stage question-card" aria-labelledby="question-title">
      <header class="question-top"><div><h1 id="question-title">${h(title)}</h1><p class="question-instruction">${h(task.instruction)}</p></div><div class="task-tip">${lamp}<span>${h(study ? tip : 'Możesz wracać do pytań przed zatwierdzeniem.')}</span></div></header>
      ${!study ? `<div class="question-meta"><span>${points} pkt</span>${deadline ? `<span id="time-left">Pozostało ${Math.max(0, Math.ceil((deadline - Date.now()) / 1000))} s</span>` : ''}</div>` : ''}
      <div id="task-area" data-task-id="${h(task.id)}"></div>
      ${study ? `<div id="reward-area" class="reward-toast" role="status" hidden></div>${hints ? `<aside id="task-hint-panel" class="task-hint-panel" aria-label="Podpowiedź" hidden><p>${h(task.hint || tip)}</p>${notes}</aside>` : ''}` : ''}
      <footer class="task-controls"><div class="task-secondary">${study ? `${hints ? `<button class="secondary hint-button" data-action="toggle-hint" aria-expanded="false" aria-controls="task-hint-panel">${lamp}<span>Podpowiedź</span></button>` : ''}<span class="learning-loot" aria-label="Gwiazdki za ukończone aktywności">★ <span id="learn-stars">${h(stars)}</span></span>` : button('← Wstecz', 'exam-back', 'secondary', index === 1)}</div><p id="task-progress" class="task-progress" role="status"></p><div class="task-primary-group">${button(study ? 'Dalej →' : index === total ? 'Przejrzyj odpowiedzi →' : 'Dalej →', study ? 'next-learn' : 'exam-next', 'primary', study)}<small id="task-next-help">${study ? 'Wykonaj zadanie, aby przejść dalej' : 'Możesz pominąć i wrócić'}</small></div></footer>
    </section>
  </section>`;
}
