import json
import unittest
from datetime import date, timedelta

from app.api import MAX_BODY_BYTES, RateLimiter, handle_plan
from app.planner import build_plan


def offline_plan(req):
    return build_plan(req, llm_fn=lambda r: None)


def body(**overrides):
    base = {
        'event_type': 'wedding',
        'event_date': (date.today() + timedelta(days=200)).isoformat(),
        'guest_count': 150,
        'budget': 1500000,
    }
    return json.dumps({**base, **overrides}).encode()


def call(raw, content_type='application/json', limiter=None):
    return handle_plan(raw, content_type, 'client', limiter or RateLimiter(), plan_fn=offline_plan)


class HandlePlanTests(unittest.TestCase):
    def test_success_returns_all_sections(self):
        status, data = call(body())
        self.assertEqual(status, 200)
        self.assertTrue({'budget', 'timeline', 'vendors', 'ideas', 'warnings'} <= data.keys())

    def test_error_statuses(self):
        cases = [
            (call(b'not json'), 400),
            (call(body(), content_type='text/plain'), 415),
            (call(b'x' * (MAX_BODY_BYTES + 1)), 413),
            (call(body(guest_count=10 ** 6)), 422),
            (call(body(event_date='2020-01-01')), 422),
            (call(b'[]'), 422),
        ]
        for (status, data), expected in cases:
            with self.subTest(expected=expected):
                self.assertEqual(status, expected)
                self.assertIn('detail', data)


class RateLimiterTests(unittest.TestCase):
    def test_blocks_after_limit_and_recovers(self):
        now = [0.0]
        limiter = RateLimiter(limit=2, window=10, clock=lambda: now[0])
        self.assertTrue(limiter.allow('a'))
        self.assertTrue(limiter.allow('a'))
        self.assertFalse(limiter.allow('a'))
        self.assertTrue(limiter.allow('b'))
        now[0] = 11.0
        self.assertTrue(limiter.allow('a'))

    def test_limit_applies_through_handler(self):
        limiter = RateLimiter(limit=1)
        self.assertEqual(call(body(), limiter=limiter)[0], 200)
        self.assertEqual(call(body(), limiter=limiter)[0], 429)


if __name__ == '__main__':
    unittest.main()
