import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate
from app.services.geo import make_point

ACTIVE_STATUSES = (
    BookingStatus.REQUESTED,
    BookingStatus.ACCEPTED,
    BookingStatus.QUOTED,
    BookingStatus.QUOTE_APPROVED,
    BookingStatus.IN_PROGRESS,
)


def get(db: Session, booking_id: uuid.UUID) -> Booking | None:
    return db.get(Booking, booking_id)


def create(db: Session, *, customer_id: uuid.UUID, data: BookingCreate) -> Booking:
    booking = Booking(
        customer_id=customer_id,
        technician_id=data.technician_id,
        category_id=data.category_id,
        description=data.description,
        photo_urls=data.photo_urls,
        address_label=data.address_label,
        location=make_point(data.location.lat, data.location.lng),
        scheduled_at=data.scheduled_at,
        status=BookingStatus.REQUESTED,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def list_for_customer(db: Session, customer_id: uuid.UUID) -> list[Booking]:
    return list(
        db.scalars(select(Booking).where(Booking.customer_id == customer_id).order_by(Booking.created_at.desc()))
    )


def list_for_technician(db: Session, technician_id: uuid.UUID) -> list[Booking]:
    return list(
        db.scalars(
            select(Booking).where(Booking.technician_id == technician_id).order_by(Booking.created_at.desc())
        )
    )


def earnings_summary(db: Session, technician_id: uuid.UUID) -> tuple[float, int, int]:
    """Returns (total_earned, completed_jobs, active_jobs) for a technician.

    Earnings are the sum of final price across completed bookings.
    """
    total, completed = db.execute(
        select(func.coalesce(func.sum(Booking.final_price), 0.0), func.count(Booking.id)).where(
            Booking.technician_id == technician_id,
            Booking.status == BookingStatus.COMPLETED,
        )
    ).one()
    active = db.scalar(
        select(func.count(Booking.id)).where(
            Booking.technician_id == technician_id,
            Booking.status.in_(ACTIVE_STATUSES),
        )
    )
    return float(total or 0.0), int(completed or 0), int(active or 0)


def save(db: Session, booking: Booking) -> Booking:
    db.commit()
    db.refresh(booking)
    return booking
