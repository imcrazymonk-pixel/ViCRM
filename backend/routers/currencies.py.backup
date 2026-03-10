"""
Роутер для работы с валютами ViCRM
"""
from fastapi import APIRouter, HTTPException

from database import SessionLocal
from models.currency import CurrencyRate

router = APIRouter(prefix="/api/currencies", tags=["Currencies"])


@router.get("")
async def get_currencies():
    """Получить текущие курсы валют"""
    db = SessionLocal()
    try:
        currencies = []
        for code in ['RUB', 'USD', 'EUR']:
            rate = db.query(CurrencyRate).filter(
                CurrencyRate.currency_code == code
            ).order_by(CurrencyRate.date.desc()).first()

            if rate:
                currencies.append({
                    "code": code,
                    "rate": rate.rate_to_base,
                    "date": rate.date.isoformat() if rate.date else None
                })

        return currencies
    finally:
        db.close()


@router.post("")
async def update_currency(currency_code: str, rate: float):
    """Обновить курс валюты"""
    if currency_code not in ['RUB', 'USD', 'EUR']:
        raise HTTPException(status_code=400, detail="Неподдерживаемая валюта")
    if rate <= 0:
        raise HTTPException(status_code=400, detail="Курс должен быть положительным")

    db = SessionLocal()
    try:
        new_rate = CurrencyRate(
            currency_code=currency_code.upper(),
            rate_to_base=rate
        )
        db.add(new_rate)
        db.commit()
        return {"success": True, "currency": currency_code, "rate": rate}
    finally:
        db.close()
