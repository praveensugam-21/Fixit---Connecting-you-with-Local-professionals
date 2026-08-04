import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDPKMixin


class ServiceCategory(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "service_categories"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)

    rate_cards: Mapped[list["RateCard"]] = relationship(back_populates="category")


class RateCard(UUIDPKMixin, TimestampMixin, Base):
    """A technician's published pricing for one service category."""

    __tablename__ = "rate_cards"

    technician_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("technician_profiles.id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("service_categories.id", ondelete="CASCADE"), nullable=False
    )

    call_out_fee: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    hourly_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")

    technician: Mapped["TechnicianProfile"] = relationship(back_populates="rate_cards")
    category: Mapped["ServiceCategory"] = relationship(back_populates="rate_cards")
