"""
Модель шаблона транзакции ViCRM
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class TransactionTemplate(Base):
    """Шаблон для регулярных транзакций"""
    __tablename__ = "transaction_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    template_type = Column(String(10), nullable=False)  # 'income' или 'expense'
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    category_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='RUB')
    description = Column(Text, nullable=True)
    interval_days = Column(Integer, default=30)  # Интервал в днях
    is_active = Column(Boolean, default=True)
    last_created = Column(DateTime, nullable=True)
    next_due = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    participant = relationship("Participant")


__all__ = ["TransactionTemplate"]
