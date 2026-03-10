"""
ViCRM API - главный файл приложения
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from config import APP_TITLE, APP_HOST, APP_PORT, ALLOWED_ORIGINS
from database import engine, Base, get_db
from models import (
    Participant, ParticipantGroup, MembershipHistory,
    Income, Expense, Contribution,
    IncomeCategory, ExpenseCategory,
    MonthlyExpense
)
from routers import (
    participants_router,
    groups_router,
    incomes_router,
    expenses_router,
    categories_router,
    contributions_router,
    forecast_router,
    backup_router
)
from utils.logger import logger

# === СОЗДАНИЕ ТАБЛИЦ БД ===
Base.metadata.create_all(bind=engine)

# === ИНИЦИАЛИЗАЦИЯ БД ===
def init_db():
    """Инициализация базы данных - категории + пересчёт участников"""
    from config import DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES
    from services.participant_service import recalculate_participant_fields

    db = next(get_db())
    try:
        # Категории доходов
        for cat_name in DEFAULT_INCOME_CATEGORIES:
            if not db.query(IncomeCategory).filter(IncomeCategory.name == cat_name).first():
                db.add(IncomeCategory(name=cat_name))

        # Категории расходов
        for cat_name in DEFAULT_EXPENSE_CATEGORIES:
            if not db.query(ExpenseCategory).filter(ExpenseCategory.name == cat_name).first():
                db.add(ExpenseCategory(name=cat_name))

        db.commit()
        logger.info("Категории инициализированы")

        # === ПЕРЕСЧЁТ ВСЕХ УЧАСТНИКОВ ===
        participants = db.query(Participant).all()
        recalculated = 0
        for p in participants:
            old_balance = p.balance
            recalculate_participant_fields(db, p)
            if p.balance != old_balance:
                recalculated += 1

        db.commit()
        logger.info(f"Пересчитано {recalculated} из {len(participants)} участников")
        logger.info("База данных успешно инициализирована")
    except Exception as e:
        logger.exception(f"Ошибка инициализации БД: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# === ПРИЛОЖЕНИЕ ===
app = FastAPI(title=APP_TITLE)

# CORS для React
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === MIDDLEWARE ДЛЯ ЛОГИРОВАНИЯ ЗАПРОСОВ ===
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    if request.url.path.startswith("/api"):
        skip_logging = (
            request.method == "GET" and
            response.status_code == 200 and
            any(endpoint in request.url.path for endpoint in [
                "/api/tags", "/api/participants",
                "/api/income_categories", "/api/expense_categories",
                "/api/transactions/tags/bulk"
            ])
        )

        if not skip_logging:
            log_level = logging.INFO
            if response.status_code >= 500:
                log_level = logging.ERROR
            elif response.status_code >= 400:
                log_level = logging.WARNING
            elif process_time > 1.0:
                log_level = logging.WARNING

            logger.log(log_level, f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")

    return response


# === ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ИСКЛЮЧЕНИЙ ===
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Необработанное исключение: {exc} | URL: {request.url} | Method: {request.method}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера", "type": type(exc).__name__}
    )


# === ПОДКЛЮЧЕНИЕ РОУТЕРОВ ===
app.include_router(participants_router)
app.include_router(groups_router)
app.include_router(incomes_router)
app.include_router(expenses_router)
app.include_router(categories_router)
app.include_router(contributions_router)
app.include_router(forecast_router)
app.include_router(backup_router)


# === API - СВОДКА ===
@app.get("/api/summary")
async def get_summary():
    """Получить сводку по финансам"""
    from sqlalchemy import select, func

    db = next(get_db())
    try:
        total_income = db.scalar(select(func.sum(Income.amount))) or 0
        total_expense = db.scalar(select(func.sum(Expense.amount))) or 0
        balance = total_income - total_expense

        participants_count = db.query(Participant).count()
        income_categories_count = db.query(IncomeCategory).count()
        expense_categories_count = db.query(ExpenseCategory).count()

        return {
            "balance": balance,
            "total_income": total_income,
            "total_expense": total_expense,
            "participants_count": participants_count,
            "income_categories_count": income_categories_count,
            "expense_categories_count": expense_categories_count
        }
    finally:
        db.close()


# === ЗАПУСК ===
if __name__ == "__main__":
    import uvicorn
    init_db()
    # log_level="warning" отключает логирование запросов Uvicorn (оставляет только ошибки)
    uvicorn.run(app, host=APP_HOST, port=APP_PORT, log_level="warning")
