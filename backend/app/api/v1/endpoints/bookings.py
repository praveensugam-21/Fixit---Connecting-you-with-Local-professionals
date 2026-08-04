import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.crud import booking as booking_crud
from app.crud import message as message_crud
from app.crud import review as review_crud
from app.crud import service_category as category_crud
from app.crud import technician as technician_crud
from app.models.booking import Booking, BookingStatus
from app.models.user import User, UserRole
from app.schemas.booking import BookingCreate, BookingQuote, BookingRead, BookingStatusUpdate
from app.schemas.message import MessageCreate, MessageRead
from app.schemas.review import ReviewCreate, ReviewRead
from app.services.booking_service import InvalidTransition, TransitionNotAllowedForRole, assert_valid_transition
from app.services.geo import point_to_latlng
from app.schemas.technician import Location

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _to_read(booking: Booking) -> BookingRead:
    latlng = point_to_latlng(booking.location)
    return BookingRead(
        id=booking.id,
        customer_id=booking.customer_id,
        technician_id=booking.technician_id,
        category_id=booking.category_id,
        status=booking.status,
        description=booking.description,
        photo_urls=booking.photo_urls,
        address_label=booking.address_label,
        location=Location(lat=latlng[0], lng=latlng[1]) if latlng else Location(lat=0, lng=0),
        scheduled_at=booking.scheduled_at,
        quoted_price=booking.quoted_price,
        final_price=booking.final_price,
        cancellation_reason=booking.cancellation_reason,
        created_at=booking.created_at,
        updated_at=booking.updated_at,
    )


def _get_owned_booking(db: Session, booking_id: uuid.UUID, current_user: User) -> Booking:
    booking = booking_crud.get(db, booking_id)
    if booking is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == UserRole.ADMIN:
        return booking
    if current_user.role == UserRole.CUSTOMER and booking.customer_id == current_user.id:
        return booking
    if current_user.role == UserRole.TECHNICIAN:
        profile = technician_crud.get_by_user_id(db, current_user.id)
        if profile is not None and profile.id == booking.technician_id:
            return booking

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")


@router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingRead:
    if current_user.role not in (UserRole.CUSTOMER, UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customers can create bookings")

    technician = technician_crud.get_by_id(db, data.technician_id)
    if technician is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")
    if category_crud.get_by_id(db, data.category_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service category not found")

    booking = booking_crud.create(db, customer_id=current_user.id, data=data)
    return _to_read(booking)


@router.get("", response_model=list[BookingRead])
def list_my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BookingRead]:
    if current_user.role == UserRole.TECHNICIAN:
        profile = technician_crud.get_by_user_id(db, current_user.id)
        bookings = booking_crud.list_for_technician(db, profile.id) if profile else []
    else:
        bookings = booking_crud.list_for_customer(db, current_user.id)
    return [_to_read(b) for b in bookings]


@router.get("/{booking_id}", response_model=BookingRead)
def read_booking(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingRead:
    booking = _get_owned_booking(db, booking_id, current_user)
    return _to_read(booking)


@router.post("/{booking_id}/quote", response_model=BookingRead)
def submit_quote(
    booking_id: uuid.UUID,
    data: BookingQuote,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingRead:
    booking = _get_owned_booking(db, booking_id, current_user)
    if current_user.role not in (UserRole.TECHNICIAN, UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the technician can submit a quote")

    try:
        assert_valid_transition(booking.status, BookingStatus.QUOTED, current_user.role)
    except InvalidTransition as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except TransitionNotAllowedForRole as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    booking.quoted_price = data.quoted_price
    booking.status = BookingStatus.QUOTED
    booking_crud.save(db, booking)
    return _to_read(booking)


@router.patch("/{booking_id}/status", response_model=BookingRead)
def update_status(
    booking_id: uuid.UUID,
    data: BookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingRead:
    booking = _get_owned_booking(db, booking_id, current_user)

    try:
        assert_valid_transition(booking.status, data.status, current_user.role)
    except InvalidTransition as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except TransitionNotAllowedForRole as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc

    booking.status = data.status
    if data.status == BookingStatus.CANCELLED:
        booking.cancellation_reason = data.cancellation_reason
    if data.status == BookingStatus.COMPLETED:
        booking.final_price = booking.quoted_price

    booking_crud.save(db, booking)
    return _to_read(booking)


@router.get("/{booking_id}/messages", response_model=list[MessageRead])
def list_messages(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MessageRead]:
    _get_owned_booking(db, booking_id, current_user)
    return message_crud.list_for_booking(db, booking_id)


@router.post("/{booking_id}/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def post_message(
    booking_id: uuid.UUID,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageRead:
    booking = _get_owned_booking(db, booking_id, current_user)
    if booking.status in (BookingStatus.CANCELLED, BookingStatus.COMPLETED, BookingStatus.DISPUTED):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking thread is closed")
    return message_crud.create(db, booking_id=booking_id, sender_id=current_user.id, data=data)


@router.post("/{booking_id}/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def leave_review(
    booking_id: uuid.UUID,
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewRead:
    booking = _get_owned_booking(db, booking_id, current_user)
    if current_user.role != UserRole.CUSTOMER or booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the customer can review this booking")
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking must be completed before review")
    if review_crud.get_by_booking(db, booking_id) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Booking already reviewed")

    review = review_crud.create(db, booking=booking, customer_id=current_user.id, data=data)
    technician_crud.recompute_rating(db, booking.technician_id)
    return review
