"""
Модели транзакций ViCRM
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Income(Base):
    """Доход"""
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("income_categories.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='RUB')  # RUB, USD, EUR
    amount_base = Column(Float, nullable=True)  # Сумма в базовой валюте
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now, index=True)

    participant = relationship("Participant", back_populates="incomes")
    category = relationship("IncomeCategory", back_populates="incomes")


class Expense(Base):
    """Расход"""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='RUB')  # RUB, USD, EUR
    amount_base = Column(Float, nullable=True)  # Сумма в базовой валюте
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now, index=True)

    participant = relationship("Participant", back_populates="expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")


class Contribution(Base):
    """Взносы участников"""
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    month = Column(String(7), nullable=False, index=True)  # "2026-03"
    amount_required = Column(Float, nullable=False)  # Сколько должен
    amount_paid = Column(Float, default=0.0)  # Сколько внёс
    status = Column(String(20), default="owed")  # "paid", "partial", "owed"
    comment = Column(Text, nullable=True)
    is_advance = Column(Boolean, default=False)  # Это аванс за будущий месяц?
    paid_at = Column(DateTime, nullable=True)  # Когда именно оплатил
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    participant = relationship("Participant")


__all__ = ["Income", "Expense", "Contribution"]
