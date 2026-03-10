"""
Модели тегов ViCRM
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Tag(Base):
    """Тег для транзакций"""
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    color = Column(String(7), default='#8b5cf6')  # HEX цвет
    created_at = Column(DateTime, default=datetime.now)


class TransactionTag(Base):
    """Привязка тегов к транзакциям"""
    __tablename__ = "transaction_tags"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, nullable=False)
    transaction_type = Column(String(10), nullable=False)  # 'income' или 'expense'
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    tag = relationship("Tag")


__all__ = ["Tag", "TransactionTag"]
