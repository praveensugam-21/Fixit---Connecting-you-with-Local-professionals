import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.message import Message
from app.schemas.message import MessageCreate


def list_for_booking(db: Session, booking_id: uuid.UUID) -> list[Message]:
    return list(
        db.scalars(select(Message).where(Message.booking_id == booking_id).order_by(Message.created_at.asc()))
    )


def create(db: Session, *, booking_id: uuid.UUID, sender_id: uuid.UUID, data: MessageCreate) -> Message:
    message = Message(booking_id=booking_id, sender_id=sender_id, body=data.body)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
