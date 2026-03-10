"""
Pydantic схемы для транзакций ViCRM
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class TransactionBase(BaseModel):
    participant_id: int
    category_id: int
    amount: float
    currency: str = 'RUB'
    description: Optional[str] = None
    created_at: Optional[datetime] = None


class TransactionCreate(TransactionBase):
    pass


__all__ = ["TransactionBase", "TransactionCreate"]
