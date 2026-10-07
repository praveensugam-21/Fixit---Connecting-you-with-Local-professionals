import uuid

from pydantic import BaseModel, ConfigDict, Field


class ServiceCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    icon: str | None = None


class RateCardBase(BaseModel):
    category_id: uuid.UUID
    call_out_fee: float = Field(ge=0)
    hourly_rate: float = Field(ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)


class RateCardCreate(RateCardBase):
    pass


class RateCardUpdate(BaseModel):
    call_out_fee: float | None = Field(default=None, ge=0)
    hourly_rate: float | None = Field(default=None, ge=0)


class RateCardRead(RateCardBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category: ServiceCategoryRead
