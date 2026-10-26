/**
 * LocalStorage management for FestivAI
 * Browser-only local persistence with graceful error recovery
 */

const STORAGE_KEY = 'festivai_saved_plans_v1';

/**
 * Safe retrieval of all stored plans from localStorage.
 * @returns {Array<any>}
 */
export function getSavedPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('FestivAI: Failed to read from localStorage', err);
    return [];
  }
}

/**
 * Save a newly generated plan.
 * @param {any} request
 * @param {any} plan
 * @param {string} [customName]
 * @returns {string|null} ID of saved plan
 */
export function savePlan(request, plan, customName = '') {
  try {
    const plans = getSavedPlans();
    const id = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const defaultName = `${request.event_type.charAt(0).toUpperCase() + request.event_type.slice(1)} celebration`;
    
    const entry = {
      id,
      name: customName.trim() || defaultName,
      createdAt: new Date().toISOString(),
      request,
      plan,
      completedMilestones: [],
      completedQuestions: [],
    };

    plans.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return id;
  } catch (err) {
    console.warn('FestivAI: Failed to save plan to localStorage', err);
    return null;
  }
}

/**
 * Retrieve a single plan by ID.
 * @param {string} id
 * @returns {any|null}
 */
export function getPlanById(id) {
  const plans = getSavedPlans();
  return plans.find((p) => p.id === id) || null;
}

/**
 * Update an existing saved plan entry.
 * @param {string} id
 * @param {Record<string, any>} updates
 * @returns {boolean}
 */
export function updatePlan(id, updates) {
  try {
    const plans = getSavedPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    plans[idx] = { ...plans[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return true;
  } catch (err) {
    console.warn('FestivAI: Failed to update plan in localStorage', err);
    return false;
  }
}

/**
 * Delete a plan from localStorage.
 * @param {string} id
 * @returns {boolean}
 */
export function deletePlan(id) {
  try {
    const plans = getSavedPlans();
    const filtered = plans.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.warn('FestivAI: Failed to delete plan from localStorage', err);
    return false;
  }
}

/**
 * Duplicate an existing plan.
 * @param {string} id
 * @returns {string|null} ID of cloned plan
 */
export function duplicatePlan(id) {
  const existing = getPlanById(id);
  if (!existing) return null;
  return savePlan(existing.request, existing.plan, `${existing.name} (Copy)`);
}
