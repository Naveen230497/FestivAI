"""Unit tests for plan orchestration and milestone synthesis."""
from __future__ import annotations

import unittest
from datetime import date, timedelta

from app.models import PlanRequest
from app.planner import build_plan
from tests.helpers import make_plan_request, no_ai


def make(**overrides: object) -> PlanRequest:
    """Construct a PlanRequest instance with test defaults."""
    return make_plan_request(**overrides)


class PlannerTests(unittest.TestCase):
    """Test suite for full plan generation logic."""

    def test_plan_has_every_deliverable(self) -> None:
        """Verify that generated plans include all required deliverables."""
        plan = build_plan(make(), llm_fn=no_ai)
        self.assertTrue(plan.budget and plan.timeline and plan.vendors and plan.ideas)
        self.assertFalse(plan.ai_generated)

    def test_all_event_types_produce_plans(self) -> None:
        """Verify successful plan generation for each supported event type."""
        for kind in ('wedding', 'birthday', 'community'):
            with self.subTest(kind=kind):
                plan = build_plan(make(event_type=kind), llm_fn=no_ai)
                self.assertEqual(round(sum(line.amount for line in plan.budget), 2), 60000.0)

    def test_vendors_sorted_and_not_in_past_with_enough_time(self) -> None:
        """Verify vendor booking dates are chronological and in the future."""
        plan = build_plan(make(), llm_fn=no_ai)
        dates = [v.book_by for v in plan.vendors]
        self.assertEqual(dates, sorted(dates))
        self.assertTrue(all(d >= date.today() for d in dates))

    def test_llm_ideas_used_when_available(self) -> None:
        """Verify that AI-generated ideas take precedence when available."""

        def custom_ideas(req: PlanRequest) -> list[str]:
            return ['custom idea']

        plan = build_plan(make(), llm_fn=custom_ideas)
        self.assertEqual(plan.ideas, ['custom idea'])
        self.assertTrue(plan.ai_generated)

    def test_short_notice_and_tight_budget_raise_warnings(self) -> None:
        """Verify warning generation for tight timelines and low budgets."""
        req = make(event_date=date.today() + timedelta(days=5), budget=3000.0)
        plan = build_plan(req, llm_fn=no_ai)
        self.assertEqual(plan.feasibility, 'tight')
        self.assertEqual(len(plan.warnings), 2)

    def test_large_community_event_mentions_permits_and_city(self) -> None:
        """Verify safety and permit advisories for large community gatherings."""
        req = make(event_type='community', guest_count=500, budget=500000.0, city='Pune')
        plan = build_plan(req, llm_fn=no_ai)
        self.assertTrue(any('permits' in w and 'Pune' in w for w in plan.warnings))
        self.assertIn('Pune', plan.summary)

    def test_preferences_and_city_personalise_fallback_ideas(self) -> None:
        """Verify that fallback ideas incorporate user city and preference context."""
        plan = build_plan(
            make(preferences=('outdoor',), city='Goa', theme='beach'),
            llm_fn=no_ai,
        )
        self.assertTrue(any('backup space' in i for i in plan.ideas))
        self.assertTrue(any('Goa' in i for i in plan.ideas))


if __name__ == '__main__':
    unittest.main()
