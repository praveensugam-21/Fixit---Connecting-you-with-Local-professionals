from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    bookings,
    payments,
    service_categories,
    technicians,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(technicians.router)
api_router.include_router(bookings.router)
api_router.include_router(service_categories.router)
api_router.include_router(payments.router)
