"""Shared test fixtures, mock openers, and server helpers."""
from __future__ import annotations

import io
import json
import os
import threading
import unittest
import urllib.request
from collections.abc import Callable
from datetime import date, timedelta
from http.server import ThreadingHTTPServer
from unittest import mock

from app.models import Plan, PlanRequest
from app.planner import build_plan
from app.server import make_server


def no_ai(req: PlanRequest) -> None:
    """Mock idea function that returns no AI ideas."""
    return None


def offline_plan(req: PlanRequest) -> Plan:
    """Build an event plan using deterministic fallback without external AI."""
    return build_plan(req, llm_fn=no_ai)


def make_payload(**overrides: object) -> dict:
    """Construct a dictionary payload for PlanRequest with test defaults."""
    base = {
        'event_type': 'wedding',
        'event_date': (date.today() + timedelta(days=100)).isoformat(),
        'guest_count': 100,
        'budget': 500000,
    }
    return {**base, **overrides}


def make_body(**overrides: object) -> bytes:
    """Construct a JSON-encoded request body with optional overrides."""
    base = {
        'event_type': 'wedding',
        'event_date': (date.today() + timedelta(days=200)).isoformat(),
        'guest_count': 150,
        'budget': 1500000,
    }
    return json.dumps({**base, **overrides}).encode()


def make_plan_request(**overrides: object) -> PlanRequest:
    """Construct a PlanRequest instance with test defaults."""
    base = {
        'event_type': 'birthday',
        'event_date': date.today() + timedelta(days=60),
        'guest_count': 30,
        'budget': 60000.0,
    }
    merged = {**base, **overrides}
    return PlanRequest(
        event_type=str(merged['event_type']),
        event_date=merged['event_date'],  # type: ignore[arg-type]
        guest_count=int(merged['guest_count']),  # type: ignore[arg-type]
        budget=float(merged['budget']),  # type: ignore[arg-type]
        currency=str(merged.get('currency', 'INR')),
        city=str(merged.get('city', '')),
        theme=str(merged.get('theme', '')),
        preferences=tuple(merged.get('preferences', ())),  # type: ignore[arg-type]
    )


class FakeResponse(io.BytesIO):
    """Context manager simulating an HTTP response stream."""

    def __enter__(self) -> FakeResponse:
        """Enter the runtime context and return self."""
        return self

    def __exit__(self, *exc: object) -> bool:
        """Exit the runtime context suppressing no exceptions."""
        return False


def opener_returning(text: str) -> Callable[[urllib.request.Request, float], FakeResponse]:
    """Construct a mock urllib opener that returns specified text."""
    body = json.dumps({'content': [{'type': 'text', 'text': text}]}).encode()

    def mock_open(request: urllib.request.Request, timeout: float = 15.0) -> FakeResponse:
        """Return a simulated response stream containing the mock body."""
        return FakeResponse(body)

    return mock_open


class EphemeralServerTestCase(unittest.TestCase):
    """Base test case managing an ephemeral HTTP server in a background thread."""

    server: ThreadingHTTPServer
    base: str
    env: mock._patch_dict

    @classmethod
    def setUpClass(cls) -> None:
        """Start the background test server on an ephemeral port."""
        cls.env = mock.patch.dict(os.environ, {}, clear=True)
        cls.env.start()
        cls.server = make_server('127.0.0.1', 0)
        cls.base = f'http://127.0.0.1:{cls.server.server_address[1]}'
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls) -> None:
        """Stop the test server and restore environment state."""
        cls.server.shutdown()
        cls.server.server_close()
        cls.env.stop()
