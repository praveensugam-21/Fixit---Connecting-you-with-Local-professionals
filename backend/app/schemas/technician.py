import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.technician import VerificationStatus
from app.schemas.service_category import RateCardRead


class Location(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class TechnicianProfileBase(BaseModel):
    bio: str | None = Field(default=None, max_length=2000)
    years_experience: int | None = Field(default=None, ge=0, le=80)
    service_radius_km: float = Field(default=10.0, gt=0, le=200)
    address_label: str | None = Field(default=None, max_length=500)


class TechnicianProfileCreate(TechnicianProfileBase):
    location: Location


class TechnicianProfileUpdate(BaseModel):
    bio: str | None = None
    years_experience: int | None = None
    service_radius_km: float | None = Field(default=None, gt=0, le=200)
    address_label: str | None = None
    location: Location | None = None


class TechnicianProfileRead(TechnicianProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    verification_status: VerificationStatus
    avg_rating: float
    rating_count: int
    location: Location | None = None
    rate_cards: list[RateCardRead] = []


class TechnicianNearby(BaseModel):
    id: uuid.UUID
    full_name: str
    avg_rating: float
    rating_count: int
    verification_status: VerificationStatus
    service_radius_km: float
    distance_km: float
    location: Location
