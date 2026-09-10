import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.payment import Payment, PaymentStatus


def get_by_booking(db: Session, booking_id: uuid.UUID) -> Payment | None:
    return db.scalar(select(Payment).where(Payment.booking_id == booking_id))


def create_or_update_order(
    db: Session, *, booking_id: uuid.UUID, amount: float, currency: str, order_ref: str
) -> Payment:
    payment = get_by_booking(db, booking_id)
    if payment is None:
        payment = Payment(
            booking_id=booking_id,
            provider="razorpay",
            provider_ref=order_ref,
            amount=amount,
            currency=currency,
            status=PaymentStatus.PENDING,
        )
        db.add(payment)
    else:
        payment.provider = "razorpay"
        payment.provider_ref = order_ref
        payment.amount = amount
        payment.currency = currency
        payment.status = PaymentStatus.PENDING
    db.commit()
    db.refresh(payment)
    return payment


def mark_captured(db: Session, payment: Payment, *, payment_ref: str) -> Payment:
    payment.status = PaymentStatus.CAPTURED
    payment.provider_ref = payment_ref
    payment.captured_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(payment)
    return payment
