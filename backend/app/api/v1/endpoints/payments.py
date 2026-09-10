import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.crud import booking as booking_crud
from app.crud import payment as payment_crud
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from app.schemas.payment import PaymentOrderResponse, PaymentRead, PaymentVerifyRequest
from app.services.payment_service import (
    PaymentNotConfigured,
    create_order,
    verify_payment_signature,
)

router = APIRouter(prefix="/payments", tags=["payments"])

# Payment is allowed once the customer has approved the quote.
PAYABLE_STATUSES = {
    BookingStatus.QUOTE_APPROVED,
    BookingStatus.IN_PROGRESS,
    BookingStatus.COMPLETED,
}


def _get_customer_booking(db: Session, booking_id: uuid.UUID, user: User) -> Booking:
    booking = booking_crud.get(db, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if user.role != UserRole.ADMIN and booking.customer_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    return booking


@router.post("/{booking_id}/order", response_model=PaymentOrderResponse)
def create_payment_order(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentOrderResponse:
    booking = _get_customer_booking(db, booking_id, current_user)

    if booking.status not in PAYABLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment is available only after the quote is approved",
        )

    amount = booking.final_price or booking.quoted_price
    if not amount or amount <= 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No amount to charge yet")

    existing = payment_crud.get_by_booking(db, booking_id)
    if existing and existing.status.value == "captured":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking is already paid")

    try:
        order = create_order(amount, receipt=f"booking_{booking_id}")
    except PaymentNotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    payment_crud.create_or_update_order(
        db, booking_id=booking_id, amount=amount, currency="INR", order_ref=order["id"]
    )

    return PaymentOrderResponse(
        order_id=order["id"],
        amount=amount,
        currency="INR",
        key_id=settings.razorpay_key_id or "",
        booking_id=booking_id,
    )


@router.post("/{booking_id}/verify", response_model=PaymentRead)
def verify_payment(
    booking_id: uuid.UUID,
    data: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentRead:
    _get_customer_booking(db, booking_id, current_user)

    payment = payment_crud.get_by_booking(db, booking_id)
    if payment is None or payment.provider_ref != data.razorpay_order_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching order")

    if not verify_payment_signature(
        data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payment signature")

    return payment_crud.mark_captured(db, payment, payment_ref=data.razorpay_payment_id)


@router.get("/{booking_id}", response_model=PaymentRead | None)
def get_payment(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaymentRead | None:
    _get_customer_booking(db, booking_id, current_user)
    return payment_crud.get_by_booking(db, booking_id)
