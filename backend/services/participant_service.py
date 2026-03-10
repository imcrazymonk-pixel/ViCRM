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
    на основе всех его доходов (incomes) с учётом группы (monthly_fee)
    
    Логика:
    1. Складываем ВСЕ платежи в общую сумму
    2. Если есть группа с monthly_fee > 0 — считаем месяцы
    3. Если группы нет — просто сбрасываем поля
    
    paid_until_month = ПОСЛЕДНИЙ оплаченный месяц (включительно)
    """
    current_month = datetime.now().strftime("%Y-%m")
    
    # Получаем все доходы участника
    incomes = db.query(Income).filter(
        Income.participant_id == participant.id
    ).all()

    # 1. Складываем ВСЕ платежи — это делаем всегда
    total_amount = sum(income.amount for income in incomes)
    participant.total_paid = total_amount

    # 2. Если нет группы или monthly_fee = 0 — сбрасываем поля
    if not participant.group or participant.group.monthly_fee <= 0:
        participant.balance = total_amount  # Весь баланс — это аванс
        participant.paid_until_month = None
        logger.info(
            f"Пересчёт для {participant.name} (без группы): "
            f"total_paid={participant.total_paid}, "
            f"balance={participant.balance}, "
            f"paid_until_month=NULL"
        )
        return

    # 3. Есть группа — считаем по monthly_fee
    monthly_fee = participant.group.monthly_fee

    # 3. Считаем сколько полных месяцев оплачено
    months_paid = int(total_amount / monthly_fee)

    # 4. Считаем остаток (баланс)
    balance = total_amount % monthly_fee
    participant.balance = balance

    # 4. Определяем первый месяц для отсчёта
    start_date = participant.start_date if participant.start_date else current_month

    # 5. Отсчитываем месяцы от start_date
    if months_paid > 0:
        # Начинаем отсчёт от start_date
        if start_date <= current_month:
            start_year, start_month = map(int, start_date.split('-'))
        else:
            start_year, start_month = map(int, current_month.split('-'))
        
        # Отсчитываем (months_paid - 1) месяцев вперёд
        # Т.к. первый месяц уже оплачен (start_date)
        for _ in range(months_paid - 1):
            start_month += 1
            if start_month > 12:
                start_month = 1
                start_year += 1

        # paid_until_month = ПОСЛЕДНИЙ оплаченный месяц
        participant.paid_until_month = f"{start_year}-{start_month:02d}"
    else:
        # Если не хватает на полный месяц — paid_until_month = NULL
        participant.paid_until_month = None

    logger.info(
        f"Пересчёт для {participant.name}: "
        f"total_paid={participant.total_paid}, "
        f"monthly_fee={monthly_fee}, "
        f"months_paid={months_paid}, "
        f"balance={participant.balance}, "
        f"paid_until_month={participant.paid_until_month}"
    )


__all__ = ["recalculate_participant_fields"]
