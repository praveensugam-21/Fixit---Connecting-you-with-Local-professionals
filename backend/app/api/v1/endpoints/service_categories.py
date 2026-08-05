from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import service_category as category_crud
from app.schemas.service_category import ServiceCategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[ServiceCategoryRead])
def list_categories(db: Session = Depends(get_db)) -> list:
    return category_crud.list_all(db)
