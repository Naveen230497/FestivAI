"""Unit tests for timeline scheduling and milestone compression."""
import unittest
from datetime import date, timedelta

from app.knowledge import BUDGET_SPLIT
from app.timeline import book_by, build_timeline, lead_scale

TODAY = date(2026, 10, 22)


class TimelineTests(unittest.TestCase):
    """Test suite for milestone due dates and lead-time scaling."""

    def test_enough_lead_time_is_not_compressed(self) -> None:
        """Verify uncompressed milestone scheduling when lead time is sufficient."""
        event = TODAY + timedelta(days=400)
        self.assertEqual(lead_scale('wedding', event, TODAY), 1.0)
        self.assertFalse(any(i.compressed for i in build_timeline('wedding', event, 1.0)))

    def test_short_notice_compresses_without_past_dates(self) -> None:
        """Verify lead-time compression prevents deadlines from preceding today."""
        event = TODAY + timedelta(days=30)
        scale = lead_scale('wedding', event, TODAY)
        items = build_timeline('wedding', event, scale)
        self.assertTrue(0 < scale < 1)
        self.assertTrue(all(i.due >= TODAY and i.compressed for i in items))
        self.assertEqual([i.due for i in items], sorted(i.due for i in items))

    def test_event_today_puts_everything_on_the_day(self) -> None:
        """Verify milestones default to the event day when organized same-day."""
        items = build_timeline('birthday', TODAY, lead_scale('birthday', TODAY, TODAY))
        self.assertTrue(all(i.due == TODAY for i in items))

    def test_book_by_uses_event_specific_lead_times(self) -> None:
        """Verify vendor booking dates adhere to event-specific lead times."""
        event = TODAY + timedelta(days=400)
        self.assertEqual(book_by('wedding', 'venue', event, 1.0), event - timedelta(weeks=44))
        self.assertEqual(book_by('birthday', 'venue', event, 1.0), event - timedelta(weeks=6))

    def test_every_budget_category_gets_a_valid_book_date(self) -> None:
        """Verify that all budget categories receive valid booking target dates."""
        event = TODAY + timedelta(days=10)
        for kind, split in BUDGET_SPLIT.items():
            scale = lead_scale(kind, event, TODAY)
            for category in split:
                self.assertGreaterEqual(book_by(kind, category, event, scale), TODAY)


if __name__ == '__main__':
    unittest.main()
