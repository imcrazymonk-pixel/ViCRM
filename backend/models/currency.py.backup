"""
Модель курса валют ViCRM
"""
from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from database import Base


class CurrencyRate(Base):
    """Курс валюты"""
    __tablename__ = "currency_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency_code = Column(String(3), nullable=False)  # USD, EUR, RUB
    rate_to_base = Column(Float, nullable=False)  # Курс к базовой валюте (RUB)
    date = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)


__all__ = ["CurrencyRate"]
