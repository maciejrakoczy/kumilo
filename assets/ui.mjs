export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const button = (label, action, css = 'primary', disabled = false) => `<button class="${css}" data-action="${action}"${disabled ? ' disabled' : ''}>${escapeHtml(label)}</button>`;
export const owl = (css = '', alt = '') => `<img class="${css}" src="./assets/owl.svg" alt="${escapeHtml(alt)}" width="310" height="265">`;
export function shuffled(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
