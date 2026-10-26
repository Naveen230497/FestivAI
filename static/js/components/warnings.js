/**
 * Warnings stack renderer for critical context-aware alerts
 */
import { createSvgIcon } from './icons.js';

/**
 * Render the warnings stack element.
 * @param {string[]} warnings
 * @returns {HTMLElement|null}
 */
export function renderWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) {
    return null;
  }

  const stack = document.createElement('div');
  stack.className = 'warnings-stack';
  stack.setAttribute('role', 'alert');
  stack.setAttribute('aria-label', 'Planning alerts');

  warnings.forEach((text) => {
    const item = document.createElement('div');
    item.className = 'warning-item';

    const icon = createSvgIcon('alert-triangle', 'warning-icon', 20);
    item.appendChild(icon);

    const span = document.createElement('span');
    span.textContent = text;
    item.appendChild(span);

    stack.appendChild(item);
  });

  return stack;
}
