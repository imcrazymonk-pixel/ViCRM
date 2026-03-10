"""
Pydantic схемы для участников ViCRM
"""
from typing import Optional
from pydantic import BaseModel


class ParticipantBase(BaseModel):
    name: str


class ParticipantCreate(ParticipantBase):
    group_id: Optional[int] = None
    start_date: Optional[str] = None  # "2026-07"
    is_active: Optional[bool] = True


class ParticipantUpdate(ParticipantBase):
    group_id: Optional[int] = None
    start_date: Optional[str] = None
    is_active: Optional[bool] = None
    balance: Optional[float] = None


class MembershipHistoryBase(BaseModel):
    participant_id: int
    group_id: int
    joined_at: str  # "2026-03"
    left_at: Optional[str] = None  # "2026-06" или None
    reason: Optional[str] = None


class MembershipHistoryCreate(MembershipHistoryBase):
    pass


class MembershipHistoryUpdate(BaseModel):
    left_at: Optional[str] = None
    reason: Optional[str] = None


class ParticipantGroupBase(BaseModel):
    name: str
    group_type: str = "contribution"  # "contribution" или "expense"
    monthly_fee: float = 0.0
    description: Optional[str] = None
    is_active: bool = True
    auto_create_contributions: bool = True


class ParticipantGroupCreate(ParticipantGroupBase):
    pass


class ParticipantGroupUpdate(BaseModel):
    name: Optional[str] = None
    group_type: Optional[str] = None
    monthly_fee: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    auto_create_contributions: Optional[bool] = None


__all__ = [
    "ParticipantBase",
    "ParticipantCreate",
    "ParticipantUpdate",
    "MembershipHistoryBase",
    "MembershipHistoryCreate",
    "MembershipHistoryUpdate",
    "ParticipantGroupBase",
    "ParticipantGroupCreate",
    "ParticipantGroupUpdate",
]
