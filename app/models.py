"""Request validation and response shapes. Standard library only."""
from __future__ import annotations

import math
from dataclasses import asdict, dataclass, field
from datetime import date

EVENT_TYPES = ('wedding', 'birthday', 'community')
CURRENCIES = ('INR', 'USD', 'EUR', 'GBP')
MAX_GUESTS = 2000
MAX_BUDGET = 100_000_000
MAX_TEXT = 80
MAX_PREFERENCES = 10
MAX_PREFERENCE_LEN = 40


class ValidationError(ValueError):
    """Raised with a user-safe message when the input is invalid."""


def _clean(value: object, limit: int, name: str) -> str:
    if not isinstance(value, str):
        raise ValidationError(f'{name} must be text')
    cleaned = ''.join(ch for ch in value if ch.isprintable()).strip()
    if len(cleaned) > limit:
        raise ValidationError(f'{name} must be at most {limit} characters')
    return cleaned


def _number(value: object, name: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValidationError(f'{name} must be a number')
    return float(value)


@dataclass(frozen=True)
class PlanRequest:
    """Validated parameters representing an event plan request."""
    event_type: str
    event_date: date
    guest_count: int
    budget: float
    currency: str = 'INR'
    city: str = ''
    theme: str = ''
    preferences: tuple[str, ...] = ()

    @classmethod
    def from_payload(cls, payload: object, today: date | None = None) -> PlanRequest:
        """Validate untrusted JSON and build a request, or raise ValidationError."""
        if not isinstance(payload, dict):
            raise ValidationError('request body must be a JSON object')
        today = today or date.today()

        event_type = payload.get('event_type')
        if event_type not in EVENT_TYPES:
            raise ValidationError(f'event_type must be one of: {", ".join(EVENT_TYPES)}')

        try:
            event_date = date.fromisoformat(str(payload.get('event_date')))
        except ValueError:
            raise ValidationError('event_date must be a date in YYYY-MM-DD format') from None
        if event_date < today:
            raise ValidationError('event_date must be today or later')

        guests = _number(payload.get('guest_count'), 'guest_count')
        if guests != int(guests) or not 1 <= guests <= MAX_GUESTS:
            raise ValidationError(f'guest_count must be a whole number from 1 to {MAX_GUESTS}')

        budget = _number(payload.get('budget'), 'budget')
        if not 0 < budget <= MAX_BUDGET:
            raise ValidationError(f'budget must be greater than 0 and at most {MAX_BUDGET}')

        currency = payload.get('currency', 'INR')
        if currency not in CURRENCIES:
            raise ValidationError(f'currency must be one of: {", ".join(CURRENCIES)}')

        raw_prefs = payload.get('preferences', [])
        if not isinstance(raw_prefs, list) or len(raw_prefs) > MAX_PREFERENCES:
            raise ValidationError(f'preferences must be a list of at most {MAX_PREFERENCES} items')
        prefs = tuple(
            p.lower()
            for p in (_clean(item, MAX_PREFERENCE_LEN, 'preference') for item in raw_prefs)
            if p
        )

        return cls(
            event_type=event_type,
            event_date=event_date,
            guest_count=int(guests),
            budget=budget,
            currency=currency,
            city=_clean(payload.get('city', ''), MAX_TEXT, 'city'),
            theme=_clean(payload.get('theme', ''), MAX_TEXT, 'theme'),
            preferences=prefs,
        )

    def to_context(self) -> dict:
        """JSON-safe view used as data (never instructions) for the LLM."""
        data = asdict(self)
        data['event_date'] = self.event_date.isoformat()
        data['preferences'] = list(self.preferences)
        return data


@dataclass
class BudgetLine:
    """Financial allocation share and amount for an event category."""
    category: str
    share: float
    amount: float


@dataclass
class TimelineItem:
    """Scheduled planning milestone with task description and deadline."""
    due: date
    task: str
    category: str
    compressed: bool


@dataclass
class VendorItem:
    """Vendor category booking requirements, budget ceiling, and checklist."""
    category: str
    book_by: date
    budget_cap: float
    checklist: list[str]


@dataclass
class Plan:
    """Complete synthesized event plan comprising budget, schedule, and ideas."""
    summary: str
    per_head: float
    feasibility: str
    budget: list[BudgetLine]
    timeline: list[TimelineItem]
    vendors: list[VendorItem]
    ideas: list[str]
    warnings: list[str] = field(default_factory=list)
    ai_generated: bool = False

    def to_dict(self) -> dict:
        """Plain dict; dates become ISO strings when serialised with default=str."""
        return asdict(self)
