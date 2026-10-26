/**
 * Results Dashboard View (results.js)
 * Bento Overview, Accessible Tabs (Overview, Budget, Timeline, Vendors, Ideas), What-If Slider
 */
import { getState, setActiveTab, toggleMilestone, toggleQuestion, setActivePlan } from '../state.js';
import { createSvgIcon } from '../components/icons.js';
import { renderWarnings } from '../components/warnings.js';
import { renderDonutChart } from '../components/donut.js';
import { formatCurrency, formatDate, formatRelativeDays } from '../format.js';
import { savePlan } from '../storage.js';
import { showToast } from '../components/toast.js';
import { requestPlan } from '../api.js';

export function renderResultsView() {
  const { activePlan, activeRequest, activeTab, completedMilestones, completedQuestions } = getState();
  const container = document.createElement('div');
  container.className = 'results-view';

  // If no plan is in state, show prompt to create or load one
  if (!activePlan || !activeRequest) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const icon = createSvgIcon('calendar', 'empty-icon', 48);
    empty.appendChild(icon);
    const h2 = document.createElement('h2');
    h2.textContent = 'No Active Plan Selected';
    empty.appendChild(h2);
    const p = document.createElement('p');
    p.textContent = 'Create a new event plan or load an existing plan from your saved list.';
    p.style.marginTop = '8px';
    empty.appendChild(p);
    const btn = document.createElement('a');
    btn.href = '#/plan';
    btn.className = 'btn btn-primary';
    btn.style.marginTop = 'var(--space-3)';
    btn.textContent = 'Start New Plan';
    empty.appendChild(btn);
    container.appendChild(empty);
    return container;
  }

  // 1. Bento Overview Banner
  const headerCard = document.createElement('section');
  headerCard.className = 'results-header-bento';
  headerCard.setAttribute('aria-labelledby', 'plan-summary-heading');

  const topRow = document.createElement('div');
  topRow.className = 'results-summary-row';

  const titleBox = document.createElement('div');
  const heading = document.createElement('h1');
  heading.id = 'plan-summary-heading';
  heading.tabIndex = -1;
  heading.textContent = activePlan.summary;
  titleBox.appendChild(heading);

  const badges = document.createElement('div');
  badges.style.display = 'flex';
  badges.style.gap = '8px';
  badges.style.alignItems = 'center';
  badges.style.marginTop = '6px';

  // Feasibility Badge
  const feasBadge = document.createElement('span');
  const f = activePlan.feasibility.toLowerCase();
  feasBadge.className = `badge badge-${f === 'tight' ? 'tight' : f === 'moderate' ? 'moderate' : f === 'comfortable' ? 'comfortable' : 'neutral'}`;
  feasBadge.textContent = `Budget Feasibility: ${activePlan.feasibility.toUpperCase()}`;
  badges.appendChild(feasBadge);

  // AI vs Rule-based Badge
  const aiBadge = document.createElement('span');
  aiBadge.className = `badge ${activePlan.ai_generated ? 'badge-ai' : 'badge-rule'}`;
  aiBadge.appendChild(createSvgIcon('sparkles', 'icon', 14));
  const aiSpan = document.createElement('span');
  aiSpan.textContent = activePlan.ai_generated ? 'AI-Personalised Ideas' : 'Rule-Based Ideas';
  aiBadge.appendChild(aiSpan);
  badges.appendChild(aiBadge);

  titleBox.appendChild(badges);
  topRow.appendChild(titleBox);

  // Action Buttons
  const actions = document.createElement('div');
  actions.className = 'results-actions btn-action-bar';

  // Save Plan Button
  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn btn-primary';
  saveBtn.appendChild(createSvgIcon('wallet', 'icon', 16));
  const saveText = document.createElement('span');
  saveText.textContent = 'Save Plan';
  saveBtn.appendChild(saveText);
  saveBtn.addEventListener('click', () => {
    const id = savePlan(activeRequest, activePlan);
    if (id) {
      showToast('Plan saved to this browser!', 'success');
    } else {
      showToast('Failed to save plan.', 'error');
    }
  });
  actions.appendChild(saveBtn);

  // Print / PDF Button
  const printBtn = document.createElement('button');
  printBtn.className = 'btn btn-secondary';
  printBtn.appendChild(createSvgIcon('printer', 'icon', 16));
  const printText = document.createElement('span');
  printText.textContent = 'Print / PDF';
  printBtn.appendChild(printText);
  printBtn.addEventListener('click', () => {
    window.print();
  });
  actions.appendChild(printBtn);

  // Copy Summary Button
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn-secondary';
  copyBtn.appendChild(createSvgIcon('copy', 'icon', 16));
  const copyText = document.createElement('span');
  copyText.textContent = 'Copy Text';
  copyBtn.appendChild(copyText);
  copyBtn.addEventListener('click', () => {
    const summaryText = generateTextSummary(activePlan, activeRequest);
    navigator.clipboard.writeText(summaryText).then(() => {
      showToast('Plan summary copied to clipboard!', 'info');
    });
  });
  actions.appendChild(copyBtn);

  topRow.appendChild(actions);
  headerCard.appendChild(topRow);

  // Metrics Strip
  const metrics = document.createElement('div');
  metrics.className = 'metrics-strip';

  const mItems = [
    { label: 'Total Budget (Estimate)', val: formatCurrency(activeRequest.budget, activeRequest.currency) },
    { label: 'Estimated Per-Head', val: formatCurrency(activePlan.per_head, activeRequest.currency) },
    { label: 'Guest Count', val: `${activeRequest.guest_count} Attendees` },
    { label: 'Milestones', val: `${activePlan.timeline.length} Scheduled` },
    { label: 'Key Vendors', val: `${activePlan.vendors.length} Categories` },
  ];

  mItems.forEach((m) => {
    const box = document.createElement('div');
    box.className = 'metric-box';
    const l = document.createElement('div');
    l.className = 'metric-label';
    l.textContent = m.label;
    const v = document.createElement('div');
    v.className = 'metric-value';
    v.textContent = m.val;
    box.appendChild(l);
    box.appendChild(v);
    metrics.appendChild(box);
  });

  headerCard.appendChild(metrics);
  container.appendChild(headerCard);

  // 2. Warnings Stack (role="alert")
  if (activePlan.warnings && activePlan.warnings.length > 0) {
    const warnStack = renderWarnings(activePlan.warnings);
    if (warnStack) container.appendChild(warnStack);
  }

  // 3. Accessible Tabs Component
  const tabsWrapper = document.createElement('section');
  tabsWrapper.className = 'tabs-container';
  tabsWrapper.setAttribute('aria-label', 'Plan Details Tabs');

  const tabList = document.createElement('div');
  tabList.className = 'tabs-nav';
  tabList.setAttribute('role', 'tablist');

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'sparkles' },
    { id: 'budget', label: 'Budget Split', icon: 'wallet' },
    { id: 'timeline', label: 'Timeline', icon: 'clock' },
    { id: 'vendors', label: 'Vendor Checklist', icon: 'users' },
    { id: 'ideas', label: 'Personalised Ideas', icon: 'sparkles' },
  ];

  const tabButtons = [];

  TABS.forEach((t) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.id = `tab-${t.id}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', `panel-${t.id}`);
    const isSelected = activeTab === t.id;
    btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    btn.setAttribute('tabindex', isSelected ? '0' : '-1');

    btn.appendChild(createSvgIcon(t.icon, 'icon', 16));
    const labelSpan = document.createElement('span');
    labelSpan.textContent = t.label;
    btn.appendChild(labelSpan);

    btn.addEventListener('click', () => {
      setActiveTab(t.id);
      renderResultsTabPanels(panelsContainer, t.id, activePlan, activeRequest, completedMilestones, completedQuestions);
      updateTabSelection(tabButtons, t.id);
    });

    tabButtons.push(btn);
    tabList.appendChild(btn);
  });

  // Keyboard navigation for tabs (Left/Right arrow keys)
  tabList.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIdx = tabButtons.findIndex((b) => b.getAttribute('aria-selected') === 'true');
      let nextIdx = e.key === 'ArrowRight' ? currentIdx + 1 : currentIdx - 1;
      if (nextIdx >= tabButtons.length) nextIdx = 0;
      if (nextIdx < 0) nextIdx = tabButtons.length - 1;
      tabButtons[nextIdx].click();
      tabButtons[nextIdx].focus();
    }
  });

  tabsWrapper.appendChild(tabList);

  const panelsContainer = document.createElement('div');
  renderResultsTabPanels(panelsContainer, activeTab, activePlan, activeRequest, completedMilestones, completedQuestions);
  tabsWrapper.appendChild(panelsContainer);

  container.appendChild(tabsWrapper);
  return container;
}

function updateTabSelection(buttons, selectedId) {
  buttons.forEach((btn) => {
    const isSel = btn.id === `tab-${selectedId}`;
    btn.setAttribute('aria-selected', isSel ? 'true' : 'false');
    btn.setAttribute('tabindex', isSel ? '0' : '-1');
  });
}

function renderResultsTabPanels(container, tabId, plan, req, completedMilestones, completedQuestions) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const panel = document.createElement('div');
  panel.id = `panel-${tabId}`;
  panel.className = 'tab-panel';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `tab-${tabId}`);

  switch (tabId) {
    case 'overview':
      panel.appendChild(createOverviewPanel(plan, req));
      break;
    case 'budget':
      panel.appendChild(createBudgetPanel(plan, req));
      break;
    case 'timeline':
      panel.appendChild(createTimelinePanel(plan, req, completedMilestones));
      break;
    case 'vendors':
      panel.appendChild(createVendorsPanel(plan, req, completedQuestions));
      break;
    case 'ideas':
      panel.appendChild(createIdeasPanel(plan, req));
      break;
  }

  container.appendChild(panel);
}

// 1. Overview Panel
function createOverviewPanel(plan, req) {
  const wrapper = document.createElement('div');

  const nextActionsCard = document.createElement('div');
  nextActionsCard.className = 'card';
  nextActionsCard.style.marginBottom = 'var(--space-3)';

  const heading = document.createElement('h3');
  heading.textContent = 'Immediate Next Actions';
  nextActionsCard.appendChild(heading);

  const sub = document.createElement('p');
  sub.textContent = 'Top prioritized milestones requiring your attention based on event lead time:';
  sub.style.marginTop = '4px';
  nextActionsCard.appendChild(sub);

  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '8px';
  list.style.marginTop = 'var(--space-2)';

  plan.timeline.slice(0, 3).forEach((item) => {
    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.padding = '8px 12px';
    row.style.backgroundColor = 'var(--color-surface-muted)';
    row.style.borderRadius = 'var(--radius-sm)';

    const taskSpan = document.createElement('span');
    taskSpan.textContent = item.task;
    taskSpan.style.fontWeight = '600';
    row.appendChild(taskSpan);

    const dateSpan = document.createElement('span');
    dateSpan.textContent = formatDate(item.due);
    dateSpan.className = 'timeline-date-chip';
    row.appendChild(dateSpan);

    list.appendChild(row);
  });

  nextActionsCard.appendChild(list);
  wrapper.appendChild(nextActionsCard);

  return wrapper;
}

// 2. Budget Panel with Donut, Table and What-If Slider
function createBudgetPanel(plan, req) {
  const wrapper = document.createElement('div');

  // Accessible Donut Chart
  const donut = renderDonutChart(plan.budget, req.currency, req.budget);
  wrapper.appendChild(donut);

  // What-If Budget Slider Container
  const sliderBox = document.createElement('div');
  sliderBox.className = 'what-if-slider-container';

  const sliderTitle = document.createElement('h4');
  sliderTitle.textContent = 'Interactive "What-If" Budget Modeler';
  sliderBox.appendChild(sliderTitle);

  const sliderDesc = document.createElement('p');
  sliderDesc.textContent = 'Slide to test how increasing or reducing total spending recalculates all category caps and per-guest figures:';
  sliderDesc.style.fontSize = 'var(--text-sm)';
  sliderBox.appendChild(sliderDesc);

  const sliderRow = document.createElement('div');
  sliderRow.className = 'slider-row';

  const range = document.createElement('input');
  range.type = 'range';
  range.className = 'range-input';
  range.min = '50';
  range.max = '150';
  range.value = '100';
  range.setAttribute('aria-label', 'Adjust budget percentage');

  const rangeVal = document.createElement('span');
  rangeVal.style.fontWeight = 'bold';
  rangeVal.style.minWidth = '140px';
  rangeVal.textContent = `100% (${formatCurrency(req.budget, req.currency)})`;

  let debounceTimer = null;
  range.addEventListener('input', () => {
    const pct = Number(range.value);
    const newBudget = Math.round(req.budget * (pct / 100));
    rangeVal.textContent = `${pct}% (${formatCurrency(newBudget, req.currency)})`;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const updatedReq = { ...req, budget: newBudget };
      const res = await requestPlan(updatedReq);
      if (res.ok) {
        setActivePlan(res.data, updatedReq);
        showToast(`Budget adjusted to ${formatCurrency(newBudget, req.currency)}`, 'info');
      }
    }, 400);
  });

  sliderRow.appendChild(range);
  sliderRow.appendChild(rangeVal);
  sliderBox.appendChild(sliderRow);
  wrapper.appendChild(sliderBox);

  // Accessible Data Table
  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-container';
  tableContainer.style.marginTop = 'var(--space-4)';

  const table = document.createElement('table');
  table.className = 'data-table';

  const caption = document.createElement('caption');
  caption.className = 'visually-hidden';
  caption.textContent = 'Categorized budget split table';
  table.appendChild(caption);

  const thead = document.createElement('thead');
  const hRow = document.createElement('tr');
  ['Category', 'Share', 'Estimated Amount', 'Role'].forEach((col, idx) => {
    const th = document.createElement('th');
    th.setAttribute('scope', 'col');
    th.textContent = col;
    if (idx === 1 || idx === 2) th.className = 'numeric';
    hRow.appendChild(th);
  });
  thead.appendChild(hRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  plan.budget.forEach((line) => {
    const tr = document.createElement('tr');

    const tdCat = document.createElement('td');
    tdCat.textContent = line.category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    tr.appendChild(tdCat);

    const tdShare = document.createElement('td');
    tdShare.className = 'numeric';
    tdShare.textContent = `${(line.share * 100).toFixed(1)}%`;
    tr.appendChild(tdShare);

    const tdAmt = document.createElement('td');
    tdAmt.className = 'numeric';
    tdAmt.textContent = formatCurrency(line.amount, req.currency);
    tr.appendChild(tdAmt);

    const tdRole = document.createElement('td');
    if (line.category === 'contingency') {
      const cBadge = document.createElement('span');
      cBadge.className = 'badge badge-tight';
      cBadge.textContent = 'Buffer Reserve';
      tdRole.appendChild(cBadge);
    } else {
      tdRole.textContent = 'Direct Expense';
    }
    tr.appendChild(tdRole);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tableContainer.appendChild(table);
  wrapper.appendChild(tableContainer);

  return wrapper;
}

// 3. Timeline Panel
function createTimelinePanel(plan, req, completedMilestones) {
  const wrapper = document.createElement('div');

  if (plan.timeline.some((t) => t.compressed)) {
    const compNotice = document.createElement('div');
    compNotice.className = 'warning-item';
    compNotice.style.marginBottom = 'var(--space-3)';
    compNotice.appendChild(createSvgIcon('alert-triangle', 'warning-icon', 20));
    const span = document.createElement('span');
    span.textContent = 'Timeline Compressed: The event date is close, so milestones were automatically scaled forward to ensure tasks do not land in the past.';
    compNotice.appendChild(span);
    wrapper.appendChild(compNotice);
  }

  // Progress Bar
  const total = plan.timeline.length;
  const done = completedMilestones.size;
  const pct = Math.round((done / total) * 100);

  const progressCard = document.createElement('div');
  progressCard.className = 'card';
  progressCard.style.marginBottom = 'var(--space-3)';
  const pHeader = document.createElement('div');
  pHeader.style.display = 'flex';
  pHeader.style.justifyContent = 'space-between';
  pHeader.style.fontWeight = 'bold';
  pHeader.textContent = `Milestones Completed: ${done} of ${total} (${pct}%)`;
  progressCard.appendChild(pHeader);

  const pBar = document.createElement('div');
  pBar.className = 'saved-progress-bar';
  const pFill = document.createElement('div');
  pFill.className = 'saved-progress-fill';
  pFill.style.width = `${pct}%`;
  pBar.appendChild(pFill);
  progressCard.appendChild(pBar);
  wrapper.appendChild(progressCard);

  // Vertical Timeline
  const vTimeline = document.createElement('div');
  vTimeline.className = 'timeline-vertical';

  plan.timeline.forEach((item) => {
    const step = document.createElement('div');
    const isDone = completedMilestones.has(item.task);
    step.className = `timeline-step-item ${isDone ? 'completed' : ''}`;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'timeline-marker-checkbox';
    cb.checked = isDone;
    cb.setAttribute('aria-label', `Mark task as completed: ${item.task}`);
    cb.addEventListener('change', () => {
      toggleMilestone(item.task);
      const isChecked = completedMilestones.has(item.task);
      step.classList.toggle('completed', isChecked);
      const newDone = completedMilestones.size;
      const newPct = Math.round((newDone / total) * 100);
      pHeader.textContent = `Milestones Completed: ${newDone} of ${total} (${newPct}%)`;
      pFill.style.width = `${newPct}%`;
    });
    step.appendChild(cb);

    const cBox = document.createElement('div');
    cBox.className = 'timeline-content';

    const tRow = document.createElement('div');
    tRow.style.display = 'flex';
    tRow.style.justifyContent = 'space-between';
    tRow.style.alignItems = 'center';

    const taskTitle = document.createElement('span');
    taskTitle.textContent = item.task;
    taskTitle.style.fontWeight = '600';
    tRow.appendChild(taskTitle);

    const dateRel = formatRelativeDays(item.due);
    const dateChip = document.createElement('span');
    dateChip.className = `timeline-date-chip ${dateRel.status === 'overdue' ? 'overdue' : dateRel.status === 'soon' ? 'due-soon' : ''}`;
    dateChip.textContent = `${formatDate(item.due)} (${dateRel.text})`;
    tRow.appendChild(dateChip);

    cBox.appendChild(tRow);
    step.appendChild(cBox);
    vTimeline.appendChild(step);
  });

  wrapper.appendChild(vTimeline);
  return wrapper;
}

// 4. Vendors Panel
function createVendorsPanel(plan, req, completedQuestions) {
  const wrapper = document.createElement('div');

  const grid = document.createElement('div');
  grid.className = 'vendors-grid';

  plan.vendors.forEach((vendor) => {
    const card = document.createElement('div');
    card.className = 'vendor-card';

    const header = document.createElement('div');
    header.className = 'vendor-card-header';

    const title = document.createElement('h3');
    title.textContent = vendor.category.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    header.appendChild(title);

    const capBadge = document.createElement('span');
    capBadge.className = 'badge badge-neutral';
    capBadge.textContent = `Cap: ${formatCurrency(vendor.budget_cap, req.currency)}`;
    header.appendChild(capBadge);
    card.appendChild(header);

    const rel = formatRelativeDays(vendor.book_by);
    const bookByText = document.createElement('p');
    bookByText.className = `timeline-date-chip ${rel.status === 'overdue' ? 'overdue' : rel.status === 'soon' ? 'due-soon' : ''}`;
    bookByText.textContent = `Book By: ${formatDate(vendor.book_by)} (${rel.text})`;
    bookByText.style.marginTop = '4px';
    card.appendChild(bookByText);

    // Questions checklist
    const qHeading = document.createElement('h4');
    qHeading.textContent = 'Questions to Ask Vendor:';
    qHeading.style.marginTop = 'var(--space-2)';
    card.appendChild(qHeading);

    const qList = document.createElement('ul');
    qList.className = 'vendor-questions-list';

    vendor.checklist.forEach((q, idx) => {
      const qKey = `${vendor.category}_q_${idx}`;
      const li = document.createElement('li');
      li.className = 'vendor-question-item';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'vendor-question-checkbox';
      cb.checked = completedQuestions.has(qKey);
      cb.addEventListener('change', () => {
        toggleQuestion(qKey);
      });
      li.appendChild(cb);

      const span = document.createElement('span');
      span.textContent = q;
      li.appendChild(span);

      qList.appendChild(li);
    });

    card.appendChild(qList);
    grid.appendChild(card);
  });

  wrapper.appendChild(grid);
  return wrapper;
}

// 5. Ideas Panel
function createIdeasPanel(plan, req) {
  const wrapper = document.createElement('div');

  const top = document.createElement('div');
  top.style.display = 'flex';
  top.style.justifyContent = 'space-between';
  top.style.alignItems = 'center';
  top.style.marginBottom = 'var(--space-3)';

  const badge = document.createElement('span');
  badge.className = `badge ${plan.ai_generated ? 'badge-ai' : 'badge-rule'}`;
  badge.appendChild(createSvgIcon('sparkles', 'icon', 14));
  const span = document.createElement('span');
  span.textContent = plan.ai_generated ? 'AI-Personalised Ideas' : 'Curated Rule-Based Ideas';
  badge.appendChild(span);
  top.appendChild(badge);

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'btn btn-secondary btn-sm';
  refreshBtn.appendChild(createSvgIcon('refresh-cw', 'icon', 14));
  const rText = document.createElement('span');
  rText.textContent = 'Refresh Ideas';
  refreshBtn.appendChild(rText);
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing...';
    const res = await requestPlan(req);
    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Refresh Ideas';
    if (res.ok) {
      setActivePlan(res.data, req);
      showToast('Ideas refreshed!', 'success');
    }
  });
  top.appendChild(refreshBtn);
  wrapper.appendChild(top);

  const grid = document.createElement('div');
  grid.className = 'ideas-grid';

  plan.ideas.forEach((ideaText, idx) => {
    const card = document.createElement('div');
    card.className = 'idea-card';

    const num = document.createElement('div');
    num.className = 'idea-card-number';
    num.textContent = `0${idx + 1}`;
    card.appendChild(num);

    const text = document.createElement('p');
    text.className = 'idea-text';
    text.textContent = ideaText;
    card.appendChild(text);

    grid.appendChild(card);
  });

  wrapper.appendChild(grid);
  return wrapper;
}

function generateTextSummary(plan, req) {
  return [
    `=== FestivAI Event Plan ===`,
    plan.summary,
    `Total Budget: ${formatCurrency(req.budget, req.currency)}`,
    `Per Guest: ${formatCurrency(plan.per_head, req.currency)} (${plan.feasibility})`,
    ``,
    `--- Budget Breakdown ---`,
    ...plan.budget.map((b) => `- ${b.category}: ${(b.share * 100).toFixed(0)}% (${formatCurrency(b.amount, req.currency)})`),
    ``,
    `--- Upcoming Milestones ---`,
    ...plan.timeline.slice(0, 5).map((t) => `- ${formatDate(t.due)}: ${t.task}`),
    ``,
    `--- Ideas ---`,
    ...plan.ideas.map((idea, i) => `${i + 1}. ${idea}`),
  ].join('\n');
}
