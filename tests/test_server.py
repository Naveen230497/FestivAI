"""End-to-end tests against a real local server on an ephemeral port."""
import json
import os
import threading
import unittest
import urllib.error
import urllib.request
from datetime import date, timedelta
from unittest import mock

from app.server import make_server


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.env = mock.patch.dict(os.environ, {}, clear=True)  # no API key: offline fallback
        cls.env.start()
        cls.server = make_server('127.0.0.1', 0)
        cls.base = f'http://127.0.0.1:{cls.server.server_address[1]}'
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.env.stop()

    def request(self, path, data=None, headers=None):
        req = urllib.request.Request(self.base + path, data=data, headers=headers or {})
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                return response.status, dict(response.headers), response.read()
        except urllib.error.HTTPError as error:
            return error.code, dict(error.headers), error.read()

    def test_health_and_security_headers(self):
        status, headers, _ = self.request('/health')
        self.assertEqual(status, 200)
        self.assertEqual(headers['X-Content-Type-Options'], 'nosniff')
        self.assertIn("default-src 'self'", headers['Content-Security-Policy'])

    def test_static_files_served(self):
        for path in ('/', '/app.js', '/style.css'):
            with self.subTest(path=path):
                self.assertEqual(self.request(path)[0], 200)

    def test_unknown_and_traversal_paths_are_404(self):
        for path in ('/nope', '/../app/server.py', '/%2e%2e/app/server.py'):
            with self.subTest(path=path):
                self.assertEqual(self.request(path)[0], 404)

    def test_plan_round_trip(self):
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

    def test_invalid_plan_is_422_with_message(self):
        status, _, raw = self.request(
            '/api/plan', b'{"event_type": "party"}', {'Content-Type': 'application/json'}
        )
        self.assertEqual(status, 422)
        self.assertIn('event_type', json.loads(raw)['detail'])


if __name__ == '__main__':
    unittest.main()
