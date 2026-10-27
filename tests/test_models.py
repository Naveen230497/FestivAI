"""Unit tests for PlanRequest validation and data models."""
from __future__ import annotations

import unittest
from datetime import date, timedelta

from app.models import PlanRequest, ValidationError

TODAY = date(2026, 10, 22)


def payload(**overrides: object) -> dict:
    """Generate a valid dictionary payload for testing."""
    base = {
        'event_type': 'wedding',
        'event_date': (TODAY + timedelta(days=100)).isoformat(),
        'guest_count': 100,
        'budget': 500000,
    }
    return {**base, **overrides}


class PlanRequestTests(unittest.TestCase):
    """Test suite for payload validation and sanitization."""

    def build(self, **overrides: object) -> PlanRequest:
        """Helper method to construct a PlanRequest with overrides."""
        return PlanRequest.from_payload(payload(**overrides), today=TODAY)

    def test_valid_payload_applies_defaults(self) -> None:
        """Verify that default values are assigned when optional fields are omitted."""
        req = self.build()
        self.assertEqual((req.currency, req.city, req.preferences), ('INR', '', ()))

    def test_preferences_are_normalised(self) -> None:
        """Verify that preference strings are cleaned and lowercased."""
        req = self.build(preferences=['  Outdoor ', 'LIVE MUSIC', ''])
        self.assertEqual(req.preferences, ('outdoor', 'live music'))

    def test_rejects_bad_values(self) -> None:
        """Verify validation errors for boundary and invalid values."""
        bad = [
            {'event_type': 'party'},
            {'event_date': '2026-10-21'},
            {'event_date': 'tomorrow'},
            {'guest_count': 0},
            {'guest_count': 2001},
            {'guest_count': 10.5},
            {'guest_count': True},
            {'budget': -5},
            {'budget': float('inf')},
            {'budget': '1000'},
            {'currency': 'XXX'},
            {'city': 'x' * 81},
            {'theme': 123},
            {'preferences': 'outdoor'},
            {'preferences': ['a'] * 11},
        ]
        for overrides in bad:
            with self.subTest(overrides=overrides), self.assertRaises(ValidationError):
                self.build(**overrides)

    def test_rejects_non_object_payload(self) -> None:
        """Verify that non-dictionary JSON payloads raise a ValidationError."""
        with self.assertRaises(ValidationError):
            PlanRequest.from_payload(['not', 'an', 'object'], today=TODAY)

    def test_control_characters_are_stripped(self) -> None:
        """Verify that unprintable control characters are removed from text fields."""
        self.assertEqual(self.build(city='Pu\x00ne\n').city, 'Pune')


if __name__ == '__main__':
    unittest.main()
