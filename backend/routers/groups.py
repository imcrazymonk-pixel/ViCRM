"""
Роутер для работы с группами участников ViCRM
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta

from database import SessionLocal
from models.participant import Participant, ParticipantGroup
from schemas.participant import ParticipantGroupCreate, ParticipantGroupUpdate
from utils.logger import logger

router = APIRouter(prefix="/api/groups", tags=["Groups"])


@router.get("")
async def get_groups():
    """Получить список групп контрагентов"""
    db = SessionLocal()
    try:
        groups = db.query(ParticipantGroup).order_by(ParticipantGroup.name).all()
        current_month = datetime.now().strftime("%Y-%m")
        next_month_dt = datetime.now().replace(day=1) + timedelta(days=32)
        next_month = next_month_dt.replace(day=1).strftime("%Y-%m")

        result = []
        for g in groups:
            active_participants = [p for p in g.participants if p.is_active]

            should_pay_next_month = []
            for p in active_participants:
                if p.paid_until_month is None or p.paid_until_month < next_month:
                    should_pay_next_month.append(p.id)

            expected_monthly_income = len(active_participants) * g.monthly_fee

            result.append({
                "id": g.id,
                "name": g.name,
                "group_type": g.group_type,
                "monthly_fee": g.monthly_fee,
                "description": g.description,
                "is_active": g.is_active,
                "auto_create_contributions": g.auto_create_contributions,
                "participants_count": len(g.participants),
                "active_participants_count": len(active_participants),
                "should_pay_next_month_count": len(should_pay_next_month),
                "expected_monthly_income": expected_monthly_income,
                "created_at": g.created_at.isoformat() if g.created_at else None
            })

        return result
    finally:
        db.close()


@router.post("")
async def create_group(group: ParticipantGroupCreate):
    """Создать группу контрагентов"""
    db = SessionLocal()
    try:
        g = ParticipantGroup(**group.model_dump())
        db.add(g)
        db.commit()
        db.refresh(g)
        return {"id": g.id, "success": True}
    finally:
        db.close()


@router.put("/{group_id}")
async def update_group(group_id: int, group: ParticipantGroupUpdate):
    """Обновить группу"""
    db = SessionLocal()
    try:
        g = db.query(ParticipantGroup).filter(ParticipantGroup.id == group_id).first()
        if not g:
            raise HTTPException(status_code=404, detail="Группа не найдена")

        update_data = group.model_dump(exclude_unset=True)

        monthly_fee_changed = 'monthly_fee' in update_data and update_data['monthly_fee'] != g.monthly_fee
        monthly_fee_warning = None

        if monthly_fee_changed:
            active_participants = [p for p in g.participants if p.is_active]
            monthly_fee_warning = (
                f"Ежемесячный платёж изменён с {g.monthly_fee} на {update_data['monthly_fee']}. "
                f"Балансы участников не пересчитаны. Затронуто активных участников: {len(active_participants)}. "
                f"Новый тариф применяется к будущим платежам."
            )
            logger.warning(f"Группа {g.name}: monthly_fee изменён с {g.monthly_fee} на {update_data['monthly_fee']}")

        for field, value in update_data.items():
            setattr(g, field, value)

        db.commit()

        return {
            "id": g.id,
            "success": True,
            "monthly_fee_changed": monthly_fee_changed,
            "monthly_fee_warning": monthly_fee_warning
        }
    finally:
        db.close()


@router.delete("/{group_id}")
async def delete_group(group_id: int):
    """Удалить группу"""
    db = SessionLocal()
    try:
        g = db.query(ParticipantGroup).filter(ParticipantGroup.id == group_id).first()
        if not g:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        if g.participants:
            raise HTTPException(status_code=400, detail=f"В группе есть участники: {len(g.participants)}")
        db.delete(g)
        db.commit()
        return {"success": True}
    finally:
        db.close()
