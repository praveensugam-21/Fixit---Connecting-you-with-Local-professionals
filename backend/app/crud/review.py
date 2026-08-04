import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.review import Review
from app.schemas.review import ReviewCreate


def get_by_booking(db: Session, booking_id: uuid.UUID) -> Review | None:
    return db.scalar(select(Review).where(Review.booking_id == booking_id))


def list_for_technician(db: Session, technician_id: uuid.UUID) -> list[Review]:
    return list(
        db.scalars(
            select(Review).where(Review.technician_id == technician_id).order_by(Review.created_at.desc())
        )
    )


def create(db: Session, *, booking: Booking, customer_id: uuid.UUID, data: ReviewCreate) -> Review:
    review = Review(
        booking_id=booking.id,
        customer_id=customer_id,
        technician_id=booking.technician_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review
