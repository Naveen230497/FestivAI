/**
 * Reactive Application State for FestivAI
 */

const state = {
  activePlan: null,
  activeRequest: null,
  activePlanId: null,
  activeTab: 'overview',
  completedMilestones: new Set(),
  completedQuestions: new Set(),
  sliderMultiplier: 1.0,
  isLoading: false,
};

const listeners = new Set();

/**
 * Subscribe to state changes.
 * @param {(state: typeof state) => void} listener
 * @returns {() => void} unsubscribe
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch (e) {
      console.error('State subscriber error', e);
    }
  });
}

/**
 * Get a readonly snapshot of state.
 */
export function getState() {
  return state;
}

/**
 * Set the currently active plan and request.
 * @param {any} plan
 * @param {any} request
 * @param {string|null} [planId]
 */
export function setActivePlan(plan, request, planId = null) {
  state.activePlan = plan;
  state.activeRequest = request;
  state.activePlanId = planId;
  state.activeTab = 'overview';
  state.sliderMultiplier = 1.0;
  state.completedMilestones.clear();
  state.completedQuestions.clear();
  notify();
}

/**
 * Update current active tab in results.
 * @param {string} tabId
 */
export function setActiveTab(tabId) {
  state.activeTab = tabId;
  notify();
}

/**
 * Set loading status during network requests.
 * @param {boolean} loading
 */
export function setLoading(loading) {
  state.isLoading = loading;
  notify();
}

/**
 * Toggle milestone completion status.
 * @param {string} taskName
 * @returns {boolean} current checked state
 */
export function toggleMilestone(taskName) {
  if (state.completedMilestones.has(taskName)) {
    state.completedMilestones.delete(taskName);
  } else {
    state.completedMilestones.add(taskName);
  }
  notify();
  return state.completedMilestones.has(taskName);
}

/**
 * Toggle vendor question completion status.
 * @param {string} questionKey
 * @returns {boolean} current checked state
 */
export function toggleQuestion(questionKey) {
  if (state.completedQuestions.has(questionKey)) {
    state.completedQuestions.delete(questionKey);
  } else {
    state.completedQuestions.add(questionKey);
  }
  notify();
  return state.completedQuestions.has(questionKey);
}

/**
 * Update slider multiplier for what-if budget.
 * @param {number} mult
 */
export function setSliderMultiplier(mult) {
  state.sliderMultiplier = mult;
  notify();
}
