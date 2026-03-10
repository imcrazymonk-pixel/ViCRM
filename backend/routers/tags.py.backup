"""
Роутер для работы с тегами ViCRM
"""
from typing import Optional
from fastapi import APIRouter, HTTPException

from database import SessionLocal
from models.tag import Tag, TransactionTag
from models.transaction import Income, Expense
from schemas.tag import TagCreate, TagUpdate

router = APIRouter(prefix="/api/tags", tags=["Tags"])


@router.get("")
async def get_tags():
    """Получить все теги"""
    db = SessionLocal()
    try:
        tags = db.query(Tag).order_by(Tag.name).all()
        return [{
            "id": t.id,
            "name": t.name,
            "color": t.color,
            "transactions_count": db.query(TransactionTag).filter(TransactionTag.tag_id == t.id).count()
        } for t in tags]
    finally:
        db.close()


@router.post("")
async def create_tag(tag: TagCreate):
    """Создать тег"""
    if not tag.name or not tag.name.strip():
        raise HTTPException(status_code=400, detail="Название не может быть пустым")

    db = SessionLocal()
    try:
        existing = db.query(Tag).filter(Tag.name.ilike(tag.name.strip())).first()
        if existing:
            raise HTTPException(status_code=400, detail="Тег уже существует")

        t = Tag(name=tag.name.strip(), color=tag.color)
        db.add(t)
        db.commit()
        db.refresh(t)
        return {"id": t.id, "name": t.name, "color": t.color}
    finally:
        db.close()


@router.put("/{tag_id}")
async def update_tag(tag_id: int, update: TagUpdate):
    """Обновить тег"""
    db = SessionLocal()
    try:
        t = db.query(Tag).filter(Tag.id == tag_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Тег не найден")

        if update.name is not None:
            t.name = update.name.strip()
        if update.color is not None:
            t.color = update.color

        db.commit()
        db.refresh(t)
        return {"id": t.id, "name": t.name, "color": t.color}
    finally:
        db.close()


@router.delete("/{tag_id}")
async def delete_tag(tag_id: int):
    """Удалить тег"""
    db = SessionLocal()
    try:
        t = db.query(Tag).filter(Tag.id == tag_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Тег не найден")

        db.delete(t)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@router.get("/transactions/bulk")
async def get_all_transaction_tags():
    """Получить все теги для всех транзакций одним запросом"""
    db = SessionLocal()
    try:
        all_tags = db.query(TransactionTag).join(Tag).all()

        result = {"income": {}, "expense": {}}
        for tt in all_tags:
            key = str(tt.transaction_id)
            if key not in result[tt.transaction_type]:
                result[tt.transaction_type][key] = []
            result[tt.transaction_type][key].append({
                "id": tt.tag.id,
                "name": tt.tag.name,
                "color": tt.tag.color
            })

        return result
    finally:
        db.close()


@router.get("/transactions/{tag_id}")
async def get_transactions_by_tag(tag_id: int):
    """Получить транзакции по тегу"""
    db = SessionLocal()
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Тег не найден")

        transaction_tags = db.query(TransactionTag).filter(TransactionTag.tag_id == tag_id).all()

        results = []
        for tt in transaction_tags:
            if tt.transaction_type == 'income':
                t = db.query(Income).filter(Income.id == tt.transaction_id).first()
                if t:
                    results.append({
                        "id": t.id,
                        "type": "income",
                        "participant_name": t.participant.name,
                        "category_name": t.category.name,
                        "amount": t.amount,
                        "currency": t.currency,
                        "description": t.description,
                        "created_at": t.created_at.isoformat() if t.created_at else None
                    })
            else:
                t = db.query(Expense).filter(Expense.id == tt.transaction_id).first()
                if t:
                    results.append({
                        "id": t.id,
                        "type": "expense",
                        "participant_name": t.participant.name,
                        "category_name": t.category.name,
                        "amount": t.amount,
                        "currency": t.currency,
                        "description": t.description,
                        "created_at": t.created_at.isoformat() if t.created_at else None
                    })

        return results
    finally:
        db.close()


@router.post("/transactions/{transaction_type}/{transaction_id}/tags")
async def add_tag_to_transaction(transaction_type: str, transaction_id: int, tag_id: int):
    """Добавить тег к транзакции"""
    if transaction_type not in ['income', 'expense']:
        raise HTTPException(status_code=400, detail="Неверный тип транзакции")

    db = SessionLocal()
    try:
        if transaction_type == 'income':
            t = db.query(Income).filter(Income.id == transaction_id).first()
        else:
            t = db.query(Expense).filter(Expense.id == transaction_id).first()

        if not t:
            raise HTTPException(status_code=404, detail="Транзакция не найдена")

        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Тег не найден")

        existing = db.query(TransactionTag).filter(
            TransactionTag.transaction_id == transaction_id,
            TransactionTag.transaction_type == transaction_type,
            TransactionTag.tag_id == tag_id
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Тег уже добавлен")

        tt = TransactionTag(
            transaction_id=transaction_id,
            transaction_type=transaction_type,
            tag_id=tag_id
        )
        db.add(tt)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@router.delete("/transactions/{transaction_type}/{transaction_id}/tags/{tag_id}")
async def remove_tag_from_transaction(transaction_type: str, transaction_id: int, tag_id: int):
    """Удалить тег из транзакции"""
    db = SessionLocal()
    try:
        tt = db.query(TransactionTag).filter(
            TransactionTag.transaction_id == transaction_id,
            TransactionTag.transaction_type == transaction_type,
            TransactionTag.tag_id == tag_id
        ).first()

        if not tt:
            raise HTTPException(status_code=404, detail="Тег не найден")

        db.delete(tt)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@router.get("/transactions/{transaction_type}/{transaction_id}/tags")
async def get_tags_for_transaction(transaction_type: str, transaction_id: int):
    """Получить теги транзакции"""
    db = SessionLocal()
    try:
        transaction_tags = db.query(TransactionTag).filter(
            TransactionTag.transaction_id == transaction_id,
            TransactionTag.transaction_type == transaction_type
        ).all()

        return [{
            "id": tt.tag.id,
            "name": tt.tag.name,
            "color": tt.tag.color
        } for tt in transaction_tags]
    finally:
        db.close()
