"""
Pydantic схемы ViCRM
"""
from schemas.participant import (
    ParticipantBase,
    ParticipantCreate,
    ParticipantUpdate,
    MembershipHistoryBase,
    MembershipHistoryCreate,
    MembershipHistoryUpdate,
    ParticipantGroupBase,
    ParticipantGroupCreate,
    ParticipantGroupUpdate,
)
from schemas.transaction import TransactionBase, TransactionCreate
from schemas.category import CategoryBase, CategoryCreate, CategoryUpdate
from schemas.tag import TagBase, TagCreate, TagUpdate
from schemas.template import (
    TransactionTemplateBase,
    TransactionTemplateCreate,
    TransactionTemplateUpdate,
)
from schemas.expense import (
    MonthlyExpenseBase,
    MonthlyExpenseCreate,
    MonthlyExpenseUpdate,
)

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
    "TransactionBase",
    "TransactionCreate",
    "CategoryBase",
    "CategoryCreate",
    "CategoryUpdate",
    "TagBase",
    "TagCreate",
    "TagUpdate",
    "TransactionTemplateBase",
    "TransactionTemplateCreate",
    "TransactionTemplateUpdate",
    "MonthlyExpenseBase",
    "MonthlyExpenseCreate",
    "MonthlyExpenseUpdate",
]
