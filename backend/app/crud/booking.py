import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate
from app.services.geo import make_point


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


def save(db: Session, booking: Booking) -> Booking:
    db.commit()
    db.refresh(booking)
    return booking
