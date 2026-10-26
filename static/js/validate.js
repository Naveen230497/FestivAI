/**
 * Client-side validation mirroring server rules in app/models.py
 */

export const EVENT_TYPES = ['wedding', 'birthday', 'community'];
export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];
export const MAX_GUESTS = 2000;
export const MAX_BUDGET = 100_000_000;
export const MAX_TEXT = 80;
export const MAX_PREFERENCES = 10;
export const MAX_PREFERENCE_LEN = 40;

/**
 * Validate guest count.
 * @param {any} val
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateGuests(val) {
  const num = Number(val);
  if (!Number.isInteger(num) || num < 1 || num > MAX_GUESTS) {
    return { valid: false, error: `Guest count must be a whole number from 1 to ${MAX_GUESTS}` };
  }
  return { valid: true };
}

/**
 * Validate total budget amount.
 * @param {any} val
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateBudget(val) {
  const num = Number(val);
  if (isNaN(num) || num <= 0 || num > MAX_BUDGET) {
    return { valid: false, error: `Budget must be greater than 0 and at most ${MAX_BUDGET.toLocaleString()}` };
  }
  return { valid: true };
}

/**
 * Validate event date (today or in the future).
 * @param {string} dateStr
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, error: 'Event date must be in YYYY-MM-DD format' };
  }
  const chosen = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(chosen.getTime())) {
    return { valid: false, error: 'Invalid date specified' };
  }
  if (chosen < today) {
    return { valid: false, error: 'Event date must be today or in the future' };
  }
  return { valid: true };
}

/**
 * Validate short text fields like city or theme.
 * @param {string} text
 * @param {string} fieldName
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateText(text, fieldName) {
  if (typeof text !== 'string') return { valid: true };
  if (text.length > MAX_TEXT) {
    return { valid: false, error: `${fieldName} must be at most ${MAX_TEXT} characters` };
  }
  return { valid: true };
}

/**
 * Validate full plan request object before submission.
 * @param {Record<string, any>} payload
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validatePlanRequest(payload) {
  const errors = {};

  if (!EVENT_TYPES.includes(payload.event_type)) {
    errors.event_type = `Event type must be one of: ${EVENT_TYPES.join(', ')}`;
  }

  const dateCheck = validateDate(payload.event_date);
  if (!dateCheck.valid) errors.event_date = dateCheck.error;

  const guestsCheck = validateGuests(payload.guest_count);
  if (!guestsCheck.valid) errors.guest_count = guestsCheck.error;

  const budgetCheck = validateBudget(payload.budget);
  if (!budgetCheck.valid) errors.budget = budgetCheck.error;

  if (!CURRENCIES.includes(payload.currency)) {
    errors.currency = `Currency must be one of: ${CURRENCIES.join(', ')}`;
  }

  const cityCheck = validateText(payload.city, 'City');
  if (!cityCheck.valid) errors.city = cityCheck.error;

  const themeCheck = validateText(payload.theme, 'Theme');
  if (!themeCheck.valid) errors.theme = themeCheck.error;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
