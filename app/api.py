"""Transport-independent request handling: rate limiting, parsing, validation."""
from __future__ import annotations

import json
import threading
import time
from collections import defaultdict, deque
from collections.abc import Callable

from .models import Plan, PlanRequest, ValidationError
from .planner import build_plan

MAX_BODY_BYTES = 8 * 1024
MAX_TRACKED_CLIENTS = 10_000


class RateLimiter:
    """Thread-safe sliding-window limiter with bounded memory."""

    def __init__(self, limit: int = 20, window: float = 60.0, clock: Callable[[], float] = time.monotonic):
        self.limit = limit
        self.window = window
        self._clock = clock
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, client: str) -> bool:
        now = self._clock()
        with self._lock:
            hits = self._hits[client]
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            if len(self._hits) > MAX_TRACKED_CLIENTS:
                self._prune(now)
            return True

    def _prune(self, now: float) -> None:
        stale = [c for c, h in self._hits.items() if not h or now - h[-1] > self.window]
        for client in stale:
            del self._hits[client]


def handle_plan(
    raw: bytes,
    content_type: str,
    client: str,
    limiter: RateLimiter,
    plan_fn: Callable[[PlanRequest], Plan] = build_plan,
) -> tuple[int, dict]:
    """Return (status, JSON body) for a POST /api/plan request."""
    if not limiter.allow(client):
        return 429, {'detail': 'Too many requests. Please wait a minute and try again.'}
    if len(raw) > MAX_BODY_BYTES:
        return 413, {'detail': 'Request body too large.'}
    if 'application/json' not in content_type.lower():
        return 415, {'detail': 'Content-Type must be application/json.'}
    try:
        payload = json.loads(raw)
    except ValueError:
        return 400, {'detail': 'Request body is not valid JSON.'}
    try:
        request = PlanRequest.from_payload(payload)
    except ValidationError as error:
        return 422, {'detail': str(error)}
    return 200, plan_fn(request).to_dict()
