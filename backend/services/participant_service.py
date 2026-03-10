"""
Сервис участников ViCRM
"""
from datetime import datetime
from sqlalchemy.orm import joinedload

from database import SessionLocal
from models.participant import Participant, MembershipHistory
from models.transaction import Income
from utils.logger import logger


def recalculate_participant_fields(db, participant: Participant):
    """
    Пересчитать total_paid, paid_until_month, balance для участника
    на основе всех его доходов (incomes)
    """
    if not participant.group or participant.group.monthly_fee <= 0:
        return

    current_month = datetime.now().strftime("%Y-%m")
    monthly_fee = participant.group.monthly_fee

    # Получаем все доходы участника, сортируем по дате
    incomes = db.query(Income).filter(
        Income.participant_id == participant.id
    ).order_by(Income.created_at).all()

    # Сбрасываем поля
    participant.total_paid = 0.0
    participant.balance = 0.0
    participant.paid_until_month = None

    if not incomes:
        return

    # Определяем первый месяц
    first_month = participant.start_date if participant.start_date else current_month

    # Обрабатываем каждый доход
    for income in incomes:
        amount = income.amount
        participant.total_paid += amount

        # Если paid_until_month ещё не установлен, начинаем с first_month
        if participant.paid_until_month is None:
            if first_month >= current_month:
                year, month = map(int, first_month.split('-'))
            else:
                year, month = map(int, current_month.split('-'))
        else:
            year, month = map(int, participant.paid_until_month.split('-'))

        # Рассчитываем сколько месяцев оплачено этим платежом
        months_paid = int(amount / monthly_fee)
        balance_copecks = amount % monthly_fee

        # Обновляем paid_until_month
        if months_paid > 0:
            for _ in range(months_paid):
                month += 1
                if month > 12:
                    month = 1
                    year += 1

            participant.paid_until_month = f"{year}-{month:02d}"
        elif amount > 0 and participant.paid_until_month is None:
            participant.paid_until_month = first_month

        # Обновляем баланс (копейки)
        participant.balance = balance_copecks


__all__ = ["recalculate_participant_fields"]
