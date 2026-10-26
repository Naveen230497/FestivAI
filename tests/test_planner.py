import unittest
from datetime import date, timedelta

from app.models import PlanRequest
from app.planner import build_plan


def no_ai(req):
    return None


def make(**overrides):
    base = {
        'event_type': 'birthday',
        'event_date': date.today() + timedelta(days=60),
        'guest_count': 30,
        'budget': 60000.0,
    }
    return PlanRequest(**{**base, **overrides})


class PlannerTests(unittest.TestCase):
    def test_plan_has_every_deliverable(self):
        plan = build_plan(make(), llm_fn=no_ai)
        self.assertTrue(plan.budget and plan.timeline and plan.vendors and plan.ideas)
        self.assertFalse(plan.ai_generated)

    def test_all_event_types_produce_plans(self):
        for kind in ('wedding', 'birthday', 'community'):
            with self.subTest(kind=kind):
                plan = build_plan(make(event_type=kind), llm_fn=no_ai)
                self.assertEqual(round(sum(l.amount for l in plan.budget), 2), 60000.0)

    def test_vendors_sorted_and_not_in_past_with_enough_time(self):
        plan = build_plan(make(), llm_fn=no_ai)
        dates = [v.book_by for v in plan.vendors]
        self.assertEqual(dates, sorted(dates))
        self.assertTrue(all(d >= date.today() for d in dates))

    def test_llm_ideas_used_when_available(self):
        plan = build_plan(make(), llm_fn=lambda req: ['custom idea'])
        self.assertEqual(plan.ideas, ['custom idea'])
        self.assertTrue(plan.ai_generated)

    def test_short_notice_and_tight_budget_raise_warnings(self):
        req = make(event_date=date.today() + timedelta(days=5), budget=3000.0)
        plan = build_plan(req, llm_fn=no_ai)
        self.assertEqual(plan.feasibility, 'tight')
        self.assertEqual(len(plan.warnings), 2)

    def test_large_community_event_mentions_permits_and_city(self):
        req = make(event_type='community', guest_count=500, budget=500000.0, city='Pune')
        plan = build_plan(req, llm_fn=no_ai)
        self.assertTrue(any('permits' in w and 'Pune' in w for w in plan.warnings))
        self.assertIn('Pune', plan.summary)

    def test_preferences_and_city_personalise_fallback_ideas(self):
        plan = build_plan(make(preferences=('outdoor',), city='Goa', theme='beach'), llm_fn=no_ai)
        self.assertTrue(any('backup space' in i for i in plan.ideas))
        self.assertTrue(any('Goa' in i for i in plan.ideas))


if __name__ == '__main__':
    unittest.main()
