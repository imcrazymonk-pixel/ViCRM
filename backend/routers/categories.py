"""
Роутер для работы с категориями ViCRM
"""
from fastapi import APIRouter, HTTPException

from database import SessionLocal
from models.category import IncomeCategory, ExpenseCategory
from schemas.category import CategoryBase, CategoryUpdate

router = APIRouter(prefix="/api", tags=["Categories"])


# === КАТЕГОРИИ ДОХОДОВ ===
@router.get("/income_categories")
async def get_income_categories():
    """Получить все категории доходов"""
    db = SessionLocal()
    try:
        categories = db.query(IncomeCategory).order_by(IncomeCategory.name).all()
        return [{
            "id": c.id,
            "name": c.name,
            "total_amount": sum(i.amount for i in c.incomes),
            "transactions_count": len(c.incomes)
        } for c in categories]
    finally:
        db.close()


@router.post("/income_categories")
async def create_income_category(category: CategoryBase):
    """Создать категорию доходов"""
    if not category.name or not category.name.strip():
        raise HTTPException(status_code=400, detail="Название не может быть пустым")

    db = SessionLocal()
    try:
        c = IncomeCategory(name=category.name.strip())
        db.add(c)
        db.commit()
        db.refresh(c)
        return {"id": c.id, "name": c.name}
    finally:
        db.close()


@router.put("/income_categories/{category_id}")
async def update_income_category(category_id: int, category: CategoryUpdate):
    """Обновить категорию доходов"""
    if not category.name or not category.name.strip():
        raise HTTPException(status_code=400, detail="Название не может быть пустым")

    db = SessionLocal()
    try:
        c = db.query(IncomeCategory).filter(IncomeCategory.id == category_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Категория не найдена")
        c.name = category.name.strip()
        db.commit()
        return {"id": c.id, "name": c.name}
    finally:
        db.close()


@router.delete("/income_categories/{category_id}")
async def delete_income_category(category_id: int):
    """Удалить категорию доходов"""
    db = SessionLocal()
    try:
        c = db.query(IncomeCategory).filter(IncomeCategory.id == category_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Категория не найдена")
        if c.incomes:
            raise HTTPException(status_code=400, detail=f"Используется в {len(c.incomes)} транзакциях")
        db.delete(c)
        db.commit()
        return {"success": True}
    finally:
        db.close()


# === КАТЕГОРИИ РАСХОДОВ ===
@router.get("/expense_categories")
async def get_expense_categories():
    """Получить все категории расходов"""
    db = SessionLocal()
    try:
        categories = db.query(ExpenseCategory).order_by(ExpenseCategory.name).all()
        return [{
            "id": c.id,
            "name": c.name,
            "total_amount": sum(e.amount for e in c.expenses),
            "transactions_count": len(c.expenses)
        } for c in categories]
    finally:
        db.close()


@router.post("/expense_categories")
async def create_expense_category(category: CategoryBase):
    """Создать категорию расходов"""
    if not category.name or not category.name.strip():
        raise HTTPException(status_code=400, detail="Название не может быть пустым")

    db = SessionLocal()
    try:
        c = ExpenseCategory(name=category.name.strip())
        db.add(c)
        db.commit()
        db.refresh(c)
        return {"id": c.id, "name": c.name}
    finally:
        db.close()


@router.put("/expense_categories/{category_id}")
async def update_expense_category(category_id: int, category: CategoryUpdate):
    """Обновить категорию расходов"""
    if not category.name or not category.name.strip():
        raise HTTPException(status_code=400, detail="Название не может быть пустым")

    db = SessionLocal()
    try:
        c = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Категория не найдена")
        c.name = category.name.strip()
        db.commit()
        return {"id": c.id, "name": c.name}
    finally:
        db.close()


@router.delete("/expense_categories/{category_id}")
async def delete_expense_category(category_id: int):
    """Удалить категорию расходов"""
    db = SessionLocal()
    try:
        c = db.query(ExpenseCategory).filter(ExpenseCategory.id == category_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Категория не найдена")
        if c.expenses:
            raise HTTPException(status_code=400, detail=f"Используется в {len(c.expenses)} транзакциях")
        db.delete(c)
        db.commit()
        return {"success": True}
    finally:
        db.close()
