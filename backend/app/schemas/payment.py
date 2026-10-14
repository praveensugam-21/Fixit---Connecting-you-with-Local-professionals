import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.payment import PaymentStatus


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    booking_id: uuid.UUID
    provider: str
    provider_ref: str | None
    amount: float
    currency: str
    status: PaymentStatus
    captured_at: datetime | None
    created_at: datetime


class PaymentOrderResponse(BaseModel):
    """Everything the frontend Razorpay checkout needs to open the modal."""

    order_id: str
    amount: float
    currency: str
    key_id: str
    booking_id: uuid.UUID


class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
