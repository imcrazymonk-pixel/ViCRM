"""
Роутер для работы с расходами ViCRM
"""
from typing import Optional
from fastapi import APIRouter, HTTPException
from datetime import datetime

from database import SessionLocal
from models.participant import Participant
from models.transaction import Expense
from models.expense import MonthlyExpense
from schemas.transaction import TransactionCreate
from schemas.expense import MonthlyExpenseCreate, MonthlyExpenseUpdate
from services.currency_service import get_currency_rate

router = APIRouter(prefix="/api", tags=["Expenses"])


# === ОБЫЧНЫЕ РАСХОДЫ ===
@router.get("/expenses")
async def get_expenses():
    """Получить все расходы"""
    db = SessionLocal()
    try:
        expenses = db.query(Expense).order_by(Expense.created_at.desc()).all()
        return [{
            "id": e.id,
            "participant_id": e.participant_id,
            "participant_name": e.participant.name,
            "category_id": e.category_id,
            "category_name": e.category.name,
            "amount": e.amount,
            "currency": e.currency,
            "amount_base": e.amount_base,
            "description": e.description,
            "created_at": e.created_at.isoformat() if e.created_at else None
        } for e in expenses]
    finally:
        db.close()


@router.post("")
async def create_expense(transaction: TransactionCreate):
    """Создать расход"""
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        rate = get_currency_rate(db, transaction.currency)
        t = Expense(
            participant_id=transaction.participant_id,
            category_id=transaction.category_id,
            amount=transaction.amount,
            currency=transaction.currency,
            amount_base=transaction.amount * rate,
            description=transaction.description,
            created_at=transaction.created_at or datetime.now()
        )
        db.add(t)
        db.commit()
        db.refresh(t)
        return {"id": t.id}
    finally:
        db.close()


@router.delete("/{expense_id}")
async def delete_expense(expense_id: int):
    """Удалить расход"""
    db = SessionLocal()
    try:
        t = db.query(Expense).filter(Expense.id == expense_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Транзакция не найдена")
        db.delete(t)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@router.put("/{expense_id}")
async def update_expense(expense_id: int, transaction: TransactionCreate):
    """Обновить расход"""
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        t = db.query(Expense).filter(Expense.id == expense_id).first()
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

        db.commit()
        db.refresh(t)
        return {"id": t.id, "success": True}
    finally:
        db.close()


# === ЕЖЕМЕСЯЧНЫЕ РАСХОДЫ ===
@router.get("/monthly_expenses")
async def get_monthly_expenses():
    """Получить список ежемесячных расходов"""
    db = SessionLocal()
    try:
        expenses = db.query(MonthlyExpense).order_by(MonthlyExpense.name).all()
        return [{
            "id": e.id,
            "name": e.name,
            "participant_id": e.participant_id,
            "participant_name": e.participant.name if e.participant else None,
            "category_id": e.category_id,
            "category_name": e.category.name if e.category else None,
            "amount": e.amount,
            "day_of_month": e.day_of_month,
            "description": e.description,
            "is_active": e.is_active,
            "last_paid_month": e.last_paid_month,
            "next_due_date": e.next_due_date.isoformat() if e.next_due_date else None,
            "created_at": e.created_at.isoformat() if e.created_at else None
        } for e in expenses]
    finally:
        db.close()


@router.post("/monthly_expenses")
async def create_monthly_expense(expense: MonthlyExpenseCreate):
    """Создать ежемесячный расход"""
    db = SessionLocal()
    try:
        e = MonthlyExpense(**expense.model_dump())
        if e.day_of_month > 0:
            today = datetime.now()
            if today.day <= e.day_of_month:
                e.next_due_date = today.replace(day=e.day_of_month)
            else:
                if today.month == 12:
                    e.next_due_date = today.replace(year=today.year + 1, month=1, day=e.day_of_month)
                else:
                    e.next_due_date = today.replace(month=today.month + 1, day=e.day_of_month)

        db.add(e)
        db.commit()
        db.refresh(e)
        return {"id": e.id, "success": True}
    finally:
        db.close()


@router.put("/monthly_expenses/{expense_id}")
async def update_monthly_expense(expense_id: int, expense: MonthlyExpenseUpdate):
    """Обновить ежемесячный расход"""
    db = SessionLocal()
    try:
        e = db.query(MonthlyExpense).filter(MonthlyExpense.id == expense_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Расход не найден")

        for field, value in expense.model_dump(exclude_unset=True).items():
            setattr(e, field, value)

        db.commit()
        return {"id": e.id, "success": True}
    finally:
        db.close()


@router.delete("/monthly_expenses/{expense_id}")
async def delete_monthly_expense(expense_id: int):
    """Удалить ежемесячный расход"""
    db = SessionLocal()
    try:
        e = db.query(MonthlyExpense).filter(MonthlyExpense.id == expense_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Расход не найден")
        db.delete(e)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@router.post("/monthly_expenses/{expense_id}/pay")
async def pay_monthly_expense(expense_id: int, month: Optional[str] = None):
    """Отметить ежемесячный расход как оплаченный"""
    db = SessionLocal()
    try:
        e = db.query(MonthlyExpense).filter(MonthlyExpense.id == expense_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Расход не найден")

        if not month:
            month = datetime.now().strftime("%Y-%m")

        e.last_paid_month = month

        if e.category_id and e.participant_id:
            expense = Expense(
                participant_id=e.participant_id,
                category_id=e.category_id,
                amount=e.amount,
                description=f"Ежемесячный платёж: {e.name} за {month}",
                created_at=datetime.now()
            )
            expense.amount_base = e.amount
            db.add(expense)

        db.commit()
        return {"success": True, "last_paid_month": e.last_paid_month}
    finally:
        db.close()
