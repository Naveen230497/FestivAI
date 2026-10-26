/**
 * Safe SVG Icon builder referencing static/icons.svg symbols
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create an inline SVG icon element referencing a symbol in icons.svg
 * @param {string} name - Icon symbol name (e.g. 'calendar', 'users', 'check')
 * @param {string} [className] - Optional CSS classes
 * @param {number} [size] - Icon width and height in px
 * @returns {SVGSVGElement}
 */
export function createSvgIcon(name, className = 'icon', size = 20) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', '0 0 24 24');

  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `/icons.svg#icon-${name}`);
  svg.appendChild(use);

  return svg;
}
