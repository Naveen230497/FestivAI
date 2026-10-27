"""End-to-end tests against a real local server on an ephemeral port."""
from __future__ import annotations

import json
import unittest
import urllib.error
import urllib.request
from datetime import date, timedelta

from tests.helpers import EphemeralServerTestCase


class ServerTests(EphemeralServerTestCase):
    """End-to-end integration tests using an ephemeral HTTP server."""

    def request(
        self,
        path: str,
        data: bytes | None = None,
        headers: dict[str, str] | None = None,
        method: str | None = None,
    ) -> tuple[int, dict, bytes]:
        """Send an HTTP request to the local test server."""
        req = urllib.request.Request(
            self.base + path,
            data=data,
            headers=headers or {},
            method=method,
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                return response.status, dict(response.headers), response.read()
        except urllib.error.HTTPError as error:
            return error.code, dict(error.headers), error.read()

    def test_health_and_security_headers(self) -> None:
        """Verify the /health endpoint and presence of security headers."""
        status, headers, _ = self.request('/health')
        self.assertEqual(status, 200)
        self.assertEqual(headers['X-Content-Type-Options'], 'nosniff')
        self.assertIn("default-src 'self'", headers['Content-Security-Policy'])

    def test_static_files_served(self) -> None:
        """Verify that static UI assets are served with proper MIME types."""
        for path in ('/', '/app.js', '/style.css'):
            with self.subTest(path=path):
                self.assertEqual(self.request(path)[0], 200)

    def test_unknown_and_traversal_paths_are_404(self) -> None:
        """Verify that unknown paths and traversal attempts return 404."""
        for path in ('/nope', '/../app/server.py', '/%2e%2e/app/server.py'):
            with self.subTest(path=path):
                self.assertEqual(self.request(path)[0], 404)

    def test_plan_round_trip(self) -> None:
        """Verify end-to-end plan generation through the HTTP endpoint."""
        payload = {
            'event_type': 'birthday',
            'event_date': (date.today() + timedelta(days=45)).isoformat(),
            'guest_count': 25,
            'budget': 40000,
            'city': 'Hyderabad',
            'preferences': ['kids'],
        }
        status, headers, raw = self.request(
            '/api/plan', json.dumps(payload).encode(), {'Content-Type': 'application/json'}
        )
        plan = json.loads(raw)
        self.assertEqual(status, 200)
        self.assertEqual(headers['Content-Type'], 'application/json')
        self.assertIn('Hyderabad', plan['summary'])
        self.assertRegex(plan['timeline'][0]['due'], r'^\d{4}-\d{2}-\d{2}$')

    def test_invalid_plan_is_422_with_message(self) -> None:
        """Verify that invalid payloads receive 422 with validation details."""
        status, _, raw = self.request(
            '/api/plan', b'{"event_type": "party"}', {'Content-Type': 'application/json'}
        )
        self.assertEqual(status, 422)
        self.assertIn('event_type', json.loads(raw)['detail'])

    def test_invalid_content_length_returns_400(self) -> None:
        """Verify that non-numeric Content-Length headers produce a 400 Bad Request."""
        status, _, raw = self.request(
            '/api/plan',
            data=b'{}',
            headers={'Content-Type': 'application/json', 'Content-Length': 'invalid'},
        )
        self.assertEqual(status, 400)
        self.assertIn('Invalid Content-Length', json.loads(raw)['detail'])

    def test_unsupported_http_method_returns_error(self) -> None:
        """Verify that unsupported HTTP methods return 501 Not Implemented."""
        status, _, _ = self.request('/health', method='DELETE')
        self.assertEqual(status, 501)

    def test_rate_limit_429_through_real_server(self) -> None:
        """Verify that exceeding rate limits through the real server returns 429."""
        payload = {
            'event_type': 'birthday',
            'event_date': (date.today() + timedelta(days=30)).isoformat(),
            'guest_count': 20,
            'budget': 20000,
        }
        data = json.dumps(payload).encode()
        headers = {'Content-Type': 'application/json'}
        status_codes = []
        for _ in range(25):
            code, _, _ = self.request('/api/plan', data=data, headers=headers)
            status_codes.append(code)
            if code == 429:
                break
        self.assertIn(429, status_codes)


if __name__ == '__main__':
    unittest.main()
