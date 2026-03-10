"""
Pydantic схемы для шаблонов ViCRM
"""
from typing import Optional
from pydantic import BaseModel


class TransactionTemplateBase(BaseModel):
    name: str
    template_type: str
    participant_id: int
    category_id: int
    amount: float
    currency: str = 'RUB'
    description: Optional[str] = None
    interval_days: int = 30


class TransactionTemplateCreate(TransactionTemplateBase):
    pass


class TransactionTemplateUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    interval_days: Optional[int] = None


__all__ = [
    "TransactionTemplateBase",
    "TransactionTemplateCreate",
    "TransactionTemplateUpdate",
]
