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
            "description": i.description,
            "created_at": i.created_at.isoformat() if i.created_at else None
        } for i in incomes]
    finally:
        db.close()


@router.post("")
async def create_income(transaction: TransactionCreate):
    """
    Создать доход с пересчётом баланса участника
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

        t = Income(
            participant_id=transaction.participant_id,
            category_id=transaction.category_id,
            amount=transaction.amount,
            currency=transaction.currency,
            description=transaction.description,
            created_at=transaction.created_at or datetime.now()
        )
        db.add(t)

        # === ПЕРЕСЧЁТ БАЛАНСА УЧАСТНИКА ===
        participant = db.query(Participant).filter(Participant.id == transaction.participant_id).first()
        if participant:
            recalculate_participant_fields(db, participant)

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

        if participant:
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

        t.participant_id = transaction.participant_id
        t.category_id = transaction.category_id
        t.amount = transaction.amount
        t.currency = transaction.currency
        t.description = transaction.description
        t.created_at = transaction.created_at or datetime.now()

        participant = db.query(Participant).filter(Participant.id == transaction.participant_id).first()
        if participant:
            recalculate_participant_fields(db, participant)

        db.commit()
        db.refresh(t)
        return {"id": t.id, "success": True}
    finally:
        db.close()
