"""
Роутер для работы с участниками ViCRM
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, Body
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import joinedload

from database import SessionLocal
from models.participant import Participant, ParticipantGroup, MembershipHistory
from models.transaction import Income, Expense
from schemas.participant import ParticipantCreate, ParticipantUpdate
from services.participant_service import recalculate_participant_fields
from utils.logger import logger

router = APIRouter(prefix="/api/participants", tags=["Participants"])


@router.get("")
async def get_participants():
    """Получить список всех участников"""
    db = SessionLocal()
    try:
        participants = db.query(Participant).order_by(Participant.name).all()
        return [{
            "id": p.id,
            "name": p.name,
            "group_id": p.group_id,
            "group_name": p.group.name if p.group else None,
            "group_monthly_fee": p.group.monthly_fee if p.group else None,
            "start_date": p.start_date,
            "is_active": p.is_active,
            "balance": p.balance,
            "total_paid": p.total_paid,
            "paid_until_month": p.paid_until_month,
            "paused_from": p.paused_from,
            "paused_to": p.paused_to,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "total_incomes": sum(i.amount for i in p.incomes),
            "total_expenses": sum(e.amount for e in p.expenses),
            "incomes_count": len(p.incomes),
            "expenses_count": len(p.expenses)
        } for p in participants]
    finally:
        db.close()


@router.post("")
async def create_participant(participant: ParticipantCreate, allow_duplicate: bool = False):
    """Создать нового участника"""
    if not participant.name or not participant.name.strip():
        raise HTTPException(status_code=400, detail="Имя не может быть пустым")

    db = SessionLocal()
    try:
        # Проверка на дубликат
        existing = db.query(Participant).filter(
            func.lower(Participant.name) == func.lower(participant.name.strip())
        ).first()

        if existing and not allow_duplicate:
            raise HTTPException(
                status_code=400,
                detail=f"Участник с именем '{participant.name.strip()}' уже существует (ID: {existing.id})",
                headers={"X-DUPLICATE-ID": str(existing.id)}
            )

        if existing and allow_duplicate:
            return {"id": existing.id, "name": existing.name, "duplicate": True}

        # Определяем start_date (по умолчанию текущий месяц)
        start_date = participant.start_date if participant.start_date else datetime.now().strftime("%Y-%m")

        p = Participant(
            name=participant.name.strip(),
            group_id=participant.group_id,
            start_date=start_date,
            is_active=participant.is_active if participant.is_active is not None else True
        )
        db.add(p)
        db.commit()
        db.refresh(p)

        # Если указана группа, создаём запись в MembershipHistory
        if participant.group_id:
            membership = MembershipHistory(
                participant_id=p.id,
                group_id=participant.group_id,
                joined_at=start_date,
                left_at=None,
                reason=None
            )
            db.add(membership)
            db.commit()

        return {"id": p.id, "name": p.name, "start_date": p.start_date, "is_active": p.is_active}
    finally:
        db.close()


@router.put("/{participant_id}")
async def update_participant(participant_id: int, participant: ParticipantUpdate):
    """Обновить участника (имя, start_date, is_active, paused_from, paused_to)

    ⚠️ Для смены группы используйте POST /api/participants/{id}/change-group
    """
    if not participant.name or not participant.name.strip():
        raise HTTPException(status_code=400, detail="Имя не может быть пустым")

    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")

        p.name = participant.name.strip()

        # ⚠️ Блокируем смену группы через PUT — используйте change-group
        if participant.group_id is not None and participant.group_id != p.group_id:
            raise HTTPException(
                status_code=400,
                detail="Для смены группы используйте POST /api/participants/{id}/change-group"
            )

        # Обновляем start_date
        if participant.start_date is not None:
            p.start_date = participant.start_date

        # Обновляем is_active
        if participant.is_active is not None:
            p.is_active = participant.is_active

        # 🆕 Обновляем баланс только если явно передан (не None)
        if participant.balance is not None:
            p.balance = participant.balance

        # 🆕 Обновляем поля паузы
        if participant.paused_from is not None:
            p.paused_from = participant.paused_from
        if participant.paused_to is not None:
            p.paused_to = participant.paused_to

        # 🆕 Пересчитываем поля при обновлении
        recalculate_participant_fields(db, p)

        db.commit()
        return {"id": p.id, "name": p.name, "start_date": p.start_date, "is_active": p.is_active}
    finally:
        db.close()


@router.delete("/{participant_id}")
async def delete_participant(participant_id: int):
    """Удалить участника"""
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")
        if p.incomes or p.expenses:
            raise HTTPException(status_code=400, detail=f"Есть транзакции: {len(p.incomes)} доходов, {len(p.expenses)} расходов")
        db.delete(p)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@router.post("/{participant_id}/activate")
async def activate_participant(
    participant_id: int,
    group_id: int = Body(..., embed=True),
    start_date: Optional[str] = Body(None, embed=True)
):
    """Активировать участника в группе"""
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")

        group = db.query(ParticipantGroup).filter(ParticipantGroup.id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Группа не найдена")

        # Активируем
        p.is_active = True
        p.group_id = group_id

        # Если start_date не указан, используем текущий месяц
        if not start_date:
            start_date = datetime.now().strftime("%Y-%m")
        p.start_date = start_date

        # Создаём запись в MembershipHistory
        membership = MembershipHistory(
            participant_id=participant_id,
            group_id=group_id,
            joined_at=start_date,
            left_at=None,
            reason="Активация"
        )
        db.add(membership)

        # === ПЕРЕСЧЁТ ПОЛЕЙ ===
        recalculate_participant_fields(db, p)

        db.commit()
        return {"success": True, "participant_id": participant_id, "group_id": group_id, "start_date": start_date}
    finally:
        db.close()


@router.post("/{participant_id}/deactivate")
async def deactivate_participant(participant_id: int, reason: Optional[str] = None):
    """Деактивировать участника с сохранением баланса"""
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")

        current_month = datetime.now().strftime("%Y-%m")

        # Если был в группе, закрываем запись в истории
        if p.group_id:
            active_membership = db.query(MembershipHistory).filter(
                MembershipHistory.participant_id == participant_id,
                MembershipHistory.group_id == p.group_id,
                MembershipHistory.left_at == None
            ).first()
            if active_membership:
                active_membership.left_at = current_month
                active_membership.reason = reason or "Деактивация"

        # Возвращаем последний месяц в баланс (если не использован)
        if p.paid_until_month and p.paid_until_month >= current_month:
            if p.group and p.group.monthly_fee > 0:
                p.balance += p.group.monthly_fee
                # Уменьшаем paid_until_month на месяц
                year, month = map(int, p.paid_until_month.split('-'))
                if month == 1:
                    p.paid_until_month = f"{year-1}-12"
                else:
                    p.paid_until_month = f"{year}-{month-1:02d}"

        # Деактивируем
        p.is_active = False
        old_group_id = p.group_id
        p.group_id = None  # Выход из группы

        db.commit()
        return {
            "success": True,
            "participant_id": participant_id,
            "balance": p.balance,
            "old_group_id": old_group_id
        }
    finally:
        db.close()


@router.post("/{participant_id}/change-group")
async def change_participant_group(
    participant_id: int,
    group_id: int = Body(..., embed=True),
    reason: Optional[str] = Body(None, embed=True)
):
    """Сменить группу участнику с пересчётом баланса"""
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")

        new_group = db.query(ParticipantGroup).filter(ParticipantGroup.id == group_id).first()
        if not new_group:
            raise HTTPException(status_code=404, detail="Группа не найдена")

        if new_group.monthly_fee <= 0:
            raise HTTPException(status_code=400, detail="Ежемесячный платёж в группе должен быть > 0")

        old_group_id = p.group_id
        old_group = db.query(ParticipantGroup).filter(ParticipantGroup.id == old_group_id).first() if old_group_id else None

        current_month = datetime.now().strftime("%Y-%m")
        curr_year, curr_month = map(int, current_month.split('-'))

        # === 1. Считаем остаток оплаченных месяцев от paid_until_month ===
        remaining_months = 0
        if p.paid_until_month and p.paid_until_month >= current_month:
            paid_year, paid_month = map(int, p.paid_until_month.split('-'))
            remaining_months = (paid_year - curr_year) * 12 + (paid_month - curr_month)
            # +1 потому что paid_until_month включает текущий месяц
            remaining_months += 1

        # === 2. Конвертируем в рубли по СТАРОЙ группе ===
        # (это сумма, которая ещё не списана)
        balance_in_rubles = 0.0
        if old_group and old_group.monthly_fee > 0:
            balance_in_rubles = remaining_months * old_group.monthly_fee + p.balance
        else:
            balance_in_rubles = p.balance

        # === 3. Конвертируем в месяцы по НОВОЙ группе ===
        if new_group.monthly_fee > 0:
            new_remaining_months = int(balance_in_rubles / new_group.monthly_fee)
            new_balance = balance_in_rubles % new_group.monthly_fee
        else:
            new_remaining_months = 0
            new_balance = balance_in_rubles

        # === 4. Обновляем paid_until_month ===
        if new_remaining_months > 0:
            total_months = curr_month + new_remaining_months - 1
            new_year = curr_year + (total_months - 1) // 12
            new_month = (total_months - 1) % 12 + 1
            p.paid_until_month = f"{new_year}-{new_month:02d}"
        else:
            p.paid_until_month = None

        # === 5. Обновляем группу и баланс ===
        p.group_id = group_id
        p.balance = new_balance

        # === 6. Создаём запись в MembershipHistory ===
        if old_group_id:
            active_membership = db.query(MembershipHistory).filter(
                MembershipHistory.participant_id == participant_id,
                MembershipHistory.group_id == old_group_id,
                MembershipHistory.left_at == None
            ).first()
            if active_membership:
                active_membership.left_at = current_month
                active_membership.reason = reason or f"Смена группы (было: {old_group.name})"

        new_membership = MembershipHistory(
            participant_id=participant_id,
            group_id=group_id,
            joined_at=current_month,
            left_at=None,
            reason=reason or f"Смена группы (стало: {new_group.name})"
        )
        db.add(new_membership)

        db.commit()

        return {
            "success": True,
            "participant_id": participant_id,
            "old_group_id": old_group_id,
            "new_group_id": group_id,
            "old_monthly_fee": old_group.monthly_fee if old_group else 0,
            "new_monthly_fee": new_group.monthly_fee,
            "remaining_months_old_group": remaining_months,
            "balance_in_rubles": balance_in_rubles,
            "new_remaining_months": new_remaining_months,
            "new_balance": new_balance,
            "new_paid_until_month": p.paid_until_month
        }
    finally:
        db.close()


@router.get("/{participant_id}/balance")
async def get_participant_balance(participant_id: int):
    """Получить детальный баланс участника"""
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")

        current_month = datetime.now().strftime("%Y-%m")

        # Считаем сколько должен был внести с момента начала
        if p.start_date:
            start_year, start_month = map(int, p.start_date.split('-'))
            curr_year, curr_month = map(int, current_month.split('-'))
            months_since_start = (curr_year - start_year) * 12 + (curr_month - start_month) + 1
        else:
            months_since_start = 0

        # Сколько должен был внести
        should_have_paid = 0
        if p.group and p.group.monthly_fee > 0:
            should_have_paid = months_since_start * p.group.monthly_fee

        # Следующий месяц платежа
        if p.paid_until_month:
            year, month = map(int, p.paid_until_month.split('-'))
            if month == 12:
                next_payment_month = f"{year+1}-01"
            else:
                next_payment_month = f"{year}-{month+1:02d}"
        else:
            next_payment_month = current_month

        return {
            "participant_id": participant_id,
            "name": p.name,
            "total_paid": p.total_paid,
            "should_have_paid": should_have_paid,
            "balance": p.balance,
            "paid_until_month": p.paid_until_month,
            "next_payment_month": next_payment_month,
            "is_active": p.is_active,
            "group_name": p.group.name if p.group else None,
            "monthly_fee": p.group.monthly_fee if p.group else 0
        }
    finally:
        db.close()
