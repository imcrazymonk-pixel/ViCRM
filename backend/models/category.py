"""
Модели категорий ViCRM
"""
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class IncomeCategory(Base):
    """Категория доходов"""
    __tablename__ = "income_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    incomes = relationship("Income", back_populates="category")


class ExpenseCategory(Base):
    """Категория расходов"""
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    expenses = relationship("Expense", back_populates="category")


__all__ = ["IncomeCategory", "ExpenseCategory"]
