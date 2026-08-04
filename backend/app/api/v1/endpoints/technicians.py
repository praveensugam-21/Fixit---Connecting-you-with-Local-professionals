import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.database import get_db
from app.crud import review as review_crud
from app.crud import service_category as category_crud
from app.crud import technician as technician_crud
from app.models.technician import TechnicianProfile, VerificationStatus
from app.models.user import User, UserRole
from app.schemas.review import ReviewRead
from app.schemas.service_category import RateCardCreate, RateCardRead
from app.schemas.technician import (
    Location,
    TechnicianNearby,
    TechnicianProfileCreate,
    TechnicianProfileRead,
    TechnicianProfileUpdate,
)
from app.services.geo import point_to_latlng

router = APIRouter(prefix="/technicians", tags=["technicians"])


def _to_read(profile: TechnicianProfile) -> TechnicianProfileRead:
    latlng = point_to_latlng(profile.location)
    return TechnicianProfileRead(
        id=profile.id,
        user_id=profile.user_id,
        full_name=profile.user.full_name,
        bio=profile.bio,
        years_experience=profile.years_experience,
        service_radius_km=profile.service_radius_km,
        address_label=profile.address_label,
        verification_status=profile.verification_status,
        avg_rating=profile.avg_rating,
        rating_count=profile.rating_count,
        location=Location(lat=latlng[0], lng=latlng[1]) if latlng else None,
        rate_cards=[RateCardRead.model_validate(rc) for rc in profile.rate_cards],
    )


@router.post("/me", response_model=TechnicianProfileRead, status_code=status.HTTP_201_CREATED)
def create_my_profile(
    data: TechnicianProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TECHNICIAN)),
) -> TechnicianProfileRead:
    if technician_crud.get_by_user_id(db, current_user.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Technician profile already exists")
    profile = technician_crud.create_profile(db, user_id=current_user.id, data=data)
    return _to_read(profile)


@router.get("/me", response_model=TechnicianProfileRead)
def read_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TECHNICIAN)),
) -> TechnicianProfileRead:
    profile = technician_crud.get_by_user_id(db, current_user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician profile not found")
    return _to_read(technician_crud.get_by_id(db, profile.id))


@router.patch("/me", response_model=TechnicianProfileRead)
def update_my_profile(
    data: TechnicianProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TECHNICIAN)),
) -> TechnicianProfileRead:
    profile = technician_crud.get_by_user_id(db, current_user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician profile not found")
    updated = technician_crud.update_profile(db, profile, data)
    return _to_read(technician_crud.get_by_id(db, updated.id))


@router.post("/me/rate-cards", response_model=RateCardRead, status_code=status.HTTP_201_CREATED)
def add_rate_card(
    data: RateCardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TECHNICIAN)),
) -> RateCardRead:
    profile = technician_crud.get_by_user_id(db, current_user.id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician profile not found")
    if category_crud.get_by_id(db, data.category_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service category not found")

    rate_card = technician_crud.add_rate_card(
        db,
        technician_id=profile.id,
        category_id=data.category_id,
        call_out_fee=data.call_out_fee,
        hourly_rate=data.hourly_rate,
        currency=data.currency,
    )
    return RateCardRead.model_validate(rate_card)


@router.get("/nearby", response_model=list[TechnicianNearby])
def nearby(
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    radius_km: float = Query(default=10.0, gt=0, le=100),
    category_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[TechnicianNearby]:
    results = technician_crud.find_nearby(
        db, lat=lat, lng=lng, radius_km=radius_km, category_id=category_id, limit=limit
    )
    nearby_list = []
    for profile, distance_km in results:
        latlng = point_to_latlng(profile.location)
        if latlng is None:
            continue
        nearby_list.append(
            TechnicianNearby(
                id=profile.id,
                full_name=profile.user.full_name,
                avg_rating=profile.avg_rating,
                rating_count=profile.rating_count,
                verification_status=profile.verification_status,
                service_radius_km=profile.service_radius_km,
                distance_km=round(distance_km, 2),
                location=Location(lat=latlng[0], lng=latlng[1]),
            )
        )
    return nearby_list


@router.get("/{technician_id}", response_model=TechnicianProfileRead)
def read_technician(technician_id: uuid.UUID, db: Session = Depends(get_db)) -> TechnicianProfileRead:
    profile = technician_crud.get_by_id(db, technician_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")
    return _to_read(profile)


@router.get("/{technician_id}/reviews", response_model=list[ReviewRead])
def list_technician_reviews(technician_id: uuid.UUID, db: Session = Depends(get_db)) -> list[ReviewRead]:
    if technician_crud.get_by_id(db, technician_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")
    return review_crud.list_for_technician(db, technician_id)


@router.patch("/{technician_id}/verification", response_model=TechnicianProfileRead)
def set_verification_status(
    technician_id: uuid.UUID,
    verification_status: VerificationStatus,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.ADMIN)),
) -> TechnicianProfileRead:
    profile = technician_crud.get_by_id(db, technician_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")
    profile.verification_status = verification_status
    db.commit()
    db.refresh(profile)
    return _to_read(technician_crud.get_by_id(db, profile.id))
