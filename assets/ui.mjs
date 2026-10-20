export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const button = (label, action, css = 'primary', disabled = false) => `<button class="${css}" data-action="${action}"${disabled ? ' disabled' : ''}>${escapeHtml(label)}</button>`;
export const owl = (css = '', alt = '') => `<img class="${css}" src="./assets/owl.svg" alt="${escapeHtml(alt)}" width="310" height="265">`;
export const sadOwl = (css = '') => `<span class="owl-reaction ${css}" aria-hidden="true"><img src="./assets/owl-sad.svg" alt="" width="310" height="265"><svg class="owl-tear" viewBox="0 0 14 22"><path d="M7 1C5 6 1 10 1 14a6 6 0 0 0 12 0C13 10 9 6 7 1Z" fill="#67bce0"/><path d="M4 13v3" stroke="white" stroke-width="2" stroke-linecap="round"/></svg></span>`;
export function shuffled(values, random = Math.random) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
