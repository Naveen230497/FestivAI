/**
 * Native Dialog Modal builder for actions like plan deletion or renaming
 */

/**
 * Display a native modal confirmation dialog.
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.message
 * @param {string} [options.confirmText]
 * @param {string} [options.cancelText]
 * @param {() => void} options.onConfirm
 */
export function showConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'modal-dialog';

  const heading = document.createElement('h3');
  heading.textContent = title;
  dialog.appendChild(heading);

  const desc = document.createElement('p');
  desc.textContent = message;
  desc.style.marginTop = '8px';
  dialog.appendChild(desc);

  const actions = document.createElement('div');
  actions.className = 'modal-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = cancelText;
  cancelBtn.addEventListener('click', () => {
    dialog.close();
    dialog.remove();
  });
  actions.appendChild(cancelBtn);

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-primary';
  confirmBtn.textContent = confirmText;
  confirmBtn.addEventListener('click', () => {
    dialog.close();
    dialog.remove();
    onConfirm();
  });
  actions.appendChild(confirmBtn);

  dialog.appendChild(actions);
  document.body.appendChild(dialog);
  dialog.showModal();
}
