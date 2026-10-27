"""Unit tests for budget allocation and feasibility calculation."""
import unittest

from app.budget import allocate, feasibility
from app.knowledge import BUDGET_SPLIT, MILESTONES


class BudgetTests(unittest.TestCase):
    """Test suite for financial calculations and category allocations."""

    def test_every_split_sums_to_one(self) -> None:
        """Verify that default category percentages sum exactly to one."""
        for event_type, split in BUDGET_SPLIT.items():
            with self.subTest(event_type=event_type):
                self.assertAlmostEqual(sum(split.values()), 1.0, places=9)

    def test_every_event_type_has_milestones_and_split(self) -> None:
        """Verify that every event type has budget splits and milestone definitions."""
        self.assertEqual(set(BUDGET_SPLIT), set(MILESTONES))

    def test_allocation_sums_exactly_to_total(self) -> None:
        """Verify that allocated category amounts sum exactly to the total budget."""
        for event_type in BUDGET_SPLIT:
            for total in (1000, 99999.99, 1234567.89):
                lines = allocate(event_type, total, ())
                self.assertEqual(round(sum(line.amount for line in lines), 2), round(total, 2))

    def test_preferences_shift_budget(self) -> None:
        """Verify that user preferences alter category shares correctly."""
        base = {line.category: line.amount for line in allocate('wedding', 1_000_000, ())}
        live = {
            line.category: line.amount
            for line in allocate('wedding', 1_000_000, ('live music',))
        }
        self.assertGreater(live['entertainment'], base['entertainment'])
        self.assertLess(live['decor'], base['decor'])

    def test_unknown_preference_is_ignored(self) -> None:
        """Verify that unrecognized preferences do not alter budget shares."""
        self.assertEqual(allocate('birthday', 50000, ('zzz',)), allocate('birthday', 50000, ()))

    def test_feasibility_levels(self) -> None:
        """Verify feasibility tier ratings based on spend per guest."""
        cases = [(500, 'tight'), (2000, 'moderate'), (5000, 'comfortable')]
        for per_head, expected in cases:
            with self.subTest(per_head=per_head):
                self.assertEqual(feasibility('wedding', per_head, 'INR'), expected)

    def test_other_currencies_not_rated(self) -> None:
        """Verify that non-INR currencies receive an unrated feasibility status."""
        self.assertEqual(feasibility('wedding', 10, 'USD'), 'not rated')


if __name__ == '__main__':
    unittest.main()
