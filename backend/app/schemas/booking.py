import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.booking import BookingStatus
from app.schemas.technician import Location


class BookingCreate(BaseModel):
    technician_id: uuid.UUID
    category_id: uuid.UUID
    description: str = Field(min_length=1, max_length=3000)
    photo_urls: list[str] = Field(default_factory=list, max_length=10)
    address_label: str = Field(min_length=1, max_length=500)
    location: Location
    scheduled_at: datetime | None = None


class BookingQuote(BaseModel):
    quoted_price: float = Field(gt=0)


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    cancellation_reason: str | None = Field(default=None, max_length=1000)


class BookingRead(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    technician_id: uuid.UUID
    category_id: uuid.UUID
    status: BookingStatus
    description: str
    photo_urls: list[str]
    address_label: str
    location: Location
    scheduled_at: datetime | None
    quoted_price: float | None
    final_price: float | None
    cancellation_reason: str | None
    created_at: datetime
    updated_at: datetime
