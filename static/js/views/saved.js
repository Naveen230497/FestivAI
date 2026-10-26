/**
 * My Saved Plans View (saved.js)
 * LocalStorage management: Save, Rename, Duplicate, Delete (Native <dialog>), Copy, Download, Print
 */
import { getSavedPlans, deletePlan, duplicatePlan, updatePlan } from '../storage.js';
import { setActivePlan } from '../state.js';
import { createSvgIcon } from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { showConfirmDialog } from '../components/dialog.js';
import { formatCurrency, formatDate } from '../format.js';

export function renderSavedView() {
  const container = document.createElement('div');
  container.className = 'saved-view';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = 'var(--space-3)';

  const titleBox = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.tabIndex = -1;
  h1.textContent = 'My Saved Plans';
  titleBox.appendChild(h1);

  const sub = document.createElement('p');
  sub.textContent = 'Plans are stored locally in this browser. You can revisit, duplicate, or export them anytime.';
  titleBox.appendChild(sub);
  header.appendChild(titleBox);

  const newBtn = document.createElement('a');
  newBtn.href = '#/plan';
  newBtn.className = 'btn btn-primary';
  newBtn.textContent = 'Create New Plan';
  newBtn.appendChild(createSvgIcon('sparkles', 'icon', 16));
  header.appendChild(newBtn);

  container.appendChild(header);

  const plans = getSavedPlans();

  if (plans.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.appendChild(createSvgIcon('wallet', 'empty-icon', 54));

    const eh2 = document.createElement('h2');
    eh2.textContent = 'No Saved Plans Yet';
    empty.appendChild(eh2);

    const ep = document.createElement('p');
    ep.textContent = 'When you build an event plan, click "Save Plan" to store your progress, checklists, and milestones here.';
    ep.style.marginTop = '8px';
    empty.appendChild(ep);

    const eb = document.createElement('a');
    eb.href = '#/plan';
    eb.className = 'btn btn-primary';
    eb.style.marginTop = 'var(--space-3)';
    eb.textContent = 'Start Planning';
    empty.appendChild(eb);

    container.appendChild(empty);
    return container;
  }

  const grid = document.createElement('div');
  grid.className = 'saved-plans-grid';

  plans.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'saved-card';

    const top = document.createElement('div');
    top.className = 'saved-card-header';

    const titleH3 = document.createElement('h3');
    titleH3.textContent = item.name;
    top.appendChild(titleH3);

    const typeBadge = document.createElement('span');
    typeBadge.className = 'badge badge-neutral';
    typeBadge.textContent = item.request.event_type.toUpperCase();
    top.appendChild(typeBadge);
    card.appendChild(top);

    const details = document.createElement('p');
    details.textContent = `${item.request.guest_count} Guests • ${formatCurrency(item.request.budget, item.request.currency)} • ${formatDate(item.request.event_date)}`;
    details.style.fontSize = 'var(--text-sm)';
    card.appendChild(details);

    // Progress Bar
    const totalM = item.plan.timeline ? item.plan.timeline.length : 0;
    const doneM = item.completedMilestones ? item.completedMilestones.length : 0;
    const pct = totalM > 0 ? Math.round((doneM / totalM) * 100) : 0;

    const progInfo = document.createElement('div');
    progInfo.style.fontSize = 'var(--text-xs)';
    progInfo.style.color = 'var(--color-text-secondary)';
    progInfo.textContent = `Progress: ${doneM}/${totalM} milestones completed (${pct}%)`;
    card.appendChild(progInfo);

    const pBar = document.createElement('div');
    pBar.className = 'saved-progress-bar';
    const pFill = document.createElement('div');
    pFill.className = 'saved-progress-fill';
    pFill.style.width = `${pct}%`;
    pBar.appendChild(pFill);
    card.appendChild(pBar);

    // Actions
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.flexWrap = 'wrap';
    actions.style.gap = '8px';
    actions.style.marginTop = 'var(--space-2)';

    // Open Plan
    const openBtn = document.createElement('button');
    openBtn.className = 'btn btn-primary btn-sm';
    openBtn.textContent = 'Open Plan';
    openBtn.addEventListener('click', () => {
      setActivePlan(item.plan, item.request, item.id);
      window.location.hash = '#/results';
    });
    actions.appendChild(openBtn);

    // Rename
    const renameBtn = document.createElement('button');
    renameBtn.className = 'btn btn-secondary btn-sm';
    renameBtn.textContent = 'Rename';
    renameBtn.addEventListener('click', () => {
      const newName = prompt('Enter a new name for this plan:', item.name);
      if (newName && newName.trim() && newName.trim() !== item.name) {
        updatePlan(item.id, { name: newName.trim() });
        titleH3.textContent = newName.trim();
        showToast('Plan renamed successfully!', 'success');
      }
    });
    actions.appendChild(renameBtn);

    // Duplicate
    const dupBtn = document.createElement('button');
    dupBtn.className = 'btn btn-secondary btn-sm';
    dupBtn.textContent = 'Duplicate';
    dupBtn.addEventListener('click', () => {
      duplicatePlan(item.id);
      showToast('Plan duplicated!', 'success');
      renderSavedView(); // Refresh list
    });
    actions.appendChild(dupBtn);

    // Download JSON
    const dlBtn = document.createElement('button');
    dlBtn.className = 'btn btn-secondary btn-sm';
    dlBtn.textContent = 'JSON';
    dlBtn.setAttribute('aria-label', `Download ${item.name} as JSON`);
    dlBtn.addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(item, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${item.name.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Downloaded plan JSON!', 'info');
    });
    actions.appendChild(dlBtn);

    // Delete with confirmation dialog
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-secondary btn-sm';
    delBtn.style.color = 'var(--color-tight)';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      showConfirmDialog({
        title: 'Delete Event Plan?',
        message: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
        confirmText: 'Delete Plan',
        onConfirm: () => {
          deletePlan(item.id);
          card.remove();
          showToast('Plan deleted.', 'info');
        },
      });
    });
    actions.appendChild(delBtn);

    card.appendChild(actions);
    grid.appendChild(card);
  });

  container.appendChild(grid);
  return container;
}
