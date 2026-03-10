"""
Сервис участников ViCRM
"""
from datetime import datetime
from sqlalchemy.orm import joinedload

from database import SessionLocal
from models.participant import Participant, MembershipHistory
from models.transaction import Income
from utils.logger import logger


def _parse_month(month_str: str) -> tuple:
    """Разобрать строку месяца YYYY-MM в кортеж (year, month)"""
    if not month_str:
        return None
    parts = month_str.split('-')
    return (int(parts[0]), int(parts[1]))


def _months_between(start: str, end: str) -> int:
    """
    Посчитать количество месяцев между start и end включительно.
    Пример: март (2026-03) → май (2026-05) = 3 месяца (март, апрель, май)
    Если start == end, считаем как 1 месяц.
    """
    if not start or not end:
        return 0
    start_y, start_m = _parse_month(start)
    end_y, end_m = _parse_month(end)
    if not start_y or not end_y:
        return 0
    
    months = (end_y - start_y) * 12 + (end_m - start_m) + 1
    # Если даты равны, это всё равно 1 месяц
    return max(1, months)


def _add_months(year: int, month: int, months: int) -> tuple:
    """Добавить месяцы к дате, вернуть (year, month)"""
    total_months = month + months
    new_year = year + (total_months - 1) // 12
    new_month = (total_months - 1) % 12 + 1
    return (new_year, new_month)


def _count_pause_months(paused_from: str, paused_to: str, current_month: str) -> int:
    """
    Посчитать сколько месяцев паузы пересекается с периодом до current_month.
    """
    if not paused_from or not paused_to:
        return 0
    
    pause_start = _parse_month(paused_from)
    pause_end = _parse_month(paused_to)
    curr = _parse_month(current_month)
    
    if not pause_start or not pause_end or not curr:
        return 0
    
    # Если пауза ещё не началась
    if pause_start > curr:
        return 0
    
    # Считаем месяцы паузы до текущего месяца включительно
    end_month = min(pause_end, curr)
    return _months_between(paused_from, f"{end_month[0]}-{end_month[1]:02d}")


def recalculate_participant_fields(db, participant: Participant):
    """
    Пересчитать total_paid, paid_until_month, balance для участника

    Логика:
    1. total_paid = сумма всех доходов (всегда)
    2. amount_required = сколько должен заплатить за всё время (с учётом смены групп и пауз)
    3. balance = total_paid - amount_required (может быть отрицательным)
    4. paid_until_month = прогноз (до какого месяца хватило денег при текущей ставке)
    """
    current_month = datetime.now().strftime("%Y-%m")

    # 1. Складываем ВСЕ доходы — это total_paid
    incomes = db.query(Income).filter(
        Income.participant_id == participant.id
    ).all()
    total_amount = sum(income.amount for income in incomes)
    participant.total_paid = total_amount

    # 2. Если нет группы — весь баланс это аванс
    if not participant.group or participant.group.monthly_fee <= 0:
        participant.balance = total_amount
        participant.paid_until_month = None
        logger.info(
            f"Пересчёт для {participant.name} (без группы): "
            f"total_paid={participant.total_paid}, balance={participant.balance}"
        )
        return

    # 3. Считаем amount_required по истории членства в группах
    #    Важно: считаем только полные периоды + текущий активный период
    amount_required = 0.0
    
    memberships = db.query(MembershipHistory).filter(
        MembershipHistory.participant_id == participant.id
    ).order_by(MembershipHistory.joined_at).all()
    
    # Собираем уникальные периоды (без дублирования месяцев)
    # Сортируем по joined_at и берём только последнюю активную запись + предыдущие закрытые
    processed_months = set()  # Track months already counted
    
    for membership in memberships:
        group = membership.group
        if not group or group.monthly_fee <= 0:
            continue
        
        # Период в этой группе
        joined = membership.joined_at
        # Если left_at не указан, используем текущий месяц
        left = membership.left_at if membership.left_at else current_month
        
        # Генерируем список месяцев в этом периоде
        start_y, start_m = _parse_month(joined)
        end_y, end_m = _parse_month(left)
        
        if not start_y or not end_y:
            continue
        
        # Считаем месяцы, исключая уже учтённые
        months_in_group = 0
        current_y, current_m = start_y, start_m
        
        while (current_y < end_y) or (current_y == end_y and current_m <= end_m):
            month_key = f"{current_y}-{current_m:02d}"
            if month_key not in processed_months:
                processed_months.add(month_key)
                months_in_group += 1
            
            # Переходим к следующему месяцу
            current_m += 1
            if current_m > 12:
                current_m = 1
                current_y += 1
        
        # Вычитаем месяцы паузы
        if participant.paused_from and participant.paused_to:
            pause_start = _parse_month(participant.paused_from)
            pause_end = _parse_month(participant.paused_to)
            
            if pause_start and pause_end:
                pause_y, pause_m = pause_start
                while (pause_y < pause_end[0]) or (pause_y == pause_end[0] and pause_m <= pause_end[1]):
                    month_key = f"{pause_y}-{pause_m:02d}"
                    if month_key in processed_months:
                        processed_months.remove(month_key)
                        months_in_group -= 1
                    
                    pause_m += 1
                    if pause_m > 12:
                        pause_m = 1
                        pause_y += 1
        
        # Добавляем к общей сумме
        amount_required += months_in_group * group.monthly_fee
        
        logger.debug(
            f"  Группа '{group.name}': {months_in_group} мес. × {group.monthly_fee}₽ = {months_in_group * group.monthly_fee}₽"
        )

    # 4. Баланс = внёс - должен
    participant.balance = total_amount - amount_required

    # 5. paid_until_month = прогноз до какой даты хватило денег
    # Считаем от start_date сколько месяцев оплачено по текущей ставке
    monthly_fee = participant.group.monthly_fee
    start_date = participant.start_date if participant.start_date else current_month
    start_year, start_month = _parse_month(start_date)
    
    if monthly_fee > 0 and total_amount > 0:
        months_paid = int(total_amount / monthly_fee)
        if months_paid > 0:
            paid_year, paid_month = _add_months(start_year, start_month, months_paid - 1)
            participant.paid_until_month = f"{paid_year}-{paid_month:02d}"
        else:
            participant.paid_until_month = None
    else:
        participant.paid_until_month = None

    logger.info(
        f"Пересчёт для {participant.name}: "
        f"total_paid={total_amount}, amount_required={amount_required}, "
        f"balance={participant.balance}, paid_until={participant.paid_until_month}"
    )


__all__ = ["recalculate_participant_fields"]
