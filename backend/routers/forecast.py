"""
Роутер для финансового прогноза ViCRM
"""
from typing import Optional
from fastapi import APIRouter
from datetime import datetime, timedelta
from sqlalchemy import func

from database import SessionLocal
from models.participant import Participant, ParticipantGroup
from models.transaction import Income, Expense, Contribution
from models.expense import MonthlyExpense

router = APIRouter(prefix="/api/finance", tags=["Forecast"])


@router.get("/forecast")
async def get_finance_forecast(months_ahead: int = 6):
    """Получить финансовый прогноз на N месяцев"""
    db = SessionLocal()
    try:
        # 1. Текущий баланс (доходы - расходы)
        total_income = db.query(func.sum(Income.amount_base)).scalar() or 0
        total_expense = db.query(func.sum(Expense.amount_base)).scalar() or 0
        current_balance = total_income - total_expense

        # 2. Ежемесячные доходы (взносы ТОЛЬКО АКТИВНЫХ участников)
        groups = db.query(ParticipantGroup).filter(
            ParticipantGroup.group_type == "contribution",
            ParticipantGroup.is_active == True,
            ParticipantGroup.monthly_fee > 0
        ).all()

        expected_monthly_income = 0
        participants_by_group = {}
        current_month = datetime.now().strftime("%Y-%m")

        for group in groups:
            active_members = db.query(Participant).filter(
                Participant.group_id == group.id,
                Participant.is_active == True
            ).all()

            members_count = 0
            for member in active_members:
                if not member.paid_until_month or member.paid_until_month < current_month:
                    members_count += 1

            group_income = members_count * group.monthly_fee
            expected_monthly_income += group_income

            participants_by_group[group.id] = {
                "name": group.name,
                "monthly_fee": group.monthly_fee,
                "members_count": len(active_members),
                "active_payers": members_count,
                "total_expected": group_income
            }

        # 3. Ежемесячные расходы
        monthly_expenses = db.query(MonthlyExpense).filter(
            MonthlyExpense.is_active == True
        ).all()

        expected_monthly_expense = sum(e.amount for e in monthly_expenses)

        # 4. Прогноз по месяцам
        forecast = []
        running_balance = current_balance

        today = datetime.now()

        for i in range(months_ahead):
            if today.month + i > 12:
                year = today.year + (today.month + i - 1) // 12
                month = (today.month + i - 1) % 12 + 1
            else:
                year = today.year
                month = today.month + i

            month_str = f"{year}-{month:02d}"
            month_name = datetime(year, month, 1).strftime("%B %Y")

            income = expected_monthly_income
            expense = expected_monthly_expense
            delta = income - expense
            running_balance += delta

            forecast.append({
                "month": month_str,
                "month_name": month_name,
                "income": income,
                "expense": expense,
                "delta": delta,
                "running_balance": running_balance,
                "status": "OK" if running_balance >= 0 else "DEFICIT"
            })

        # 5. Участники с задолженностью (ТОЛЬКО АКТИВНЫЕ)
        debtors_query = db.query(
            Participant.id,
            Participant.name,
            Participant.total_paid,
            Participant.paid_until_month,
            Participant.is_active,
            ParticipantGroup.monthly_fee
        ).join(ParticipantGroup).filter(
            ParticipantGroup.group_type == "contribution",
            Participant.is_active == True
        ).all()

        debtors = []
        for d in debtors_query:
            if d.paid_until_month is None or d.paid_until_month < current_month:
                months_unpaid = 0
                if d.paid_until_month:
                    paid_year, paid_month = map(int, d.paid_until_month.split('-'))
                    curr_year, curr_month = map(int, current_month.split('-'))
                    months_unpaid = (curr_year - paid_year) * 12 + (curr_month - paid_month)

                debtors.append({
                    "id": d.id,
                    "name": d.name,
                    "monthly_fee": d.monthly_fee,
                    "paid_until": d.paid_until_month,
                    "months_unpaid": max(0, months_unpaid),
                    "debt_amount": max(0, months_unpaid) * d.monthly_fee if d.monthly_fee else 0
                })

        # 6. Хосты с неоплаченными счетами
        unpaid_hosts = db.query(
            MonthlyExpense.id,
            MonthlyExpense.name,
            MonthlyExpense.amount,
            MonthlyExpense.last_paid_month,
            MonthlyExpense.next_due_date
        ).filter(
            MonthlyExpense.is_active == True
        ).all()

        hosts_alert = []
        for h in unpaid_hosts:
            if h.last_paid_month is None or h.last_paid_month < current_month:
                hosts_alert.append({
                    "id": h.id,
                    "name": h.name,
                    "amount": h.amount,
                    "last_paid": h.last_paid_month,
                    "next_due": h.next_due_date.isoformat() if h.next_due_date else None
                })

        # 7. Вывод
        conclusion = ""
        min_balance = min(f["running_balance"] for f in forecast) if forecast else current_balance

        if min_balance >= 0:
            months_sustainable = len([f for f in forecast if f["running_balance"] >= 0])
            conclusion = f"Денег хватит на {months_sustainable}+ месяцев"
        else:
            deficit_month = next(f for f in forecast if f["running_balance"] < 0)
            conclusion = f"ВНИМАНИЕ: В {deficit_month['month_name']} деньги закончатся! Нужно найти {-deficit_month['running_balance']:.0f}₽"

        return {
            "current_balance": current_balance,
            "expected_monthly_income": expected_monthly_income,
            "expected_monthly_expense": expected_monthly_expense,
            "forecast": forecast,
            "debtors": debtors,
            "hosts_alert": hosts_alert,
            "conclusion": conclusion,
            "participants_by_group": participants_by_group
        }
    finally:
        db.close()
