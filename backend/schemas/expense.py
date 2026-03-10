"""
Pydantic схемы для расходов ViCRM
"""
from typing import Optional
from pydantic import BaseModel


class MonthlyExpenseBase(BaseModel):
    name: str
    participant_id: Optional[int] = None
    category_id: Optional[int] = None
    amount: float
    day_of_month: int = 1
    description: Optional[str] = None
    is_active: bool = True


class MonthlyExpenseCreate(MonthlyExpenseBase):
    pass


class MonthlyExpenseUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    day_of_month: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    last_paid_month: Optional[str] = None


__all__ = ["MonthlyExpenseBase", "MonthlyExpenseCreate", "MonthlyExpenseUpdate"]
