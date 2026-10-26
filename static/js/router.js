/**
 * Hash Router for FestivAI
 * Updates document.title, shifts focus to view heading, manages aria-current
 */
import { renderHomeView } from './views/home.js';
import { renderPlanView } from './views/plan.js';
import { renderResultsView } from './views/results.js';
import { renderSavedView } from './views/saved.js';

const ROUTES = {
  '#/': {
    title: 'FestivAI | Plan the Celebration, Not the Spreadsheet',
    render: renderHomeView,
  },
  '#/plan': {
    title: 'FestivAI | Build Your Event Plan',
    render: renderPlanView,
  },
  '#/results': {
    title: 'FestivAI | Event Plan Dashboard',
    render: renderResultsView,
  },
  '#/saved': {
    title: 'FestivAI | My Saved Plans',
    render: renderSavedView,
  },
};

/**
 * Handle route changes and render into target container.
 * @param {HTMLElement} mainEl
 */
export function handleRoute(mainEl) {
  let hash = window.location.hash || '#/';
  // Strip query string for route resolution (e.g. #/plan?type=wedding -> #/plan)
  const basePath = hash.split('?')[0] || '#/';

  const routeConfig = ROUTES[basePath] || ROUTES['#/'];
  document.title = routeConfig.title;

  // Clear previous view
  while (mainEl.firstChild) {
    mainEl.removeChild(mainEl.firstChild);
  }

  // Render view
  const viewEl = routeConfig.render();
  mainEl.appendChild(viewEl);

  // Update navigation link highlights
  document.querySelectorAll('.site-nav .nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === basePath || (basePath === '#/' && href === '#/')) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  // Shift keyboard focus to the view's main heading for accessibility
  const heading = viewEl.querySelector('h1');
  if (heading) {
    heading.focus();
  }
}

/**
 * Initialize hash router listeners.
 * @param {HTMLElement} mainEl
 */
export function initRouter(mainEl) {
  window.addEventListener('hashchange', () => handleRoute(mainEl));
  handleRoute(mainEl);
}
