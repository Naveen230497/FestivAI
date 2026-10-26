"""Domain templates. Adding an event type means adding data here, not code."""

BUDGET_SPLIT = {
    'wedding': {
        'venue': 0.25, 'catering': 0.30, 'decor': 0.12, 'photography': 0.10,
        'attire': 0.08, 'entertainment': 0.05, 'invitations': 0.02,
        'logistics': 0.04, 'contingency': 0.04,
    },
    'birthday': {
        'venue': 0.20, 'catering': 0.35, 'decor': 0.12, 'entertainment': 0.13,
        'cake': 0.08, 'photography': 0.04, 'return_gifts': 0.04,
        'contingency': 0.04,
    },
    'community': {
        'venue': 0.15, 'catering': 0.25, 'equipment_av': 0.15,
        'decor_signage': 0.08, 'entertainment': 0.10, 'marketing': 0.08,
        'permits_safety': 0.07, 'volunteers': 0.05, 'contingency': 0.07,
    },
}

# Preference keyword -> share deltas (shares are re-normalised after applying).
ADJUSTMENTS = {
    'outdoor': {'venue': -0.05, 'decor': 0.03, 'contingency': 0.02},
    'live music': {'entertainment': 0.04, 'decor': -0.02},
    'vegetarian': {'catering': -0.02, 'decor': 0.02},
    'photography': {'photography': 0.03, 'venue': -0.03},
    'kids': {'entertainment': 0.03, 'decor': -0.03},
}

# Rough minimum comfortable spend per guest in INR (documented assumption).
MIN_PER_HEAD_INR = {'wedding': 1500, 'birthday': 500, 'community': 150}

# (weeks before the event, task, category). Also drives vendor book-by dates.
MILESTONES = {
    'wedding': [
        (52, 'Set budget and draft guest list', 'planning'),
        (44, 'Shortlist and book venue', 'venue'),
        (40, 'Book photographer', 'photography'),
        (36, 'Finalise caterer and menu tasting', 'catering'),
        (24, 'Order attire', 'attire'),
        (20, 'Book entertainment', 'entertainment'),
        (16, 'Book decorator', 'decor'),
        (12, 'Send invitations', 'invitations'),
        (6, 'Confirm RSVPs and seating', 'planning'),
        (2, 'Share final headcount with vendors', 'logistics'),
        (1, 'Run-through and settle payments', 'logistics'),
    ],
    'birthday': [
        (8, 'Set budget, guest list and theme', 'planning'),
        (6, 'Book venue', 'venue'),
        (5, 'Book entertainment', 'entertainment'),
        (4, 'Send invitations', 'invitations'),
        (3, 'Confirm catering menu', 'catering'),
        (3, 'Order the cake', 'cake'),
        (1, 'Confirm RSVPs and final headcount', 'logistics'),
        (0, 'Set up decor on the day', 'decor'),
    ],
    'community': [
        (12, 'Define goals and apply for permits', 'permits_safety'),
        (10, 'Book venue', 'venue'),
        (8, 'Recruit volunteers', 'volunteers'),
        (6, 'Book AV equipment and entertainment', 'equipment_av'),
        (5, 'Order signage and decor', 'decor_signage'),
        (4, 'Launch promotion', 'marketing'),
        (2, 'Confirm catering and safety plan', 'catering'),
        (1, 'Brief volunteers', 'volunteers'),
    ],
}

# Used when a budget category has no milestone of its own.
DEFAULT_BOOK_WEEKS = 4

CHECKLISTS = {
    'venue': ['Is the date and capacity confirmed in writing?', 'What is the cancellation policy?', 'Are decor, sound and power included?'],
    'catering': ['Can you accommodate dietary needs?', 'Is service staff included in the quote?', 'What is the per-plate price at my headcount?'],
    'decor': ['Can you share photos of past work?', 'Who handles setup and teardown?', 'What is the damage deposit?'],
    'decor_signage': ['Are permits needed for banners?', 'Is weather-proofing included?', 'Who removes signage afterwards?'],
    'photography': ['How many edited photos are delivered?', 'What is the delivery timeline?', 'Is a backup photographer available?'],
    'attire': ['How many fittings are included?', 'What is the alteration lead time?', 'What is the return policy?'],
    'entertainment': ['Is a sound check included?', 'What are the overtime charges?', 'Is there a backup act?'],
    'invitations': ['Is a digital option available?', 'What is the proof-approval deadline?', 'Is delivery included?'],
    'logistics': ['Is transport arranged for key guests?', 'Is there a vendor arrival schedule?', 'Who is the day-of contact?'],
    'cake': ['Can the flavour suit allergies?', 'Is delivery and setup included?', 'What is the pickup window?'],
    'equipment_av': ['Is a technician on site?', 'Is backup power available?', 'What is the setup time?'],
    'marketing': ['Which channels reach our audience?', 'What is the registration process?', 'How will we track turnout?'],
    'permits_safety': ['Which local permits apply?', 'Is a first-aid point planned?', 'What are the crowd and fire limits?'],
    'volunteers': ['Are roles and shifts assigned?', 'Is there a briefing session?', 'Are meals provided for volunteers?'],
    'return_gifts': ['What is the per-unit price?', 'Is custom packaging available?', 'What is the delivery date?'],
}

FALLBACK_IDEAS = {
    'wedding': [
        'Build the {theme} look around one signature colour and one repeating motif.',
        'Add a welcome table with a hand-written note for each guest.',
        'Plan a 20-minute photo window before dinner so portraits do not eat the party.',
        'Offer a small live station (chaat, coffee or dessert) as a memorable extra.',
    ],
    'birthday': [
        'Turn the {theme} idea into one photo corner instead of full-room decor.',
        'Plan two group games plus one quiet activity so every age is included.',
        'Let guests add a message to a memory jar or video wall.',
        'Choose return gifts that match the theme and cost under 5 percent of the budget.',
    ],
    'community': [
        'Open with a short welcome and close with a clear call to action.',
        'Add a volunteer-of-the-day spotlight to keep helpers motivated.',
        'Use a QR code at the entrance for registration and feedback.',
        'Set aside a quiet corner and accessible seating for older attendees.',
    ],
}

PREFERENCE_IDEAS = {
    'outdoor': 'Reserve an indoor or covered backup space in case of rain or heat.',
    'vegetarian': 'Label every dish clearly and add a live vegetarian station.',
    'live music': 'Agree amplified-music cut-off hours with the venue early.',
    'kids': 'Add a supervised kids corner with colouring, clay or a short magic show.',
}
