#!/usr/bin/env python3
"""ProofOps Incident Reproduction Script.

Run this script to reproduce the 500 ZeroDivisionError on /api/checkout.
Returns exit code 1 if the bug reproduces (500 error), exit code 0 if fixed (200 OK).
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app import app

client = TestClient(app, raise_server_exceptions=False)


def run_repro():
    payload = {
        "cart_id": "cart_repro_500",
        "items": [
            {"item_id": "sku_99", "name": "Cloud Key", "unit_price_cents": 10000, "quantity": 1}
        ],
        "currency": "USD",
        "discount_code": "SAVE20",
    }
    print("[REPRO-LAB] Sending POST /api/checkout with discount_code='SAVE20'...")
    response = client.post("/api/checkout", json=payload)
    print(f"[REPRO-LAB] Response Status: {response.status_code}")
    print(f"[REPRO-LAB] Response Body: {response.text}")

    if response.status_code == 500:
        print("[REPRO-LAB] BUG CONFIRMED: 500 Internal Server Error reproduced successfully.")
        return 1
    elif response.status_code == 200:
        print("[REPRO-LAB] BUG RESOLVED: 200 OK received.")
        return 0
    else:
        print(f"[REPRO-LAB] UNEXPECTED STATUS: {response.status_code}")
        return 2


if __name__ == "__main__":
    sys.exit(run_repro())

