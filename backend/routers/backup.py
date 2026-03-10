"""
Роутер для бэкапов ViCRM
"""
import json
import os
import re
from datetime import datetime as dt
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from config import PROJECT_ROOT, BACKUP_DIR
from database import SessionLocal
from models.participant import Participant
from models.transaction import Income, Expense
from models.category import IncomeCategory, ExpenseCategory

router = APIRouter(prefix="/api/backup", tags=["Backup"])


@router.get("/export")
async def export_backup():
    """Экспорт всей базы данных в JSON"""
    db = SessionLocal()
    try:
        backup_data = {
            "exported_at": dt.now().isoformat(),
            "version": "1.0",
            "participants": [{
                "id": p.id,
                "name": p.name,
                "created_at": p.created_at.isoformat() if p.created_at else None
            } for p in db.query(Participant).all()],
            "income_categories": [{
                "id": c.id,
                "name": c.name
            } for c in db.query(IncomeCategory).all()],
            "expense_categories": [{
                "id": c.id,
                "name": c.name
            } for c in db.query(ExpenseCategory).all()],
            "incomes": [{
                "id": i.id,
                "participant_id": i.participant_id,
                "category_id": i.category_id,
                "amount": i.amount,
                "currency": i.currency,
                "description": i.description,
                "created_at": i.created_at.isoformat() if i.created_at else None
            } for i in db.query(Income).all()],
            "expenses": [{
                "id": e.id,
                "participant_id": e.participant_id,
                "category_id": e.category_id,
                "amount": e.amount,
                "currency": e.currency,
                "description": e.description,
                "created_at": e.created_at.isoformat() if e.created_at else None
            } for e in db.query(Expense).all()]
        }

        os.makedirs(BACKUP_DIR, exist_ok=True)
        timestamp = dt.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_{timestamp}.json"
        filepath = os.path.join(BACKUP_DIR, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)

        return FileResponse(
            filepath,
            media_type="application/json",
            filename=filename,
            background=None
        )
    finally:
        db.close()


@router.post("/import")
async def import_backup(backup_data: dict):
    """Импорт данных из JSON"""
    required_keys = ['version', 'participants', 'income_categories', 'expense_categories']
    for key in required_keys:
        if key not in backup_data:
            raise HTTPException(status_code=400, detail=f"Отсутствует обязательное поле: {key}")

    db = SessionLocal()
    try:
        # Очищаем базу (сначала удаляем зависимые записи)
        db.query(Income).delete()
        db.query(Expense).delete()
        db.query(IncomeCategory).delete()
        db.query(ExpenseCategory).delete()
        db.query(Participant).delete()

        # Восстанавливаем данные
        for p in backup_data.get('participants', []):
            db.add(Participant(id=p['id'], name=p['name'], created_at=p['created_at']))

        for c in backup_data.get('income_categories', []):
            db.add(IncomeCategory(id=c['id'], name=c['name']))

        for c in backup_data.get('expense_categories', []):
            db.add(ExpenseCategory(id=c['id'], name=c['name']))

        for i in backup_data.get('incomes', []):
            db.add(Income(
                id=i['id'],
                participant_id=i['participant_id'],
                category_id=i['category_id'],
                amount=i['amount'],
                currency=i.get('currency', 'RUB'),
                description=i.get('description'),
                created_at=i['created_at']
            ))

        for e in backup_data.get('expenses', []):
            db.add(Expense(
                id=e['id'],
                participant_id=e['participant_id'],
                category_id=e['category_id'],
                amount=e['amount'],
                currency=e.get('currency', 'RUB'),
                description=e.get('description'),
                created_at=e['created_at']
            ))

        db.commit()
        return {"success": True, "message": "Данные успешно восстановлены"}
    except Exception as ex:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Ошибка импорта: {str(ex)}")
    finally:
        db.close()


@router.get("/list")
async def list_backups():
    """Получить список файлов бэкапа"""
    if not os.path.exists(BACKUP_DIR):
        return []

    files = []
    for f in os.listdir(BACKUP_DIR):
        if f.endswith('.json'):
            filepath = os.path.join(BACKUP_DIR, f)
            stat = os.stat(filepath)
            files.append({
                "filename": f,
                "size": stat.st_size,
                "created": dt.fromtimestamp(stat.st_ctime).isoformat()
            })

    return sorted(files, key=lambda x: x['created'], reverse=True)


@router.delete("/{filename}")
async def delete_backup(filename: str):
    """Удалить файл бэкапа"""
    if not re.match(r'^backup_\d{8}_\d{6}\.json$', filename):
        raise HTTPException(status_code=400, detail="Неверное имя файла")

    filepath = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Файл не найден")

    os.remove(filepath)
    return {"success": True}
