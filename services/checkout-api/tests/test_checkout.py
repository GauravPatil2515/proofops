import pytest
from fastapi.testclient import TestClient
try:
    from app import app, set_bug_active
except ImportError:
    from services.checkout_api.app import app, set_bug_active


# Client initialization
client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_standard_checkout_without_discount():
    payload = {
        "cart_id": "cart_101",
        "items": [
            {"item_id": "item_a", "name": "Mechanical Keyboard", "unit_price_cents": 12000, "quantity": 1},
            {"item_id": "item_b", "name": "USB-C Cable", "unit_price_cents": 1500, "quantity": 2},
        ],
        "currency": "USD",
        "tax_rate_percent": 10.0,
    }
    response = client.post("/api/checkout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["subtotal_cents"] == 15000
    assert data["discount_cents"] == 0
    assert data["tax_cents"] == 1500
    assert data["total_cents"] == 16500


def test_checkout_with_save20_discount():
    payload = {
        "cart_id": "cart_102",
        "items": [
            {"item_id": "item_a", "name": "Developer Monitor", "unit_price_cents": 50000, "quantity": 1}
        ],
        "currency": "USD",
        "discount_code": "SAVE20",
        "tax_rate_percent": 10.0,
    }
    response = client.post("/api/checkout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["subtotal_cents"] == 50000
    assert data["discount_cents"] == 10000  # 20% of 50000
    assert data["tax_cents"] == 4000        # 10% of 40000
    assert data["total_cents"] == 44000
