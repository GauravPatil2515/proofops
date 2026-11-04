import os
import uuid
from fastapi import FastAPI, HTTPException
try:
    from models import CheckoutRequest, CheckoutResponse
except ImportError:
    from services.checkout_api.models import CheckoutRequest, CheckoutResponse

app = FastAPI(title="Acme Commerce Checkout Service", version="2.14.0")

# Active coupon codes
DISCOUNT_RULES = {
    "SAVE10": 0.10,
    "SAVE20": 0.20,
    "VIP50": 0.50,
}

# Incident trigger flag: simulates the faulty deploy
# Can be toggled via environment variable or in-process setter
BUG_ACTIVE = os.environ.get("PROOFOPS_BUG_ACTIVE", "false").lower() in ("true", "1")


def set_bug_active(active: bool) -> None:
    global BUG_ACTIVE
    BUG_ACTIVE = active
    os.environ["PROOFOPS_BUG_ACTIVE"] = "true" if active else "false"


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "checkout-api",
        "version": "2.14.0",
        "bug_active": BUG_ACTIVE,
    }


@app.post("/api/checkout", response_model=CheckoutResponse)
def checkout(request: CheckoutRequest):
    if not request.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Subtotal calculation
    subtotal = sum(item.unit_price_cents * item.quantity for item in request.items)

    # Discount calculation
    discount = 0
    if request.discount_code:
        code = request.discount_code.upper()
        if code not in DISCOUNT_RULES:
            raise HTTPException(status_code=400, detail=f"Invalid discount code: {code}")

        rate = DISCOUNT_RULES[code]

        if BUG_ACTIVE:
            # INCIDENT CAUSE: Unhandled type mismatch / ZeroDivision regression
            # introduced in release 2.14.0 when calculating tier multiplier
            tier_divisor = len(code) - 6  # For 'SAVE20' len is 6 -> 6-6 = 0 -> ZeroDivisionError!
            discount = int(subtotal * (rate / tier_divisor))
        else:
            # CORRECT LOGIC:
            discount = int(subtotal * rate)

    discounted_subtotal = max(0, subtotal - discount)
    tax = int(round(discounted_subtotal * (request.tax_rate_percent / 100.0)))
    total = discounted_subtotal + tax

    order_id = f"ord_{uuid.uuid4().hex[:12]}"

    return CheckoutResponse(
        order_id=order_id,
        status="confirmed",
        subtotal_cents=subtotal,
        discount_cents=discount,
        tax_cents=tax,
        total_cents=total,
        currency=request.currency,
    )
