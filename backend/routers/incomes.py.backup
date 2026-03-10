"""
Роутер для работы с доходами ViCRM
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from database import SessionLocal
from models.participant import Participant, ParticipantGroup, MembershipHistory
from models.transaction import Income, Contribution
from models.category import IncomeCategory
from schemas.transaction import TransactionCreate
from services.currency_service import get_currency_rate
from services.participant_service import recalculate_participant_fields
from utils.logger import logger

router = APIRouter(prefix="/api/incomes", tags=["Incomes"])


@router.get("")
async def get_incomes():
    """Получить все доходы"""
    db = SessionLocal()
    try:
        incomes = db.query(Income).order_by(Income.created_at.desc()).all()
        return [{
            "id": i.id,
            "participant_id": i.participant_id,
            "participant_name": i.participant.name,
            "category_id": i.category_id,
            "category_name": i.category.name,
            "amount": i.amount,
            "currency": i.currency,
            "amount_base": i.amount_base,
            "description": i.description,
            "created_at": i.created_at.isoformat() if i.created_at else None
        } for i in incomes]
    finally:
        db.close()


@router.post("")
async def create_income(transaction: TransactionCreate):
    """
    Создать доход с учётом start_date и приоритета погашения долгов
    Защита от дублирования (проверка идентичного платежа за последние 5 секунд)
    """
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        # Проверка на дубликат (идентичный платёж за последние 5 секунд)
        if transaction.created_at:
            five_seconds_ago = datetime.now() - timedelta(seconds=5)
            duplicate = db.query(Income).filter(
                Income.participant_id == transaction.participant_id,
                Income.category_id == transaction.category_id,
                Income.amount == transaction.amount,
                Income.description == (transaction.description or ''),
                Income.created_at >= five_seconds_ago
            ).first()

            if duplicate:
                logger.info(f"Обнаружен дубликат платежа: participant_id={transaction.participant_id}, amount={transaction.amount}")
                raise HTTPException(
                    status_code=400,
                    detail="Этот платёж уже был внесён несколько секунд назад. Возможно, вы нажали кнопку дважды."
                )

        rate = get_currency_rate(db, transaction.currency)
        t = Income(
            participant_id=transaction.participant_id,
            category_id=transaction.category_id,
            amount=transaction.amount,
            currency=transaction.currency,
            amount_base=transaction.amount * rate,
            description=transaction.description,
            created_at=transaction.created_at or datetime.now()
        )
        db.add(t)

        # АВТОМАТИЧЕСКОЕ РАСПРЕДЕЛЕНИЕ ПО МЕСЯЦАМ (ВЕРСИЯ 2.0)
        # Если это взнос участника из группы с monthly_fee
        participant = db.query(Participant).filter(Participant.id == transaction.participant_id).first()
        if participant and participant.group and participant.is_active:
            group = participant.group
            if group.group_type == "contribution" and group.monthly_fee > 0:
                current_month = datetime.now().strftime("%Y-%m")
                amount = transaction.amount

                # 1. Определяем первый месяц для расчёта
                if participant.start_date:
                    first_month = max(participant.start_date, current_month)
                else:
                    first_month = current_month
                    participant.start_date = current_month

                # 2. Находим месяцы с долгом
                debt_months = 0
                if participant.paid_until_month and participant.paid_until_month < current_month:
                    paid_year, paid_month = map(int, participant.paid_until_month.split('-'))
                    curr_year, curr_month = map(int, current_month.split('-'))
                    debt_months = (curr_year - paid_year) * 12 + (curr_month - paid_month)

                # 3. Сначала гасим долги
                amount_for_debts = debt_months * group.monthly_fee
                amount_remaining = amount - amount_for_debts

                # 4. Остаток распределяем вперёд
                if amount_remaining > 0:
                    advance_months = int(amount_remaining / group.monthly_fee)
                    balance_copecks = amount_remaining % group.monthly_fee
                else:
                    advance_months = 0
                    balance_copecks = 0

                # 5. Обновляем paid_until_month
                if advance_months > 0 or debt_months > 0:
                    if participant.paid_until_month and participant.paid_until_month >= current_month:
                        year, month = map(int, participant.paid_until_month.split('-'))
                    else:
                        year, month = map(int, first_month.split('-'))

                    for _ in range(advance_months):
                        month += 1
                        if month > 12:
                            month = 1
                            year += 1

                    participant.paid_until_month = f"{year}-{month:02d}"
                elif amount > 0 and not participant.paid_until_month:
                    participant.paid_until_month = first_month

                # 6. Обновляем баланс (копейки)
                participant.balance = balance_copecks

                # 7. Обновляем total_paid
                participant.total_paid += amount

                # 8. Создаём/обновляем Contribution записи
                if participant.start_date:
                    start_year, start_month = map(int, participant.start_date.split('-'))
                else:
                    start_year, start_month = map(int, current_month.split('-'))

                if participant.paid_until_month:
                    end_year, end_month = map(int, participant.paid_until_month.split('-'))
                    current_year, current_month_num = map(int, current_month.split('-'))

                    year_iter, month_iter = start_year, start_month
                    month_index = 0

                    while (year_iter < end_year) or (year_iter == end_year and month_iter <= end_month):
                        month_str = f"{year_iter}-{month_iter:02d}"

                        is_past = (year_iter < current_year) or (year_iter == current_year and month_iter < current_month_num)
                        is_current = (year_iter == current_year and month_iter == current_month_num)

                        existing = db.query(Contribution).filter(
                            Contribution.participant_id == participant.id,
                            Contribution.month == month_str
                        ).first()

                        if not existing:
                            contribution = Contribution(
                                participant_id=participant.id,
                                month=month_str,
                                amount_required=group.monthly_fee,
                                amount_paid=group.monthly_fee,
                                status="paid",
                                is_advance=(not is_past and not is_current),
                                paid_at=transaction.created_at or datetime.now()
                            )
                            db.add(contribution)
                        else:
                            existing.amount_paid = group.monthly_fee
                            existing.status = "paid"
                            existing.paid_at = transaction.created_at or datetime.now()

                        month_iter += 1
                        if month_iter > 12:
                            month_iter = 1
                            year_iter += 1
                        month_index += 1

        db.commit()
        db.refresh(t)
        return {"id": t.id}
    finally:
        db.close()


@router.delete("/{income_id}")
async def delete_income(income_id: int):
    """Удалить доход с пересчётом полей участника"""
    db = SessionLocal()
    try:
        t = db.query(Income).filter(Income.id == income_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Транзакция не найдена")

        participant_id = t.participant_id

        db.delete(t)
        db.flush()

        participant = db.query(Participant).options(
            joinedload(Participant.group)
        ).filter(Participant.id == participant_id).first()

        if participant and participant.group and participant.group.monthly_fee > 0:
            logger.info(f"Пересчёт полей для участника {participant.name} после удаления дохода")
            recalculate_participant_fields(db, participant)

        db.commit()
        return {"success": True}
    finally:
        db.close()


@router.put("/{income_id}")
async def update_income(income_id: int, transaction: TransactionCreate):
    """Обновить доход с пересчётом полей участника"""
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        t = db.query(Income).filter(Income.id == income_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Транзакция не найдена")

        rate = get_currency_rate(db, transaction.currency)
        t.participant_id = transaction.participant_id
        t.category_id = transaction.category_id
        t.amount = transaction.amount
        t.currency = transaction.currency
        t.amount_base = transaction.amount * rate
        t.description = transaction.description
        t.created_at = transaction.created_at or datetime.now()

        participant = db.query(Participant).filter(Participant.id == transaction.participant_id).first()
        if participant and participant.group and participant.group.monthly_fee > 0:
            recalculate_participant_fields(db, participant)

        db.commit()
        db.refresh(t)
        return {"id": t.id, "success": True}
    finally:
        db.close()
