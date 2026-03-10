"""
Роутер для работы с шаблонами транзакций ViCRM
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta

from database import SessionLocal
from models.template import TransactionTemplate
from models.transaction import Income, Expense
from schemas.template import TransactionTemplateCreate, TransactionTemplateUpdate
from services.currency_service import get_currency_rate

router = APIRouter(prefix="/api/templates", tags=["Templates"])


@router.get("")
async def get_templates():
    """Получить все шаблоны"""
    db = SessionLocal()
    try:
        templates = db.query(TransactionTemplate).order_by(
            TransactionTemplate.is_active.desc(),
            TransactionTemplate.name
        ).all()
        return [{
            "id": t.id,
            "name": t.name,
            "template_type": t.template_type,
            "participant_id": t.participant_id,
            "participant_name": t.participant.name,
            "category_id": t.category_id,
            "amount": t.amount,
            "description": t.description,
            "interval_days": t.interval_days,
            "is_active": t.is_active,
            "last_created": t.last_created.isoformat() if t.last_created else None,
            "next_due": t.next_due.isoformat() if t.next_due else None,
            "created_at": t.created_at.isoformat() if t.created_at else None
        } for t in templates]
    finally:
        db.close()


@router.post("")
async def create_template(template: TransactionTemplateCreate):
    """Создать шаблон"""
    if not template.name or not template.name.strip():
        raise HTTPException(status_code=400, detail="Название не может быть пустым")
    if template.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        t = TransactionTemplate(**template.model_dump())
        t.next_due = datetime.now() + timedelta(days=template.interval_days)
        db.add(t)
        db.commit()
        db.refresh(t)
        return {"id": t.id, "name": t.name}
    finally:
        db.close()


@router.put("/{template_id}")
async def update_template(template_id: int, update: TransactionTemplateUpdate):
    """Обновить шаблон"""
    db = SessionLocal()
    try:
        t = db.query(TransactionTemplate).filter(TransactionTemplate.id == template_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Шаблон не найден")

        if update.name is not None:
            t.name = update.name.strip()
        if update.is_active is not None:
            t.is_active = update.is_active
        if update.interval_days is not None:
            t.interval_days = update.interval_days
            if t.is_active:
                t.next_due = datetime.now() + timedelta(days=update.interval_days)

        db.commit()
        db.refresh(t)
        return {"id": t.id, "name": t.name}
    finally:
        db.close()


@router.delete("/{template_id}")
async def delete_template(template_id: int):
    """Удалить шаблон"""
    db = SessionLocal()
    try:
        t = db.query(TransactionTemplate).filter(TransactionTemplate.id == template_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Шаблон не найден")
        db.delete(t)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@router.post("/{template_id}/execute")
async def execute_template(template_id: int):
    """Выполнить шаблон — создать транзакцию"""
    db = SessionLocal()
    try:
        t = db.query(TransactionTemplate).filter(TransactionTemplate.id == template_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Шаблон не найден")
        if not t.is_active:
            raise HTTPException(status_code=400, detail="Шаблон не активен")

        rate = get_currency_rate(db, t.currency)

        if t.template_type == 'income':
            new_transaction = Income(
                participant_id=t.participant_id,
                category_id=t.category_id,
                amount=t.amount,
                currency=t.currency,
                amount_base=t.amount * rate,
                description=t.description or f"По шаблону: {t.name}"
            )
        else:
            new_transaction = Expense(
                participant_id=t.participant_id,
                category_id=t.category_id,
                amount=t.amount,
                currency=t.currency,
                amount_base=t.amount * rate,
                description=t.description or f"По шаблону: {t.name}"
            )

        db.add(new_transaction)

        t.last_created = datetime.now()
        t.next_due = datetime.now() + timedelta(days=t.interval_days)

        db.commit()
        return {"success": True, "transaction_id": new_transaction.id}
    finally:
        db.close()


@router.get("/due")
async def get_due_templates():
    """Получить шаблоны, у которых срок наступил"""
    db = SessionLocal()
    try:
        now = datetime.now()
        templates = db.query(TransactionTemplate).filter(
            TransactionTemplate.is_active == True,
            TransactionTemplate.next_due <= now
        ).all()

        return [{
            "id": t.id,
            "name": t.name,
            "template_type": t.template_type,
            "amount": t.amount,
            "participant_name": t.participant.name,
            "days_overdue": (now - t.next_due).days if t.next_due else 0
        } for t in templates]
    finally:
        db.close()
