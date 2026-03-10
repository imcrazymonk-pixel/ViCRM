"""
Сервисы ViCRM
"""
from services.participant_service import recalculate_participant_fields
from services.currency_service import get_currency_rate, init_currency_rates

__all__ = [
    "recalculate_participant_fields",
    "get_currency_rate",
    "init_currency_rates",
]
