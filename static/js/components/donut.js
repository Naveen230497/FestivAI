/**
 * Accessible SVG Donut Chart for Budget Allocation
 * Uses SVG presentation attributes (CSP safe, no inline style="" attributes)
 */
import { formatCurrency } from '../format.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const CATEGORY_COLORS = {
  venue: '#6C3BFF',
  catering: '#FF7043',
  decor: '#00B0FF',
  decor_signage: '#00B0FF',
  photography: '#FFB300',
  entertainment: '#00E676',
  equipment_av: '#7C4DFF',
  attire: '#EC407A',
  cake: '#AB47BC',
  invitations: '#26A69A',
  marketing: '#FF7043',
  volunteers: '#66BB6A',
  permits_safety: '#EF5350',
  return_gifts: '#8D6E63',
  logistics: '#78909C',
  contingency: '#FF5252',
};

const DEFAULT_COLOR = '#9E9E9E';

/**
 * Render Donut Chart with legend and data table.
 * @param {Array<{ category: string, share: number, amount: number }>} budgetLines
 * @param {string} currency
 * @param {number} totalBudget
 * @returns {HTMLElement}
 */
export function renderDonutChart(budgetLines, currency, totalBudget) {
  const container = document.createElement('div');
  container.className = 'budget-visual-split';

  // SVG Chart wrapper
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'donut-chart-wrapper';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'donut-svg');
  svg.setAttribute('viewBox', '0 0 240 240');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Budget breakdown donut chart totaling ${formatCurrency(totalBudget, currency)}`);

  const radius = 80;
  const circumference = 2 * Math.PI * radius; // ~502.65
  let offset = 0;

  budgetLines.forEach((line) => {
    const sliceLen = line.share * circumference;
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', '120');
    circle.setAttribute('cy', '120');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', CATEGORY_COLORS[line.category] || DEFAULT_COLOR);
    circle.setAttribute('stroke-width', '28');
    circle.setAttribute('stroke-dasharray', `${sliceLen.toFixed(2)} ${(circumference - sliceLen).toFixed(2)}`);
    circle.setAttribute('stroke-dashoffset', offset.toFixed(2));
    
    // Accessibility label on slice
    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `${line.category}: ${(line.share * 100).toFixed(1)}% (${formatCurrency(line.amount, currency)})`;
    circle.appendChild(title);

    svg.appendChild(circle);
    offset -= sliceLen;
  });

  chartWrapper.appendChild(svg);

  // Center text inside donut
  const centerText = document.createElement('div');
  centerText.className = 'donut-center-text';
  const centerLabel = document.createElement('div');
  centerLabel.className = 'metric-label';
  centerLabel.textContent = 'Total Budget';
  const centerVal = document.createElement('div');
  centerVal.className = 'metric-value';
  centerVal.style.fontSize = '1.3rem';
  centerVal.textContent = formatCurrency(totalBudget, currency);
  centerText.appendChild(centerLabel);
  centerText.appendChild(centerVal);
  chartWrapper.appendChild(centerText);

  container.appendChild(chartWrapper);

  // Legend list
  const legend = document.createElement('div');
  legend.className = 'donut-legend';

  budgetLines.forEach((line) => {
    const item = document.createElement('div');
    item.className = 'legend-item';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.alignItems = 'center';

    const dot = document.createElement('span');
    dot.className = 'legend-color-dot';
    dot.style.backgroundColor = CATEGORY_COLORS[line.category] || DEFAULT_COLOR;
    left.appendChild(dot);

    const name = document.createElement('span');
    name.textContent = line.category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (line.category === 'contingency') {
      name.textContent += ' (Reserve)';
      name.style.fontWeight = 'bold';
    }
    left.appendChild(name);

    const right = document.createElement('div');
    right.style.fontWeight = '600';
    right.textContent = `${(line.share * 100).toFixed(0)}% • ${formatCurrency(line.amount, currency)}`;

    item.appendChild(left);
    item.appendChild(right);
    legend.appendChild(item);
  });

  container.appendChild(legend);

  return container;
}
