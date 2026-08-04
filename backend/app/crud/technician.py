import uuid

from geoalchemy2.functions import ST_DWithin, ST_Distance
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.review import Review
from app.models.service_category import RateCard
from app.models.technician import TechnicianProfile, VerificationStatus
from app.models.user import User
from app.schemas.technician import TechnicianProfileCreate, TechnicianProfileUpdate
from app.services.geo import make_point


def get_by_id(db: Session, technician_id: uuid.UUID) -> TechnicianProfile | None:
    return db.scalar(
        select(TechnicianProfile)
        .options(joinedload(TechnicianProfile.user), joinedload(TechnicianProfile.rate_cards))
        .where(TechnicianProfile.id == technician_id)
    )


def get_by_user_id(db: Session, user_id: uuid.UUID) -> TechnicianProfile | None:
    return db.scalar(select(TechnicianProfile).where(TechnicianProfile.user_id == user_id))


def create_profile(db: Session, *, user_id: uuid.UUID, data: TechnicianProfileCreate) -> TechnicianProfile:
    profile = TechnicianProfile(
        user_id=user_id,
        bio=data.bio,
        years_experience=data.years_experience,
        service_radius_km=data.service_radius_km,
        address_label=data.address_label,
        location=make_point(data.location.lat, data.location.lng),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_profile(db: Session, profile: TechnicianProfile, data: TechnicianProfileUpdate) -> TechnicianProfile:
    updates = data.model_dump(exclude_unset=True, exclude={"location"})
    for field, value in updates.items():
        setattr(profile, field, value)
    if data.location is not None:
        profile.location = make_point(data.location.lat, data.location.lng)
    db.commit()
    db.refresh(profile)
    return profile


def add_rate_card(db: Session, *, technician_id: uuid.UUID, category_id: uuid.UUID, call_out_fee: float, hourly_rate: float, currency: str) -> RateCard:
    rate_card = RateCard(
        technician_id=technician_id,
        category_id=category_id,
        call_out_fee=call_out_fee,
        hourly_rate=hourly_rate,
        currency=currency,
    )
    db.add(rate_card)
    db.commit()
    db.refresh(rate_card)
    return rate_card


def find_nearby(
    db: Session,
    *,
    lat: float,
    lng: float,
    radius_km: float = 10.0,
    category_id: uuid.UUID | None = None,
    limit: int = 50,
) -> list[tuple[TechnicianProfile, float]]:
    """Returns (profile, distance_km) tuples ordered by distance, nearest first."""
    point = make_point(lat, lng)
    distance_m = ST_Distance(TechnicianProfile.location, point)

    query = (
        select(TechnicianProfile, distance_m.label("distance_m"))
        .options(joinedload(TechnicianProfile.user))
        .join(User, TechnicianProfile.user_id == User.id)
        .where(TechnicianProfile.verification_status == VerificationStatus.APPROVED)
        .where(TechnicianProfile.location.isnot(None))
        .where(ST_DWithin(TechnicianProfile.location, point, radius_km * 1000))
    )
    if category_id is not None:
        query = query.join(RateCard, RateCard.technician_id == TechnicianProfile.id).where(
            RateCard.category_id == category_id
        )

    query = query.order_by(distance_m).limit(limit)
    rows = db.execute(query).unique().all()
    return [(profile, distance / 1000.0) for profile, distance in rows]


def recompute_rating(db: Session, technician_id: uuid.UUID) -> None:
    from sqlalchemy import func

    avg_rating, rating_count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.technician_id == technician_id)
    ).one()

    profile = db.get(TechnicianProfile, technician_id)
    if profile is None:
        return
    profile.avg_rating = float(avg_rating or 0.0)
    profile.rating_count = int(rating_count or 0)
    db.commit()
