import unittest

from app.budget import allocate, feasibility
from app.knowledge import BUDGET_SPLIT, MILESTONES


class BudgetTests(unittest.TestCase):
    def test_every_split_sums_to_one(self):
        for event_type, split in BUDGET_SPLIT.items():
            with self.subTest(event_type=event_type):
                self.assertAlmostEqual(sum(split.values()), 1.0, places=9)

    def test_every_event_type_has_milestones_and_split(self):
        self.assertEqual(set(BUDGET_SPLIT), set(MILESTONES))

    def test_allocation_sums_exactly_to_total(self):
        for event_type in BUDGET_SPLIT:
            for total in (1000, 99999.99, 1234567.89):
                lines = allocate(event_type, total, ())
                self.assertEqual(round(sum(line.amount for line in lines), 2), round(total, 2))

    def test_preferences_shift_budget(self):
        base = {l.category: l.amount for l in allocate('wedding', 1_000_000, ())}
        live = {l.category: l.amount for l in allocate('wedding', 1_000_000, ('live music',))}
        self.assertGreater(live['entertainment'], base['entertainment'])
        self.assertLess(live['decor'], base['decor'])

    def test_unknown_preference_is_ignored(self):
        self.assertEqual(allocate('birthday', 50000, ('zzz',)), allocate('birthday', 50000, ()))

    def test_feasibility_levels(self):
        cases = [(500, 'tight'), (2000, 'moderate'), (5000, 'comfortable')]
        for per_head, expected in cases:
            with self.subTest(per_head=per_head):
                self.assertEqual(feasibility('wedding', per_head, 'INR'), expected)

    def test_other_currencies_not_rated(self):
        self.assertEqual(feasibility('wedding', 10, 'USD'), 'not rated')


if __name__ == '__main__':
    unittest.main()
