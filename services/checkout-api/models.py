from typing import List, Optional
from pydantic import BaseModel, Field


class CartItem(BaseModel):
    item_id: str
    name: str
    unit_price_cents: int = Field(gt=0)
    quantity: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    cart_id: str
    items: List[CartItem]
    currency: str = "USD"
    discount_code: Optional[str] = None
    tax_rate_percent: float = Field(ge=0.0, le=100.0, default=8.5)


class CheckoutResponse(BaseModel):
    order_id: str
    status: str
    subtotal_cents: int
    discount_cents: int
    tax_cents: int
    total_cents: int
    currency: str

