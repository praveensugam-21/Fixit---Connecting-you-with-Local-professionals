"""Booking state machine.

Keeping transition rules centralized (rather than letting routes set
`booking.status` directly) is what makes "transparent pricing" and
cancellation policy actually enforceable instead of just documented.
"""

from app.models.booking import BookingStatus
from app.models.user import UserRole

CUSTOMER = UserRole.CUSTOMER
TECHNICIAN = UserRole.TECHNICIAN

# current_status -> { next_status: (roles allowed to perform it) }
TRANSITIONS: dict[BookingStatus, dict[BookingStatus, tuple[UserRole, ...]]] = {
    BookingStatus.REQUESTED: {
        BookingStatus.ACCEPTED: (TECHNICIAN,),
        BookingStatus.CANCELLED: (CUSTOMER, TECHNICIAN),
    },
    BookingStatus.ACCEPTED: {
        BookingStatus.QUOTED: (TECHNICIAN,),
        BookingStatus.CANCELLED: (CUSTOMER, TECHNICIAN),
    },
    BookingStatus.QUOTED: {
        BookingStatus.QUOTE_APPROVED: (CUSTOMER,),
        BookingStatus.CANCELLED: (CUSTOMER, TECHNICIAN),
    },
    BookingStatus.QUOTE_APPROVED: {
        BookingStatus.IN_PROGRESS: (TECHNICIAN,),
        BookingStatus.CANCELLED: (CUSTOMER, TECHNICIAN),
    },
    BookingStatus.IN_PROGRESS: {
        BookingStatus.COMPLETED: (TECHNICIAN,),
        BookingStatus.DISPUTED: (CUSTOMER, TECHNICIAN),
    },
    BookingStatus.COMPLETED: {
        BookingStatus.DISPUTED: (CUSTOMER,),
    },
    BookingStatus.CANCELLED: {},
    BookingStatus.DISPUTED: {},
}


class InvalidTransition(Exception):
    pass


class TransitionNotAllowedForRole(Exception):
    pass


def assert_valid_transition(current: BookingStatus, new: BookingStatus, role: UserRole) -> None:
    allowed_next = TRANSITIONS.get(current, {})
    if new not in allowed_next:
        raise InvalidTransition(f"Cannot move booking from '{current.value}' to '{new.value}'")
    if role != UserRole.ADMIN and role not in allowed_next[new]:
        raise TransitionNotAllowedForRole(f"Role '{role.value}' cannot move booking to '{new.value}'")
