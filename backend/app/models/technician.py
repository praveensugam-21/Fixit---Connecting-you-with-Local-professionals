import uuid
from enum import StrEnum

from geoalchemy2 import Geography
from sqlalchemy import Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class VerificationStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class TechnicianProfile(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "technician_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    years_experience: Mapped[int | None] = mapped_column(Integer, nullable=True)

    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status", native_enum=False),
        nullable=False,
        default=VerificationStatus.PENDING,
    )
    id_document_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    service_radius_km: Mapped[float] = mapped_column(Float, nullable=False, default=10.0)

    # Geospatial point (lng, lat) — SRID 4326 (WGS84), used for ST_DWithin nearby search.
    location: Mapped[str | None] = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=True
    )
    address_label: Mapped[str | None] = mapped_column(String(500), nullable=True)

    avg_rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    user: Mapped["User"] = relationship(back_populates="technician_profile")
    rate_cards: Mapped[list["RateCard"]] = relationship(
        back_populates="technician", cascade="all, delete-orphan"
    )
