"""
Модель ежемесячного расхода ViCRM
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class MonthlyExpense(Base):
    """Ежемесячный расход"""
    __tablename__ = "monthly_expenses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # "Хостинг Selectel"
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=True)  # Привязка к контрагенту (хосту)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=True)
    amount = Column(Float, nullable=False)  # Сумма в месяц
    day_of_month = Column(Integer, default=1)  # Когда платить (1-31)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    last_paid_month = Column(String(7), nullable=True)  # "2026-03" - последний оплаченный месяц
    next_due_date = Column(DateTime, nullable=True)  # Когда следующий платёж
    created_at = Column(DateTime, default=datetime.now)

    participant = relationship("Participant")
    category = relationship("ExpenseCategory")


__all__ = ["MonthlyExpense"]
