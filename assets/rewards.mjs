import {escapeHtml as h} from './ui.mjs';

// Rewards reflect completed activities, not a separate score or mastery claim.
export function learningRewards(path, completedIds) {
  const completed = new Set(completedIds);
  const stars = path.filter(id => completed.has(id)).length;
  const total = path.length;
  const badges = total ? [
    {id: 'first', title: 'Pierwszy krok', icon: '✦', threshold: 1},
    {id: 'trail', title: 'Na tropie', icon: '⌖', threshold: Math.ceil(total / 2)},
    {id: 'explorer', title: 'Odkrywca', icon: '★', threshold: total},
  ].map(badge => ({...badge, earned: stars >= badge.threshold})) : [];
  return {stars, total, badges};
}

export function rewardShelf(path, completedIds, tasks) {
  const reward = learningRewards(path, completedIds);
  const completed = new Set(completedIds);
  return `<section class="reward-shelf" aria-label="Nagrody za wyprawę"><div class="reward-heading"><div><h2>Twoje odkrycia</h2><p>Za ukończone aktywności</p></div><span class="star-total"><span aria-hidden="true">★</span> ${reward.stars} z ${reward.total}</span></div><ol class="star-trail" aria-label="Ukończone aktywności">${path.map((id, index) => `<li class="${completed.has(id) ? 'earned' : ''}" title="${h(tasks.find(task => task.id === id)?.title)}"><span aria-hidden="true">${completed.has(id) ? '★' : index + 1}</span><span class="sr-only">${h(tasks.find(task => task.id === id)?.title)}: ${completed.has(id) ? 'ukończono' : 'przed Tobą'}</span></li>`).join('')}</ol><div class="badge-row">${reward.badges.map(badge => `<span class="adventure-badge ${badge.earned ? 'earned' : ''}"><span class="badge-icon" aria-hidden="true">${badge.icon}</span><span>${badge.title}<small>${badge.earned ? 'Zdobyta' : `${badge.threshold} ${badge.threshold === 1 ? 'aktywność' : 'aktywności'}`}</small></span></span>`).join('')}</div></section>`;
}

export function celebrate(container) {
  if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {};
  const burst = document.createElement('div');
  burst.className = 'star-burst';
  burst.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 18; i++) {
    const star = document.createElement('span');
    star.textContent = i % 3 ? '✦' : '●';
    star.style.setProperty('--x', `${(i % 9 - 4) * 38}px`);
    star.style.setProperty('--y', `${-65 - i % 4 * 32}px`);
    star.style.setProperty('--spin', `${i % 2 ? 140 : -140}deg`);
    star.style.setProperty('--delay', `${i % 3 * 45}ms`);
    burst.append(star);
  }
  container.append(burst);
  const timeout = setTimeout(() => burst.remove(), 1600);
  return () => { clearTimeout(timeout); burst.remove(); };
}
