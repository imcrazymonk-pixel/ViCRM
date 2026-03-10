"""
Валютный сервис ViCRM
"""
from sqlalchemy import func

from config import DEFAULT_CURRENCY_RATES
from database import SessionLocal
from models.currency import CurrencyRate
from utils.logger import logger


def get_currency_rate(db, currency: str) -> float:
    """Получить курс валюты к RUB"""
    if currency == 'RUB':
        return 1.0

    rate = db.query(CurrencyRate).filter(
        CurrencyRate.currency_code == currency
    ).order_by(CurrencyRate.date.desc()).first()

    if rate:
        return rate.rate_to_base

    # Курсы по умолчанию
    return DEFAULT_CURRENCY_RATES.get(currency, 1.0)


def init_currency_rates(db):
    """Инициализировать курсы валют по умолчанию"""
    default_rates = [
        ('RUB', 1.0),
        ('USD', 90.0),
        ('EUR', 97.0)
    ]
    
    for code, rate in default_rates:
        existing = db.query(CurrencyRate).filter(CurrencyRate.currency_code == code).first()
        if not existing:
            db.add(CurrencyRate(currency_code=code, rate_to_base=rate))
            logger.info(f"Добавлен курс валюты {code}: {rate}")


__all__ = ["get_currency_rate", "init_currency_rates"]
