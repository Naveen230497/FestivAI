/**
 * Pure formatting utilities for FestivAI
 */

/**
 * Format a numeric amount with the specified currency symbol.
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount) || 0;
  const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const sym = symbols[currency] || currency + ' ';
  
  if (currency === 'INR') {
    return `${sym}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }
  return `${sym}${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/**
 * Format an ISO date (YYYY-MM-DD) into an editorial date format (e.g., "15 Feb 2027").
 * @param {string|Date} dateVal
 * @returns {string}
 */
export function formatDate(dateVal) {
  if (!dateVal) return '';
  const d = typeof dateVal === 'string' ? new Date(`${dateVal}T00:00:00`) : dateVal;
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Return relative day difference description (e.g., "in 12 days", "overdue by 3 days", "today").
 * @param {string} dateStr
 * @returns {{ text: string, status: 'upcoming'|'overdue'|'today'|'soon' }}
 */
export function formatRelativeDays(dateStr) {
  if (!dateStr) return { text: '', status: 'upcoming' };
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { text: 'Today', status: 'today' };
  } else if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return { text: `${abs} ${abs === 1 ? 'day' : 'days'} overdue`, status: 'overdue' };
  } else if (diffDays <= 7) {
    return { text: `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`, status: 'soon' };
  } else if (diffDays <= 30) {
    const weeks = Math.round(diffDays / 7);
    return { text: `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`, status: 'upcoming' };
  } else {
    const months = Math.round(diffDays / 30);
    return { text: `In ${months} ${months === 1 ? 'month' : 'months'}`, status: 'upcoming' };
  }
}
