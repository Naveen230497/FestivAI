"""Unit tests for request handling, validation, and rate limiting."""
from __future__ import annotations

import unittest

from app.api import MAX_BODY_BYTES, RateLimiter, handle_plan
from tests.helpers import make_body, offline_plan


def body(**overrides: object) -> bytes:
    """Construct a JSON-encoded request payload with optional overrides."""
    return make_body(**overrides)


def call(
    raw: bytes,
    content_type: str = 'application/json',
    limiter: RateLimiter | None = None,
) -> tuple[int, dict]:
    """Execute handle_plan with mock request parameters."""
    return handle_plan(
        raw, content_type, 'client', limiter or RateLimiter(), plan_fn=offline_plan
    )


class HandlePlanTests(unittest.TestCase):
    """Tests for handle_plan status codes and response bodies."""

    def test_success_returns_all_sections(self) -> None:
        """Verify that valid inputs return all required plan sections."""
        status, data = call(body())
        self.assertEqual(status, 200)
        self.assertTrue({'budget', 'timeline', 'vendors', 'ideas', 'warnings'} <= data.keys())

    def test_error_statuses(self) -> None:
        """Verify status codes for invalid content types, bodies, and payloads."""
        cases = [
            (call(b'not json'), 400),
            (call(body(), content_type='text/plain'), 415),
            (call(b'x' * (MAX_BODY_BYTES + 1)), 413),
            (call(body(guest_count=10**6)), 422),
            (call(body(event_date='2020-01-01')), 422),
            (call(b'[]'), 422),
        ]
        for (status, data), expected in cases:
            with self.subTest(expected=expected):
                self.assertEqual(status, expected)
                self.assertIn('detail', data)


class RateLimiterTests(unittest.TestCase):
    """Tests for sliding-window rate limiting behavior."""

    def test_blocks_after_limit_and_recovers(self) -> None:
        """Verify that requests exceeding the limit are blocked until the window elapses."""
        now = [0.0]

        def get_time() -> float:
            return now[0]

        limiter = RateLimiter(limit=2, window=10, clock=get_time)
        self.assertTrue(limiter.allow('a'))
        self.assertTrue(limiter.allow('a'))
        self.assertFalse(limiter.allow('a'))
        self.assertTrue(limiter.allow('b'))
        now[0] = 11.0
        self.assertTrue(limiter.allow('a'))

    def test_limit_applies_through_handler(self) -> None:
        """Verify that the rate limiter returns HTTP 429 via handle_plan."""
        limiter = RateLimiter(limit=1)
        self.assertEqual(call(body(), limiter=limiter)[0], 200)
        self.assertEqual(call(body(), limiter=limiter)[0], 429)

    def test_pruning_removes_stale_clients(self) -> None:
        """Verify that client records older than the window are pruned."""
        now = [0.0]

        def get_time() -> float:
            return now[0]

        limiter = RateLimiter(limit=10, window=5.0, clock=get_time)
        limiter.allow('client1')
        limiter.allow('client2')
        self.assertIn('client1', limiter._hits)
        self.assertIn('client2', limiter._hits)
        now[0] = 10.0
        limiter._prune(now[0])
        self.assertNotIn('client1', limiter._hits)
        self.assertNotIn('client2', limiter._hits)

    def test_pruning_triggered_on_overflow(self) -> None:
        """Verify that _prune is invoked when client tracking count exceeds max limit."""
        now = [0.0]

        def get_time() -> float:
            return now[0]

        limiter = RateLimiter(limit=10, window=5.0, clock=get_time)
        for i in range(10_001):
            limiter._hits[f'stale_{i}'].append(0.0)
        now[0] = 10.0
        self.assertTrue(limiter.allow('active_client'))
        self.assertLessEqual(len(limiter._hits), 10_000)


if __name__ == '__main__':
    unittest.main()
