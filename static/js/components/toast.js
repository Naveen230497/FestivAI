/**
 * Accessible Toast Notification System
 * Uses DOM builders and textContent; pure DOM construction
 */

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Show a toast notification message.
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} [type]
 * @param {number} [duration]
 */
export function showToast(message, type = 'info', duration = 3500) {
  const container = ensureContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const textNode = document.createElement('span');
  textNode.textContent = message;
  toast.appendChild(textNode);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn btn-sm btn-ghost';
  closeBtn.setAttribute('aria-label', 'Dismiss notification');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.isConnected) {
      toast.remove();
    }
  }, duration);
}
