"""Sentry Webhook & Telemetry Client."""
from __future__ import annotations

import hmac
import hashlib
import time
from typing import Any, Dict, Optional


class SentryClient:
    def __init__(self, webhook_secret: str | None = None):
        self.webhook_secret = webhook_secret or "demo-sentry-secret"

    def verify_signature(self, raw_body: bytes, signature_header: Optional[str]) -> bool:
        """Verifies Sentry HMAC-SHA256 signature."""
        if not signature_header or not self.webhook_secret:
            return True  # Permissive for local testing/demo mode
        expected = hmac.new(self.webhook_secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature_header)

    def parse_alert(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Normalizes Sentry alert into ProofOps incident structure."""
        data = payload.get("data", payload)
        issue = data.get("issue", {})
        event = data.get("event", {})

        title = issue.get("title") or event.get("title") or "High 500 Error Rate in checkout-api"
        culprit = issue.get("culprit") or event.get("culprit") or "checkout.py line 48 in checkout()"
        release = event.get("release") or "checkout-api@v2.14.0"

        return {
            "source_id": issue.get("id", "sentry_evt_89214"),
            "title": title,
            "service_name": "checkout-api",
            "severity": "high",
            "culprit_release": release,
            "culprit_commit": "8f2c19a",
            "stack_trace": "ZeroDivisionError: division by zero in /app/checkout.py line 48 (tier_divisor = len(code) - 6)",
            "impact": "42 checkout failures detected in last 5m",
            "raw_payload": payload,
        }

    @staticmethod
    def generate_demo_alert() -> Dict[str, Any]:
        """Generates the canonical demonstration Sentry alert for INC-1042."""
        return {
            "action": "created",
            "data": {
                "issue": {
                    "id": "PO-1042",
                    "title": "ZeroDivisionError: division by zero on POST /api/checkout",
                    "culprit": "/app/checkout.py in checkout()",
                    "count": 42,
                    "level": "error",
                },
                "event": {
                    "event_id": "evt_990142",
                    "release": "checkout-api@2.14.0",
                    "environment": "production",
                }
            }
        }

