import {escapeHtml as h, button, owl} from './ui.mjs';
import {rewardShelf} from './rewards.mjs';
import {learningLessons, learningSlots} from './learning-plan.mjs';

export function planRewardShelf(topic, progress, lessonId) {
  const slots = lessonId ? learningLessons(topic).find(lesson => lesson.lessonId === lessonId).slots : learningSlots(topic);
  return rewardShelf(slots.map(slot => slot.id), progress.learning.completedSlotIds, slots);
}

export function learningHome(topic, progress) {
  const slots = learningSlots(topic), completed = progress.learning.completedSlotIds.length;
  const active = learningLessons(topic).find(lesson => lesson.lessonId === progress.learning.activeLessonId);
  const resume = active && progress.learning.lastSlotId ? `<button class="text-button" data-action="learn-lesson" data-lesson="${h(active.lessonId)}">Kontynuuj: ${h(active.title)}</button>` : '';
  const legacy = topic.learningPath.some(id => progress.completedTaskIds.includes(id));
  return `<section class="hero"><div class="hero-copy"><p class="eyebrow">TWOJA WYPRAWA Z KUMILO</p><h1>${h(topic.title)}</h1><p>${h(topic.summary)}</p></div>${owl('mascot', 'Sowa Kumilo — Twoja towarzyszka odkryć')}</section><div class="choice-grid"><button class="choice learn" data-action="learn"><span class="choice-icon" aria-hidden="true">✦</span><span><b>Ucz się tematami</b><small>${learningLessons(topic).length} tematów · ★ ${completed} / ${slots.length} odkryć</small></span><span class="arrow" aria-hidden="true">→</span></button><button class="choice" data-action="test-intro"><span class="choice-icon" aria-hidden="true">✓</span><span><b>Sprawdź się</b><small>Pełny test z wybranego tematu</small></span><span class="arrow" aria-hidden="true">→</span></button></div><div class="home-links">${resume}${button('Powtórka mieszana', 'mixed-review', 'text-button')}${button('Lekcje i mapa myśli', 'lessons', 'text-button')}${progress.lastResult ? button('Ostatni wynik', 'last-result', 'text-button') : ''}</div>${legacy ? `<details data-legacy-rewards><summary>Twoje wcześniejsze odkrycia</summary><p class="small">Zachowane gwiazdki i odznaki z wcześniejszej wyprawy. Nowe tematy mają własny postęp.</p>${rewardShelf(topic.learningPath, progress.completedTaskIds, topic.tasks)}</details>` : ''}`;
}

export function learningTopics(topic, progress) {
  return `<div class="stage-head"><p class="eyebrow">WYBIERZ SWÓJ TROP</p><h1>Jaki temat odkryjemy?</h1><p>Każdy temat to osobna, krótka wyprawa.</p></div><div class="choice-grid lesson-choices">${learningLessons(topic).map(lesson => {
    const done = lesson.slots.filter(slot => progress.learning.completedSlotIds.includes(slot.id)).length;
    const cursor = progress.learning.activeLessonId === lesson.lessonId ? progress.learning.lastSlotId : Object.hasOwn(progress.learning.cursors || {}, lesson.lessonId) && progress.learning.cursors[lesson.lessonId];
    const continuing = cursor || done > 0 && done < lesson.slots.length || lesson.slots.some(slot => progress.learning.extraPractice?.[slot.id]?.done === false);
    return `<div><button class="choice" data-action="learn-lesson" data-lesson="${h(lesson.lessonId)}"><span><b>${h(lesson.title)}</b><small>${done} / ${lesson.slots.length} odkryć · ${continuing ? 'Kontynuuj' : done === lesson.slots.length ? 'Zobacz podsumowanie' : 'Zaczynamy'}</small></span><span class="arrow" aria-hidden="true">→</span></button>${done || continuing ? `<button class="text-button" data-action="replay-lesson" data-lesson="${h(lesson.lessonId)}">Przejdź temat od początku</button>` : ''}</div>`;
  }).join('')}</div><div class="footer-actions">${button('Powtórka mieszana', 'mixed-review', 'secondary')}${button('Na start', 'home', 'text-button')}</div>`;
}
