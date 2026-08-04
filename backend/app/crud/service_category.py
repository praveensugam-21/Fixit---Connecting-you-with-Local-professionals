import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.service_category import ServiceCategory


def list_all(db: Session) -> list[ServiceCategory]:
    return list(db.scalars(select(ServiceCategory).order_by(ServiceCategory.name)))


def get_by_id(db: Session, category_id: uuid.UUID) -> ServiceCategory | None:
    return db.get(ServiceCategory, category_id)
