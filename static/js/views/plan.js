/**
 * Planner Form View (plan.js)
 * Sectioned form with live validation mirroring server rules
 */
import { createSvgIcon } from '../components/icons.js';
import { validatePlanRequest, EVENT_TYPES, CURRENCIES, MAX_GUESTS, MAX_BUDGET, MAX_TEXT } from '../validate.js';
import { formatCurrency } from '../format.js';
import { requestPlan } from '../api.js';
import { setActivePlan, setLoading } from '../state.js';
import { showToast } from '../components/toast.js';

export function renderPlanView() {
  const container = document.createElement('div');
  container.className = 'plan-view-container';

  // Read preselected event type from hash query if present (e.g. #/plan?type=wedding)
  const hash = window.location.hash;
  const match = hash.match(/type=([a-z]+)/);
  const preselectedType = match && EVENT_TYPES.includes(match[1]) ? match[1] : 'wedding';

  // Form Header
  const header = document.createElement('div');
  header.className = 'plan-header';

  const title = document.createElement('h1');
  title.tabIndex = -1;
  title.textContent = 'Build Your Event Plan';
  header.appendChild(title);

  const sub = document.createElement('p');
  sub.textContent = 'Provide your key parameters. Our engine will balance your budget, timeline, and vendor checklists.';
  header.appendChild(sub);
  container.appendChild(header);

  // Server error banner container
  const serverErrorBanner = document.createElement('div');
  serverErrorBanner.className = 'warning-item';
  serverErrorBanner.style.display = 'none';
  serverErrorBanner.style.marginBottom = 'var(--space-3)';
  serverErrorBanner.setAttribute('role', 'alert');
  container.appendChild(serverErrorBanner);

  // Main Form
  const form = document.createElement('form');
  form.setAttribute('novalidate', 'true');
  form.id = 'planner-form';

  // SECTION 1: The Basics
  const secBasics = document.createElement('section');
  secBasics.className = 'form-section';

  const secBasicsTitle = document.createElement('h2');
  secBasicsTitle.className = 'form-section-title';
  secBasicsTitle.appendChild(createSvgIcon('calendar', 'icon', 20));
  const s1Text = document.createElement('span');
  s1Text.textContent = '1. The Basics';
  secBasicsTitle.appendChild(s1Text);
  secBasics.appendChild(secBasicsTitle);

  // Event Type Radio Cards
  const typeGroup = document.createElement('div');
  typeGroup.className = 'form-group';
  typeGroup.style.marginBottom = 'var(--space-3)';

  const typeLabel = document.createElement('label');
  typeLabel.className = 'form-label';
  typeLabel.textContent = 'Event Type';
  typeGroup.appendChild(typeLabel);

  const radioContainer = document.createElement('div');
  radioContainer.className = 'radio-card-group';

  EVENT_TYPES.forEach((type) => {
    const card = document.createElement('label');
    card.className = 'radio-card';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'event_type';
    input.value = type;
    if (type === preselectedType) input.checked = true;

    const span = document.createElement('span');
    span.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    span.style.fontWeight = '600';

    card.appendChild(input);
    card.appendChild(span);
    radioContainer.appendChild(card);
  });
  typeGroup.appendChild(radioContainer);
  secBasics.appendChild(typeGroup);

  // Date & Guests Row
  const row1 = document.createElement('div');
  row1.className = 'form-row';

  // Event Date
  const dateGroup = document.createElement('div');
  dateGroup.className = 'form-group';
  const dateLabel = document.createElement('label');
  dateLabel.className = 'form-label';
  dateLabel.htmlFor = 'input-date';
  dateLabel.textContent = 'Event Date';
  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.id = 'input-date';
  dateInput.name = 'event_date';
  dateInput.className = 'form-control';
  const todayStr = new Date().toISOString().split('T')[0];
  dateInput.min = todayStr;
  dateInput.value = getDefaultDate(90);
  const dateErr = document.createElement('div');
  dateErr.className = 'form-error';
  dateGroup.appendChild(dateLabel);
  dateGroup.appendChild(dateInput);
  dateGroup.appendChild(dateErr);
  row1.appendChild(dateGroup);

  // Guests Count
  const guestGroup = document.createElement('div');
  guestGroup.className = 'form-group';
  const guestLabel = document.createElement('label');
  guestLabel.className = 'form-label';
  guestLabel.htmlFor = 'input-guests';
  guestLabel.textContent = 'Expected Guests';
  const guestInput = document.createElement('input');
  guestInput.type = 'number';
  guestInput.id = 'input-guests';
  guestInput.name = 'guest_count';
  guestInput.className = 'form-control';
  guestInput.min = '1';
  guestInput.max = String(MAX_GUESTS);
  guestInput.value = '100';
  const guestErr = document.createElement('div');
  guestErr.className = 'form-error';
  guestGroup.appendChild(guestLabel);
  guestGroup.appendChild(guestInput);
  guestGroup.appendChild(guestErr);
  row1.appendChild(guestGroup);

  secBasics.appendChild(row1);
  form.appendChild(secBasics);

  // SECTION 2: Budget & Financials
  const secBudget = document.createElement('section');
  secBudget.className = 'form-section';

  const secBudgetTitle = document.createElement('h2');
  secBudgetTitle.className = 'form-section-title';
  secBudgetTitle.appendChild(createSvgIcon('wallet', 'icon', 20));
  const s2Text = document.createElement('span');
  s2Text.textContent = '2. Budget & Currency';
  secBudgetTitle.appendChild(s2Text);
  secBudget.appendChild(secBudgetTitle);

  const row2 = document.createElement('div');
  row2.className = 'form-row';

  // Budget Input
  const budgetGroup = document.createElement('div');
  budgetGroup.className = 'form-group';
  const budgetLabel = document.createElement('label');
  budgetLabel.className = 'form-label';
  budgetLabel.htmlFor = 'input-budget';
  budgetLabel.textContent = 'Total Budget (Estimate)';
  const budgetInput = document.createElement('input');
  budgetInput.type = 'number';
  budgetInput.id = 'input-budget';
  budgetInput.name = 'budget';
  budgetInput.className = 'form-control';
  budgetInput.min = '1';
  budgetInput.max = String(MAX_BUDGET);
  budgetInput.value = '500000';
  const budgetErr = document.createElement('div');
  budgetErr.className = 'form-error';
  budgetGroup.appendChild(budgetLabel);
  budgetGroup.appendChild(budgetInput);
  budgetGroup.appendChild(budgetErr);
  row2.appendChild(budgetGroup);

  // Currency Selector
  const currGroup = document.createElement('div');
  currGroup.className = 'form-group';
  const currLabel = document.createElement('label');
  currLabel.className = 'form-label';
  currLabel.htmlFor = 'input-currency';
  currLabel.textContent = 'Currency';
  const currSelect = document.createElement('select');
  currSelect.id = 'input-currency';
  currSelect.name = 'currency';
  currSelect.className = 'form-control';
  CURRENCIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = `${c} (${c === 'INR' ? '₹' : c === 'USD' ? '$' : c === 'EUR' ? '€' : '£'})`;
    if (c === 'INR') opt.selected = true;
    currSelect.appendChild(opt);
  });
  currGroup.appendChild(currLabel);
  currGroup.appendChild(currSelect);
  row2.appendChild(currGroup);

  secBudget.appendChild(row2);

  // Live per-guest spend helper
  const perGuestHelper = document.createElement('div');
  perGuestHelper.className = 'metric-box';
  perGuestHelper.style.marginTop = 'var(--space-2)';
  const helperLabel = document.createElement('span');
  helperLabel.className = 'metric-label';
  helperLabel.textContent = 'Estimated Per-Guest Spend';
  const helperVal = document.createElement('span');
  helperVal.className = 'metric-value';
  helperVal.style.fontSize = '1.2rem';
  helperVal.textContent = '₹5,000 / guest';
  perGuestHelper.appendChild(helperLabel);
  perGuestHelper.appendChild(helperVal);

  function updatePerGuest() {
    const b = Number(budgetInput.value) || 0;
    const g = Number(guestInput.value) || 1;
    const curr = currSelect.value;
    const perHead = Math.round(b / g);
    helperVal.textContent = `${formatCurrency(perHead, curr)} / guest`;
  }
  budgetInput.addEventListener('input', updatePerGuest);
  guestInput.addEventListener('input', updatePerGuest);
  currSelect.addEventListener('change', updatePerGuest);

  secBudget.appendChild(perGuestHelper);
  form.appendChild(secBudget);

  // SECTION 3: Personalise
  const secPers = document.createElement('section');
  secPers.className = 'form-section';

  const secPersTitle = document.createElement('h2');
  secPersTitle.className = 'form-section-title';
  secPersTitle.appendChild(createSvgIcon('sparkles', 'icon', 20));
  const s3Text = document.createElement('span');
  s3Text.textContent = '3. Personalise';
  secPersTitle.appendChild(s3Text);
  secPers.appendChild(secPersTitle);

  const row3 = document.createElement('div');
  row3.className = 'form-row';

  // City
  const cityGroup = document.createElement('div');
  cityGroup.className = 'form-group';
  const cityLabel = document.createElement('label');
  cityLabel.className = 'form-label';
  cityLabel.htmlFor = 'input-city';
  cityLabel.textContent = 'City / Location';
  const cityInput = document.createElement('input');
  cityInput.type = 'text';
  cityInput.id = 'input-city';
  cityInput.name = 'city';
  cityInput.className = 'form-control';
  cityInput.maxLength = MAX_TEXT;
  cityInput.placeholder = 'e.g. Jaipur, Bengaluru, Mumbai';
  cityGroup.appendChild(cityLabel);
  cityGroup.appendChild(cityInput);
  row3.appendChild(cityGroup);

  // Theme
  const themeGroup = document.createElement('div');
  themeGroup.className = 'form-group';
  const themeLabel = document.createElement('label');
  themeLabel.className = 'form-label';
  themeLabel.htmlFor = 'input-theme';
  themeLabel.textContent = 'Event Theme / Concept';
  const themeInput = document.createElement('input');
  themeInput.type = 'text';
  themeInput.id = 'input-theme';
  themeInput.name = 'theme';
  themeInput.className = 'form-control';
  themeInput.maxLength = MAX_TEXT;
  themeInput.placeholder = 'e.g. Royal Rajputana, 80s Disco, Boho Chic';
  themeGroup.appendChild(themeLabel);
  themeGroup.appendChild(themeInput);
  row3.appendChild(themeGroup);

  secPers.appendChild(row3);

  // Preferences Fieldset with Real Checkboxes
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'fieldset-chips';
  const legend = document.createElement('legend');
  legend.textContent = 'Special Preferences & Focus Areas';
  fieldset.appendChild(legend);

  const chipsContainer = document.createElement('div');
  chipsContainer.className = 'chips-container';

  const PREF_OPTIONS = [
    { id: 'pref-outdoor', val: 'outdoor', label: 'Outdoor Venue' },
    { id: 'pref-music', val: 'live music', label: 'Live Music / Band' },
    { id: 'pref-veg', val: 'vegetarian', label: 'Vegetarian Catering' },
    { id: 'pref-photo', val: 'photography', label: 'Priority Photography' },
    { id: 'pref-kids', val: 'kids', label: 'Kid-Friendly Focus' },
  ];

  PREF_OPTIONS.forEach((opt) => {
    const label = document.createElement('label');
    label.className = 'chip-label';
    label.htmlFor = opt.id;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = opt.id;
    cb.name = 'preferences';
    cb.value = opt.val;

    const span = document.createElement('span');
    span.textContent = opt.label;

    label.appendChild(cb);
    label.appendChild(span);
    chipsContainer.appendChild(label);
  });

  fieldset.appendChild(chipsContainer);
  secPers.appendChild(fieldset);
  form.appendChild(secPers);

  // Form Submit Action Bar
  const actionBar = document.createElement('div');
  actionBar.className = 'form-actions-bar';

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn btn-primary btn-lg';
  submitBtn.textContent = 'Build My Plan';
  submitBtn.appendChild(createSvgIcon('arrow-right', 'icon', 20));
  actionBar.appendChild(submitBtn);

  form.appendChild(actionBar);

  // Loading skeleton placeholder (hidden initially)
  const skeletonCard = document.createElement('div');
  skeletonCard.className = 'card skeleton';
  skeletonCard.style.display = 'none';
  skeletonCard.style.height = '140px';
  skeletonCard.style.marginTop = 'var(--space-3)';
  const loadingText = document.createElement('div');
  loadingText.style.display = 'flex';
  loadingText.style.alignItems = 'center';
  loadingText.style.justifyContent = 'center';
  loadingText.style.height = '100%';
  loadingText.style.fontWeight = 'bold';
  loadingText.style.color = 'var(--color-violet)';
  loadingText.textContent = 'Building your plan...';
  skeletonCard.appendChild(loadingText);
  container.appendChild(skeletonCard);

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    serverErrorBanner.style.display = 'none';
    dateInput.removeAttribute('aria-invalid');
    guestInput.removeAttribute('aria-invalid');
    budgetInput.removeAttribute('aria-invalid');
    dateErr.textContent = '';
    guestErr.textContent = '';
    budgetErr.textContent = '';

    const selectedType = form.querySelector('input[name="event_type"]:checked')?.value || 'wedding';
    const checkedPrefs = Array.from(form.querySelectorAll('input[name="preferences"]:checked')).map((c) => c.value);

    const payload = {
      event_type: selectedType,
      event_date: dateInput.value,
      guest_count: Number(guestInput.value),
      budget: Number(budgetInput.value),
      currency: currSelect.value,
      city: cityInput.value.trim(),
      theme: themeInput.value.trim(),
      preferences: checkedPrefs,
    };

    const validation = validatePlanRequest(payload);
    if (!validation.valid) {
      let firstInvalid = null;
      if (validation.errors.event_date) {
        dateErr.textContent = validation.errors.event_date;
        dateInput.setAttribute('aria-invalid', 'true');
        firstInvalid = firstInvalid || dateInput;
      }
      if (validation.errors.guest_count) {
        guestErr.textContent = validation.errors.guest_count;
        guestInput.setAttribute('aria-invalid', 'true');
        firstInvalid = firstInvalid || guestInput;
      }
      if (validation.errors.budget) {
        budgetErr.textContent = validation.errors.budget;
        budgetInput.setAttribute('aria-invalid', 'true');
        firstInvalid = firstInvalid || budgetInput;
      }
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid.focus();
      }
      showToast('Please fix highlighted form errors.', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Building your plan...';
    skeletonCard.style.display = 'block';
    setLoading(true);

    const res = await requestPlan(payload);
    setLoading(false);
    skeletonCard.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Build My Plan';

    if (res.ok) {
      setActivePlan(res.data, payload);
      showToast('Plan created successfully!', 'success');
      window.location.hash = '#/results';
    } else {
      serverErrorBanner.style.display = 'flex';
      serverErrorBanner.textContent = res.error || 'Server error generating plan.';
      showToast(res.error || 'Failed to create plan.', 'error');
    }
  });

  container.appendChild(form);
  return container;
}

function getDefaultDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}
