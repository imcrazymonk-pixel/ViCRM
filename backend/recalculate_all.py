"""
Скрипт принудительного пересчёта всех участников
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models.participant import Participant
from services.participant_service import recalculate_participant_fields
from utils.logger import logger

def recalculate_all():
    db = SessionLocal()
    try:
        participants = db.query(Participant).all()
        logger.info(f"Найдено участников: {len(participants)}")
        print(f"Найдено участников: {len(participants)}")
        
        updated = 0
        for p in participants:
            old_balance = p.balance
            old_paid_until = p.paid_until_month
            
            recalculate_participant_fields(db, p)
            
            if p.balance != old_balance or p.paid_until_month != old_paid_until:
                updated += 1
                msg = f"{p.name}: balance={old_balance} -> {p.balance}, paid_until={old_paid_until} -> {p.paid_until_month}"
                logger.info(msg)
                print(msg)
            else:
                logger.info(f"  {p.name}: без изменений")
        
        db.commit()
        logger.info(f"\n=== Пересчитано: {updated} из {len(participants)} участников ===")
        print(f"\n=== Пересчитано: {updated} из {len(participants)} участников ===")
        
    except Exception as e:
        db.rollback()
        logger.exception(f"Ошибка пересчёта: {e}")
        print(f"Ошибка: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    recalculate_all()
