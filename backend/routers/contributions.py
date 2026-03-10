"""
Роутер для работы с взносами ViCRM
"""
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException
from sqlalchemy import func

from database import SessionLocal
from models.participant import Participant
from models.transaction import Contribution

router = APIRouter(prefix="/api/contributions", tags=["Contributions"])


@router.get("")
async def get_contributions(participant_id: Optional[int] = None, month: Optional[str] = None):
    """Получить список взносов с фильтрацией"""
    db = SessionLocal()
    try:
        query = db.query(Contribution).order_by(
            Contribution.month.desc(),
            Contribution.participant_id
        )

        if participant_id:
            query = query.filter(Contribution.participant_id == participant_id)
        if month:
            query = query.filter(Contribution.month == month)

        contributions = query.all()
        return [{
            "id": c.id,
            "participant_id": c.participant_id,
            "participant_name": c.participant.name,
            "month": c.month,
            "amount_required": c.amount_required,
            "amount_paid": c.amount_paid,
            "status": c.status,
            "comment": c.comment,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        } for c in contributions]
    finally:
        db.close()


@router.get("/summary")
async def get_contributions_summary(month: Optional[str] = None):
    """Получить сводку по взносам"""
    db = SessionLocal()
    try:
        if not month:
            month = datetime.now().strftime("%Y-%m")

        total_required = db.query(func.sum(Contribution.amount_required)).scalar() or 0
        total_paid = db.query(func.sum(Contribution.amount_paid)).scalar() or 0
        total_debt = total_required - total_paid

        months_data = db.query(
            Contribution.month,
            func.sum(Contribution.amount_required).label('required'),
            func.sum(Contribution.amount_paid).label('paid')
        ).group_by(Contribution.month).order_by(Contribution.month.desc()).all()

        participants_data = db.query(
            Contribution.participant_id,
            Participant.name,
            func.sum(Contribution.amount_required).label('required'),
            func.sum(Contribution.amount_paid).label('paid')
        ).join(Participant).group_by(
            Contribution.participant_id,
            Participant.name
        ).all()

        debtors = db.query(
            Contribution.participant_id,
            Participant.name,
            Contribution.amount_required,
            Contribution.amount_paid,
            (Contribution.amount_required - Contribution.amount_paid).label('debt')
        ).join(Participant).filter(
            Contribution.month == month,
            Contribution.amount_paid < Contribution.amount_required
        ).all()

        return {
            "total_required": total_required,
            "total_paid": total_paid,
            "total_debt": total_debt,
            "months": [{"month": m.month, "required": m.required, "paid": m.paid} for m in months_data],
            "participants": [{
                "participant_id": p.participant_id,
                "name": p.name,
                "required": p.required,
                "paid": p.paid,
                "debt": p.required - p.paid
            } for p in participants_data],
            "debtors": [{
                "participant_id": d.participant_id,
                "name": d.name,
                "required": d.amount_required,
                "paid": d.amount_paid,
                "debt": d.debt
            } for d in debtors]
        }
    finally:
        db.close()


@router.delete("/{contribution_id}")
async def delete_contribution(contribution_id: int):
    """Удалить запись о взносе"""
    db = SessionLocal()
    try:
        c = db.query(Contribution).filter(Contribution.id == contribution_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Взнос не найден")
        db.delete(c)
        db.commit()
        return {"success": True}
    finally:
        db.close()
