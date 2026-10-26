/**
 * Main application entry point for FestivAI
 */
import { initRouter } from './router.js';
import { showToast } from './components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
  const mainEl = document.getElementById('main');
  if (!mainEl) {
    console.error('FestivAI: #main container element not found.');
    return;
  }

  // Initialize client router
  initRouter(mainEl);

  // Network connection change alerts
  window.addEventListener('online', () => {
    showToast('Internet connection restored.', 'info');
  });

  window.addEventListener('offline', () => {
    showToast('You are currently offline. Changes are saved locally.', 'warning');
  });
});
