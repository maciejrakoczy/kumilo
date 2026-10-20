import {escapeHtml as h} from './ui.mjs';

// A closed set keeps content IDs independent from paths and arbitrary URLs.
const icons = new Set([
  'family-helena', 'family-ewa', 'family-pawel', 'family',
  'prehistory', 'antiquity', 'medieval', 'early-modern', 'contemporary',
  'diary', 'button', 'magnifier', 'letter', 'pot', 'story', 'cup',
]);

export function illustration(icon, css = '') {
  return icons.has(icon)
    ? `<img class="task-icon ${h(css)}" src="./assets/illustrations/${icon}.svg" alt="" width="128" height="128" draggable="false">`
    : '';
}
