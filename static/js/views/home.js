/**
 * Home View (home.js)
 * Editorial Hero, Bento Event Category Tiles, How It Works Strip, Sample Presets
 */
import { createSvgIcon } from '../components/icons.js';
import { requestPlan } from '../api.js';
import { setActivePlan, setLoading } from '../state.js';
import { showToast } from '../components/toast.js';

export function renderHomeView() {
  const container = document.createElement('div');
  container.className = 'home-view';

  // 1. Editorial Hero Section
  const hero = document.createElement('section');
  hero.className = 'hero-section';
  hero.setAttribute('aria-labelledby', 'hero-heading');

  const content = document.createElement('div');
  content.className = 'hero-content';

  const tag = document.createElement('div');
  tag.className = 'hero-tagline';
  tag.appendChild(createSvgIcon('sparkles', 'icon-sparkle', 18));
  const tagText = document.createElement('span');
  tagText.textContent = 'Intelligent Celebration Engineering';
  tag.appendChild(tagText);
  content.appendChild(tag);

  const heading = document.createElement('h1');
  heading.id = 'hero-heading';
  heading.className = 'hero-title';
  heading.tabIndex = -1; // Allows programmatic focus on route change
  heading.textContent = 'Plan the celebration, not the spreadsheet.';
  content.appendChild(heading);

  const desc = document.createElement('p');
  desc.className = 'hero-description';
  desc.textContent =
    'FestivAI guides first-time organisers through weddings, birthdays, and community gatherings. Accurate budget splits, adaptive timelines, vendor interview checklists, and personalized ideas without the chaos.';
  content.appendChild(desc);

  const actions = document.createElement('div');
  actions.className = 'hero-actions';

  const startBtn = document.createElement('a');
  startBtn.href = '#/plan';
  startBtn.className = 'btn btn-primary btn-lg';
  startBtn.textContent = 'Start Planning';
  startBtn.appendChild(createSvgIcon('arrow-right', 'icon', 18));
  actions.appendChild(startBtn);

  const savedBtn = document.createElement('a');
  savedBtn.href = '#/saved';
  savedBtn.className = 'btn btn-secondary btn-lg';
  savedBtn.textContent = 'View Saved Plans';
  actions.appendChild(savedBtn);

  content.appendChild(actions);
  hero.appendChild(content);

  // Hero SVG Art Illustration
  const artWrapper = document.createElement('div');
  artWrapper.className = 'hero-art-container';
  const heroArtSvg = createSvgIcon('hero-art', 'hero-svg-art', 320);
  heroArtSvg.setAttribute('viewBox', '0 0 400 320');
  heroArtSvg.setAttribute('role', 'img');
  heroArtSvg.setAttribute('aria-label', 'Festive celebration abstract illustration');
  artWrapper.appendChild(heroArtSvg);
  hero.appendChild(artWrapper);
  container.appendChild(hero);

  // 2. Bento Category Tiles
  const bentoSection = document.createElement('section');
  bentoSection.setAttribute('aria-labelledby', 'events-heading');
  bentoSection.style.marginTop = 'var(--space-6)';

  const bentoTitle = document.createElement('h2');
  bentoTitle.id = 'events-heading';
  bentoTitle.textContent = 'Crafted for Every Milestone';
  bentoTitle.className = 'section-header';
  bentoSection.appendChild(bentoTitle);

  const bentoGrid = document.createElement('div');
  bentoGrid.className = 'bento-grid';

  const tiles = [
    {
      type: 'wedding',
      title: 'Weddings',
      desc: 'Balanced venue & catering shares, photography milestones, attire pacing, and guest etiquette.',
      icon: 'heart',
      tag: '52-Week Pacing',
    },
    {
      type: 'birthday',
      title: 'Birthdays',
      desc: 'Milestone celebrations with entertainment, customized cake orders, decor setups, and return gifts.',
      icon: 'cake',
      tag: '8-Week Timeline',
    },
    {
      type: 'community',
      title: 'Community Events',
      desc: 'Public gatherings, city authority permits, crowd logistics, volunteer briefs, and AV production.',
      icon: 'building',
      tag: 'Safety & Permits',
    },
  ];

  tiles.forEach((t) => {
    const tile = document.createElement('a');
    tile.href = `#/plan?type=${t.type}`;
    tile.className = 'bento-tile bento-col-4';
    tile.setAttribute('aria-label', `Plan a ${t.title}`);

    const top = document.createElement('div');
    const header = document.createElement('div');
    header.className = 'bento-tile-header';

    const iconBox = document.createElement('div');
    iconBox.className = 'bento-tile-icon';
    iconBox.appendChild(createSvgIcon(t.icon, 'icon', 24));
    header.appendChild(iconBox);

    const badge = document.createElement('span');
    badge.className = 'badge badge-neutral';
    badge.textContent = t.tag;
    header.appendChild(badge);

    top.appendChild(header);

    const title = document.createElement('h3');
    title.textContent = t.title;
    top.appendChild(title);

    const p = document.createElement('p');
    p.textContent = t.desc;
    p.style.marginTop = '8px';
    top.appendChild(p);

    tile.appendChild(top);

    const bottom = document.createElement('div');
    bottom.style.marginTop = 'var(--space-3)';
    bottom.style.display = 'flex';
    bottom.style.alignItems = 'center';
    bottom.style.gap = '6px';
    bottom.style.fontWeight = '600';
    bottom.style.color = 'var(--color-violet)';
    bottom.textContent = 'Explore Template';
    bottom.appendChild(createSvgIcon('arrow-right', 'icon', 16));
    tile.appendChild(bottom);

    bentoGrid.appendChild(tile);
  });

  bentoSection.appendChild(bentoGrid);
  container.appendChild(bentoSection);

  // 3. How It Works Strip
  const howSection = document.createElement('section');
  howSection.className = 'how-it-works-section';
  howSection.setAttribute('aria-labelledby', 'how-heading');

  const howHeader = document.createElement('div');
  howHeader.className = 'section-header';
  const howTitle = document.createElement('h2');
  howTitle.id = 'how-heading';
  howTitle.textContent = 'How FestivAI Works';
  const howSub = document.createElement('p');
  howSub.className = 'section-subtitle';
  howSub.textContent = 'Deterministic calculation for reliable numbers + GenAI for creative inspiration.';
  howHeader.appendChild(howTitle);
  howHeader.appendChild(howSub);
  howSection.appendChild(howHeader);

  const stepsGrid = document.createElement('div');
  stepsGrid.className = 'steps-grid';

  const steps = [
    { num: '1', title: 'Budget Allocation', desc: 'Category percentages re-weighted by your preferences. Always sums to 100% with zero penny drift.' },
    { num: '2', title: 'Adaptive Timeline', desc: 'Milestones scale automatically when your event date is close, so tasks never land in the past.' },
    { num: '3', title: 'Vendor Checklists', desc: 'Actionable book-by dates, estimated spending caps, and precise questions to ask every vendor.' },
    { num: '4', title: 'Personalized Ideas', desc: 'AI-tailored touches or curated rule-based concepts suited to your theme, city, and vibe.' },
  ];

  steps.forEach((s) => {
    const card = document.createElement('div');
    card.className = 'step-card';
    const num = document.createElement('div');
    num.className = 'step-number';
    num.textContent = s.num;
    card.appendChild(num);

    const title = document.createElement('h3');
    title.className = 'step-title';
    title.textContent = s.title;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'step-desc';
    desc.textContent = s.desc;
    card.appendChild(desc);

    stepsGrid.appendChild(card);
  });

  howSection.appendChild(stepsGrid);
  container.appendChild(howSection);

  // 4. Sample Presets Section
  const presetsSection = document.createElement('section');
  presetsSection.className = 'presets-section';
  presetsSection.setAttribute('aria-labelledby', 'presets-heading');

  const presetsHeader = document.createElement('div');
  presetsHeader.className = 'section-header';
  const presetsTitle = document.createElement('h2');
  presetsTitle.id = 'presets-heading';
  presetsTitle.textContent = 'Try a Sample Plan';
  const presetsSub = document.createElement('p');
  presetsSub.className = 'section-subtitle';
  presetsSub.textContent = 'One click to test realistic scenarios and see how FestivAI formats the output.';
  presetsHeader.appendChild(presetsTitle);
  presetsHeader.appendChild(presetsSub);
  presetsSection.appendChild(presetsHeader);

  const presetCards = document.createElement('div');
  presetCards.className = 'preset-cards';

  const samplePresets = [
    {
      title: 'Royal Heritage Wedding',
      meta: 'Jaipur • 150 Guests • ₹8,00,000',
      payload: {
        event_type: 'wedding',
        event_date: getFutureDate(120),
        guest_count: 150,
        budget: 800000,
        currency: 'INR',
        city: 'Jaipur',
        theme: 'Royal Rajputana',
        preferences: ['outdoor', 'photography'],
      },
    },
    {
      title: '80s Disco Milestone Birthday',
      meta: 'Mumbai • 35 Guests • ₹50,000',
      payload: {
        event_type: 'birthday',
        event_date: getFutureDate(21),
        guest_count: 35,
        budget: 50000,
        currency: 'INR',
        city: 'Mumbai',
        theme: 'Retro Neon',
        preferences: ['kids', 'vegetarian'],
      },
    },
    {
      title: 'Community Spring Carnival',
      meta: 'Bengaluru • 400 Guests • ₹1,60,000',
      payload: {
        event_type: 'community',
        event_date: getFutureDate(45),
        guest_count: 400,
        budget: 160000,
        currency: 'INR',
        city: 'Bengaluru',
        theme: 'Spring Fest',
        preferences: ['live music'],
      },
    },
  ];

  samplePresets.forEach((sample) => {
    const card = document.createElement('div');
    card.className = 'preset-card';

    const top = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = sample.title;
    top.appendChild(title);

    const meta = document.createElement('p');
    meta.textContent = sample.meta;
    meta.style.fontSize = 'var(--text-sm)';
    meta.style.marginTop = '4px';
    top.appendChild(meta);

    card.appendChild(top);

    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.textContent = 'Load Sample Plan';
    btn.appendChild(createSvgIcon('sparkles', 'icon', 16));
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Building plan...';
      setLoading(true);
      const res = await requestPlan(sample.payload);
      setLoading(false);
      if (res.ok) {
        setActivePlan(res.data, sample.payload);
        showToast('Sample plan loaded successfully!', 'success');
        window.location.hash = '#/results';
      } else {
        btn.disabled = false;
        btn.textContent = 'Load Sample Plan';
        showToast(res.error || 'Failed to generate plan.', 'error');
      }
    });
    card.appendChild(btn);

    presetCards.appendChild(card);
  });

  presetsSection.appendChild(presetCards);
  container.appendChild(presetsSection);

  return container;
}

function getFutureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
