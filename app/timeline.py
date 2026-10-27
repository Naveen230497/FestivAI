"""Timeline and booking dates, compressed when the event is close."""
from datetime import date, timedelta

from .knowledge import DEFAULT_BOOK_WEEKS, MILESTONES
from .models import TimelineItem


def lead_scale(event_type: str, event_date: date, today: date) -> float:
    """1.0 when there is enough lead time, otherwise the compression factor (0..1)."""
    ideal_days = max(weeks for weeks, _, _ in MILESTONES[event_type]) * 7
    available = max((event_date - today).days, 0)
    return min(1.0, available / ideal_days)


def due_date(event_date: date, weeks_before: int, scale: float) -> date:
    """Calculate the due date for a milestone using lead time scaling."""
    return event_date - timedelta(days=round(weeks_before * 7 * scale))


def build_timeline(event_type: str, event_date: date, scale: float) -> list[TimelineItem]:
    """Build an ordered list of milestone items for the event."""
    steps = sorted(MILESTONES[event_type], key=lambda step: -step[0])
    return [
        TimelineItem(due_date(event_date, weeks, scale), task, category, scale < 1.0)
        for weeks, task, category in steps
    ]


def book_weeks(event_type: str) -> dict[str, int]:
    """Earliest milestone per category: how many weeks ahead each vendor should be booked."""
    weeks_by_category: dict[str, int] = {}
    for weeks, _, category in MILESTONES[event_type]:
        weeks_by_category[category] = max(weeks, weeks_by_category.get(category, 0))
    return weeks_by_category


def book_by(event_type: str, category: str, event_date: date, scale: float) -> date:
    """Calculate the recommended booking deadline date for a vendor category."""
    weeks = book_weeks(event_type).get(category, DEFAULT_BOOK_WEEKS)
    return due_date(event_date, weeks, scale)
