from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text, func, select, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime, timedelta
from typing import Optional, List
from pydantic import BaseModel
import json
import logging
from logging.handlers import RotatingFileHandler
import os
import time

# === НАСТРОЙКА ЛОГИРОВАНИЯ ===
# Логи пишем в корневую папку logs/
LOGS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

def setup_logger(name: str, log_file: str, level=logging.INFO):
    """Создаёт логгер с ротацией файлов и выводом в консоль"""
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    if logger.handlers:
        return logger
    
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    file_handler = RotatingFileHandler(
        os.path.join(LOGS_DIR, log_file),
        maxBytes=10*1024*1024,
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger

logger = setup_logger("backend", "backend.log", level=logging.INFO)

app = FastAPI(title="ViCRM API")

# CORS для React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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

    # Логгируем все запросы к API (кроме успешных GET запросов к статичным данным)
    if request.url.path.startswith("/api"):
        # Не логируем успешные GET запросы к спискам (теги, категории, участники)
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

# === БАЗА ДАННЫХ ===
# Путь к БД относительно корня проекта (папка data/)
# Используем абсолютный путь
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_PATH = os.path.join(PROJECT_ROOT, "data", "ViCRM.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# === МОДЕЛИ ===
class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    group_id = Column(Integer, ForeignKey("participant_groups.id"), nullable=True)  # Группа контрагента
    start_date = Column(String(7), nullable=True)  # 🆕 "2026-07" - с какого месяца пользуется
    is_active = Column(Boolean, default=True)  # 🆕 Активен ли сейчас
    total_paid = Column(Float, default=0.0)  # Общая сумма взносов (для быстрого доступа)
    paid_until_month = Column(String(7), nullable=True)  # "2026-05" - до какого месяца оплачено
    balance = Column(Float, default=0.0)  # 🆕 Персональный баланс (+ аванс, - долг)
    created_at = Column(DateTime, default=datetime.now)

    group = relationship("ParticipantGroup", back_populates="participants")
    incomes = relationship("Income", back_populates="participant", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="participant", cascade="all, delete-orphan")
    contributions = relationship("Contribution", back_populates="participant", cascade="all, delete-orphan")
    membership_history = relationship("MembershipHistory", back_populates="participant", cascade="all, delete-orphan")


class ParticipantGroup(Base):
    __tablename__ = "participant_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # "VPN участники", "Хосты"
    group_type = Column(String(20), default="contribution")  # "contribution" (с них берём) или "expense" (им платим)
    monthly_fee = Column(Float, default=0.0)  # Обязательный платёж в месяц
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    auto_create_contributions = Column(Boolean, default=True)  # Создавать обязательства автоматически
    created_at = Column(DateTime, default=datetime.now)

    participants = relationship("Participant", back_populates="group")


class MembershipHistory(Base):
    """🆕 История членства в группах"""
    __tablename__ = "membership_history"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("participant_groups.id"), nullable=False)
    joined_at = Column(String(7), nullable=False)  # "2026-03" - когда вступил
    left_at = Column(String(7), nullable=True)  # "2026-06" - когда вышел (NULL = ещё в группе)
    reason = Column(Text, nullable=True)  # Причина выхода/смены
    created_at = Column(DateTime, default=datetime.now)

    participant = relationship("Participant", back_populates="membership_history")
    group = relationship("ParticipantGroup")


class MonthlyExpense(Base):
    __tablename__ = "monthly_expenses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # "Хостинг Selectel"
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=True)  # Привязка к контрагенту (хосту)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=True)
    amount = Column(Float, nullable=False)  # Сумма в месяц
    day_of_month = Column(Integer, default=1)  # Когда платить (1-31)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    last_paid_month = Column(String(7), nullable=True)  # "2026-03" - последний оплаченный месяц
    next_due_date = Column(DateTime, nullable=True)  # Когда следующий платёж
    created_at = Column(DateTime, default=datetime.now)

    participant = relationship("Participant")
    category = relationship("ExpenseCategory")

class IncomeCategory(Base):
    __tablename__ = "income_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    incomes = relationship("Income", back_populates="category")

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    expenses = relationship("Expense", back_populates="category")


class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency_code = Column(String(3), nullable=False)  # USD, EUR, RUB
    rate_to_base = Column(Float, nullable=False)  # Курс к базовой валюте (RUB)
    date = Column(DateTime, default=datetime.now)
    created_at = Column(DateTime, default=datetime.now)


# Обновляем модели транзакций для поддержки валюты
class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("income_categories.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='RUB')  # RUB, USD, EUR
    amount_base = Column(Float, nullable=True)  # Сумма в базовой валюте
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now, index=True)

    participant = relationship("Participant", back_populates="incomes")
    category = relationship("IncomeCategory", back_populates="incomes")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='RUB')  # RUB, USD, EUR
    amount_base = Column(Float, nullable=True)  # Сумма в базовой валюте
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.now, index=True)

    participant = relationship("Participant", back_populates="expenses")
    category = relationship("ExpenseCategory", back_populates="expenses")


class TransactionTemplate(Base):
    __tablename__ = "transaction_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    template_type = Column(String(10), nullable=False)  # 'income' или 'expense'
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    category_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='RUB')
    description = Column(Text, nullable=True)
    interval_days = Column(Integer, default=30)  # Интервал в днях
    is_active = Column(Boolean, default=True)
    last_created = Column(DateTime, nullable=True)
    next_due = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.now)

    participant = relationship("Participant")


class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True)
    color = Column(String(7), default='#8b5cf6')  # HEX цвет
    created_at = Column(DateTime, default=datetime.now)


class TransactionTag(Base):
    __tablename__ = "transaction_tags"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, nullable=False)
    transaction_type = Column(String(10), nullable=False)  # 'income' или 'expense'
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    tag = relationship("Tag")


class Contribution(Base):
    __tablename__ = "contributions"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"), nullable=False)
    month = Column(String(7), nullable=False, index=True)  # "2026-03"
    amount_required = Column(Float, nullable=False)  # Сколько должен
    amount_paid = Column(Float, default=0.0)  # Сколько внёс
    status = Column(String(20), default="owed")  # "paid", "partial", "owed"
    comment = Column(Text, nullable=True)
    is_advance = Column(Boolean, default=False)  # Это аванс за будущий месяц?
    paid_at = Column(DateTime, nullable=True)  # Когда именно оплатил
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    participant = relationship("Participant")


# Создаём таблицы
Base.metadata.create_all(bind=engine)

# === PYDANTIC МОДЕЛИ ===
class ParticipantBase(BaseModel):
    name: str

class ParticipantCreate(ParticipantBase):
    group_id: Optional[int] = None
    start_date: Optional[str] = None  # 🆕 "2026-07"
    is_active: Optional[bool] = True  # 🆕

class ParticipantUpdate(ParticipantBase):
    group_id: Optional[int] = None
    start_date: Optional[str] = None  # 🆕
    is_active: Optional[bool] = None  # 🆕
    balance: Optional[float] = None  # 🆕

class MembershipHistoryBase(BaseModel):
    participant_id: int
    group_id: int
    joined_at: str  # "2026-03"
    left_at: Optional[str] = None  # "2026-06" или None
    reason: Optional[str] = None

class MembershipHistoryCreate(MembershipHistoryBase):
    pass

class MembershipHistoryUpdate(BaseModel):
    left_at: Optional[str] = None
    reason: Optional[str] = None

class ParticipantGroupBase(BaseModel):
    name: str
    group_type: str = "contribution"  # "contribution" или "expense"
    monthly_fee: float = 0.0
    description: Optional[str] = None
    is_active: bool = True
    auto_create_contributions: bool = True

class ParticipantGroupCreate(ParticipantGroupBase):
    pass

class ParticipantGroupUpdate(BaseModel):
    name: Optional[str] = None
    group_type: Optional[str] = None
    monthly_fee: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    auto_create_contributions: Optional[bool] = None

class MonthlyExpenseBase(BaseModel):
    name: str
    participant_id: Optional[int] = None
    category_id: Optional[int] = None
    amount: float
    day_of_month: int = 1
    description: Optional[str] = None
    is_active: bool = True

class MonthlyExpenseCreate(MonthlyExpenseBase):
    pass

class MonthlyExpenseUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    day_of_month: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    last_paid_month: Optional[str] = None

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class TransactionBase(BaseModel):
    participant_id: int
    category_id: int
    amount: float
    currency: str = 'RUB'
    description: Optional[str] = None
    created_at: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionTemplateBase(BaseModel):
    name: str
    template_type: str
    participant_id: int
    category_id: int
    amount: float
    currency: str = 'RUB'
    description: Optional[str] = None
    interval_days: int = 30

class TransactionTemplateCreate(TransactionTemplateBase):
    pass

class TransactionTemplateUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    interval_days: Optional[int] = None

class TagBase(BaseModel):
    name: str
    color: str = '#8b5cf6'

class TagCreate(TagBase):
    pass

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

# === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_default_categories(db):
    default_income_cats = ["Взнос участника", "Пожертвование", "Прибыль", "Другое"]
    default_expense_cats = ["Сервер", "Хостинг", "Услуги", "Реклама", "Налоги", "Другое"]

    for cat_name in default_income_cats:
        if not db.query(IncomeCategory).filter(IncomeCategory.name == cat_name).first():
            db.add(IncomeCategory(name=cat_name))

    for cat_name in default_expense_cats:
        if not db.query(ExpenseCategory).filter(ExpenseCategory.name == cat_name).first():
            db.add(ExpenseCategory(name=cat_name))

    db.commit()

def _recalculate_participant_fields(db, participant: Participant):
    """
    🆕 Пересчитать total_paid, paid_until_month, balance для участника
    на основе всех его доходов (incomes)
    """
    from datetime import datetime
    
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
        
        # Обновляем баланс (последний платёж определяет баланс)
        participant.balance = balance_copecks

def get_currency_rate(db, currency):
    """Получить курс валюты к RUB"""
    if currency == 'RUB':
        return 1.0
    
    rate = db.query(CurrencyRate).filter(
        CurrencyRate.currency_code == currency
    ).order_by(CurrencyRate.date.desc()).first()
    
    if rate:
        return rate.rate_to_base
    
    # Курсы по умолчанию
    default_rates = {'USD': 90.0, 'EUR': 97.0, 'RUB': 1.0}
    return default_rates.get(currency, 1.0)

def init_db():
    db = SessionLocal()
    try:
        logger.info("Инициализация базы данных...")
        get_default_categories(db)

        # Инициализация курсов валют
        default_rates = [
            ('RUB', 1.0),
            ('USD', 90.0),
            ('EUR', 97.0)
        ]
        for code, rate in default_rates:
            existing = db.query(CurrencyRate).filter(CurrencyRate.currency_code == code).first()
            if not existing:
                db.add(CurrencyRate(currency_code=code, rate_to_base=rate))
                logger.info(f"Добавлен курс валюты {code}: {rate}")

        # === МИГРАЦИЯ: Добавляем новые поля в таблицу participants ===
        from sqlalchemy import text
        try:
            db.execute(text("ALTER TABLE participants ADD COLUMN group_id INTEGER"))
            logger.info("Добавлена колонка group_id в participants")
        except Exception:
            pass

        try:
            db.execute(text("ALTER TABLE participants ADD COLUMN total_paid FLOAT DEFAULT 0"))
            logger.info("Добавлена колонка total_paid в participants")
        except Exception:
            pass

        try:
            db.execute(text("ALTER TABLE participants ADD COLUMN paid_until_month VARCHAR(7)"))
            logger.info("Добавлена колонка paid_until_month в participants")
        except Exception:
            pass

        # 🆕 Новые поля для версии 2.0
        try:
            db.execute(text("ALTER TABLE participants ADD COLUMN start_date VARCHAR(7)"))
            logger.info("Добавлена колонка start_date в participants")
        except Exception:
            pass

        try:
            db.execute(text("ALTER TABLE participants ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            logger.info("Добавлена колонка is_active в participants")
        except Exception:
            pass

        try:
            db.execute(text("ALTER TABLE participants ADD COLUMN balance FLOAT DEFAULT 0"))
            logger.info("Добавлена колонка balance в participants")
        except Exception:
            pass

        # 🆕 Создаём таблицу membership_history
        try:
            db.execute(text("""
                CREATE TABLE IF NOT EXISTS membership_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    participant_id INTEGER NOT NULL,
                    group_id INTEGER NOT NULL,
                    joined_at VARCHAR(7) NOT NULL,
                    left_at VARCHAR(7),
                    reason TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (participant_id) REFERENCES participants(id),
                    FOREIGN KEY (group_id) REFERENCES participant_groups(id)
                )
            """))
            logger.info("Создана таблица membership_history")
        except Exception as e:
            logger.info(f"Таблица membership_history уже существует или ошибка: {e}")

        db.commit()

        logger.info("База данных успешно инициализирована")
    except Exception as e:
        logger.exception(f"Ошибка инициализации БД: {e}")
        db.rollback()
        raise
    finally:
        db.close()

init_db()

# === API - СВОДКА ===
@app.get("/api/summary")
async def get_summary():
    db = SessionLocal()
    try:
        # Используем суммы в базовой валюте
        total_income = db.scalar(select(func.sum(Income.amount_base))) or 0
        total_expense = db.scalar(select(func.sum(Expense.amount_base))) or 0
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

# === API - УЧАСТНИКИ ===
@app.get("/api/participants")
async def get_participants():
    db = SessionLocal()
    try:
        participants = db.query(Participant).order_by(Participant.name).all()
        return [{
            "id": p.id,
            "name": p.name,
            "group_id": p.group_id,
            "group_name": p.group.name if p.group else None,
            "group_monthly_fee": p.group.monthly_fee if p.group else None,
            "start_date": p.start_date,
            "is_active": p.is_active,
            "balance": p.balance,
            "total_paid": p.total_paid,
            "paid_until_month": p.paid_until_month,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "total_incomes": sum(i.amount for i in p.incomes),
            "total_expenses": sum(e.amount for e in p.expenses),
            "incomes_count": len(p.incomes),
            "expenses_count": len(p.expenses)
        } for p in participants]
    finally:
        db.close()

@app.post("/api/participants")
async def create_participant(participant: ParticipantCreate, allow_duplicate: bool = False):
    if not participant.name or not participant.name.strip():
        raise HTTPException(status_code=400, detail="Имя не может быть пустым")

    db = SessionLocal()
    try:
        # Проверка на дубликат
        existing = db.query(Participant).filter(
            func.lower(Participant.name) == func.lower(participant.name.strip())
        ).first()

        if existing and not allow_duplicate:
            raise HTTPException(
                status_code=400,
                detail=f"Участник с именем '{participant.name.strip()}' уже существует (ID: {existing.id})",
                headers={"X-DUPLICATE-ID": str(existing.id)}
            )

        if existing and allow_duplicate:
            return {"id": existing.id, "name": existing.name, "duplicate": True}

        # 🆕 Определяем start_date (по умолчанию текущий месяц)
        if participant.start_date:
            start_date = participant.start_date
        else:
            start_date = datetime.now().strftime("%Y-%m")

        p = Participant(
            name=participant.name.strip(),
            group_id=participant.group_id,
            start_date=start_date,
            is_active=participant.is_active if participant.is_active is not None else True
        )
        db.add(p)
        db.commit()
        db.refresh(p)

        # 🆕 Если указана группа, создаём запись в MembershipHistory
        if participant.group_id:
            membership = MembershipHistory(
                participant_id=p.id,
                group_id=participant.group_id,
                joined_at=start_date,
                left_at=None,
                reason=None
            )
            db.add(membership)
            db.commit()

        return {"id": p.id, "name": p.name, "start_date": p.start_date, "is_active": p.is_active}
    finally:
        db.close()

@app.put("/api/participants/{participant_id}")
async def update_participant(participant_id: int, participant: ParticipantUpdate):
    if not participant.name or not participant.name.strip():
        raise HTTPException(status_code=400, detail="Имя не может быть пустым")

    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")
        
        p.name = participant.name.strip()
        
        # 🆕 Обновляем группу с записью в историю
        if participant.group_id is not None and participant.group_id != p.group_id:
            old_group_id = p.group_id
            # Если была группа, закрываем запись
            if old_group_id:
                current_month = datetime.now().strftime("%Y-%m")
                # Ищем активную запись в истории
                active_membership = db.query(MembershipHistory).filter(
                    MembershipHistory.participant_id == participant_id,
                    MembershipHistory.group_id == old_group_id,
                    MembershipHistory.left_at == None
                ).first()
                if active_membership:
                    active_membership.left_at = current_month
                    active_membership.reason = "Смена группы"
            
            # Создаём новую запись для новой группы
            if participant.group_id:
                new_membership = MembershipHistory(
                    participant_id=participant_id,
                    group_id=participant.group_id,
                    joined_at=datetime.now().strftime("%Y-%m"),
                    left_at=None,
                    reason=None
                )
                db.add(new_membership)
            
            p.group_id = participant.group_id
        
        # 🆕 Обновляем start_date
        if participant.start_date is not None:
            p.start_date = participant.start_date
        
        # 🆕 Обновляем is_active
        if participant.is_active is not None:
            p.is_active = participant.is_active
        
        # 🆕 Обновляем баланс
        if participant.balance is not None:
            p.balance = participant.balance
        
        db.commit()
        return {"id": p.id, "name": p.name, "start_date": p.start_date, "is_active": p.is_active}
    finally:
        db.close()

@app.delete("/api/participants/{participant_id}")
async def delete_participant(participant_id: int):
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")
        if p.incomes or p.expenses:
            raise HTTPException(status_code=400, detail=f"Есть транзакции: {len(p.incomes)} доходов, {len(p.expenses)} расходов")
        db.delete(p)
        db.commit()
        return {"success": True}
    finally:
        db.close()


# 🆕 НОВЫЕ ENDPOINTS ДЛЯ УПРАВЛЕНИЯ УЧАСТНИКАМИ

@app.post("/api/participants/{participant_id}/activate")
async def activate_participant(participant_id: int, group_id: int, start_date: str):
    """🆕 Активировать участника в группе"""
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")
        
        group = db.query(ParticipantGroup).filter(ParticipantGroup.id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        
        # Активируем
        p.is_active = True
        p.group_id = group_id
        
        # Если start_date не указан, используем текущий месяц
        if not start_date:
            start_date = datetime.now().strftime("%Y-%m")
        p.start_date = start_date
        
        # Создаём запись в MembershipHistory
        membership = MembershipHistory(
            participant_id=participant_id,
            group_id=group_id,
            joined_at=start_date,
            left_at=None,
            reason="Активация"
        )
        db.add(membership)
        
        db.commit()
        return {"success": True, "participant_id": participant_id, "group_id": group_id, "start_date": start_date}
    finally:
        db.close()


@app.post("/api/participants/{participant_id}/deactivate")
async def deactivate_participant(participant_id: int, reason: Optional[str] = None):
    """🆕 Деактивировать участника с сохранением баланса"""
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")
        
        current_month = datetime.now().strftime("%Y-%m")
        
        # Если был в группе, закрываем запись в истории
        if p.group_id:
            active_membership = db.query(MembershipHistory).filter(
                MembershipHistory.participant_id == participant_id,
                MembershipHistory.group_id == p.group_id,
                MembershipHistory.left_at == None
            ).first()
            if active_membership:
                active_membership.left_at = current_month
                active_membership.reason = reason or "Деактивация"
        
        # Возвращаем последний месяц в баланс (если не использован)
        if p.paid_until_month and p.paid_until_month >= current_month:
            if p.group and p.group.monthly_fee > 0:
                p.balance += p.group.monthly_fee
                # Уменьшаем paid_until_month на месяц
                year, month = map(int, p.paid_until_month.split('-'))
                if month == 1:
                    p.paid_until_month = f"{year-1}-12"
                else:
                    p.paid_until_month = f"{year}-{month-1:02d}"
        
        # Деактивируем
        p.is_active = False
        old_group_id = p.group_id
        p.group_id = None  # Выход из группы
        
        db.commit()
        return {
            "success": True,
            "participant_id": participant_id,
            "balance": p.balance,
            "old_group_id": old_group_id
        }
    finally:
        db.close()


@app.post("/api/participants/{participant_id}/change-group")
async def change_participant_group(participant_id: int, group_id: int, reason: Optional[str] = None):
    """
    🆕 Сменить группу участнику с пересчётом баланса
    Конвертирует оплаченные месяцы по старому тарифу в новый
    """
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")

        new_group = db.query(ParticipantGroup).filter(ParticipantGroup.id == group_id).first()
        if not new_group:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        
        if new_group.monthly_fee <= 0:
            raise HTTPException(status_code=400, detail="Ежемесячный платёж в группе должен быть > 0")

        old_group_id = p.group_id
        old_group = db.query(ParticipantGroup).filter(ParticipantGroup.id == old_group_id).first() if old_group_id else None
        
        current_month = datetime.now().strftime("%Y-%m")

        # 🆕 1. Находим остаток оплаченных месяцев
        remaining_months = 0
        if p.paid_until_month and p.paid_until_month >= current_month:
            paid_year, paid_month = map(int, p.paid_until_month.split('-'))
            curr_year, curr_month = map(int, current_month.split('-'))
            remaining_months = (paid_year - curr_year) * 12 + (paid_month - curr_month)

        # 🆕 2. Конвертируем в рубли по старому тарифу
        balance_in_rubles = 0.0
        if old_group and old_group.monthly_fee > 0:
            balance_in_rubles = remaining_months * old_group.monthly_fee + p.balance

        # 🆕 3. Конвертируем в месяцы по новому тарифу
        new_remaining_months = int(balance_in_rubles / new_group.monthly_fee)
        new_balance = balance_in_rubles % new_group.monthly_fee

        # 🆕 4. Обновляем paid_until_month
        if new_remaining_months > 0:
            curr_year, curr_month = map(int, current_month.split('-'))
            # Начинаем отсчёт с текущего месяца
            total_months = curr_month + new_remaining_months - 1
            new_year = curr_year + (total_months - 1) // 12
            new_month = (total_months - 1) % 12 + 1
            p.paid_until_month = f"{new_year}-{new_month:02d}"
        else:
            p.paid_until_month = None

        # 🆕 5. Обновляем группу и баланс
        p.group_id = group_id
        p.balance = new_balance

        # 🆕 6. Создаём запись в MembershipHistory
        if old_group_id:
            # Закрываем старую запись
            active_membership = db.query(MembershipHistory).filter(
                MembershipHistory.participant_id == participant_id,
                MembershipHistory.group_id == old_group_id,
                MembershipHistory.left_at == None
            ).first()
            if active_membership:
                active_membership.left_at = current_month
                active_membership.reason = reason or f"Смена группы (было: {old_group.name})"

        # Создаём новую запись
        new_membership = MembershipHistory(
            participant_id=participant_id,
            group_id=group_id,
            joined_at=current_month,
            left_at=None,
            reason=reason or f"Смена группы (стало: {new_group.name})"
        )
        db.add(new_membership)

        db.commit()
        
        return {
            "success": True,
            "participant_id": participant_id,
            "old_group_id": old_group_id,
            "new_group_id": group_id,
            "balance_in_rubles": balance_in_rubles,
            "new_remaining_months": new_remaining_months,
            "new_balance": new_balance,
            "new_paid_until_month": p.paid_until_month
        }
    finally:
        db.close()


@app.get("/api/membership-history")
async def get_membership_history(participant_id: Optional[int] = None):
    """🆕 Получить историю членства в группах"""
    db = SessionLocal()
    try:
        query = db.query(MembershipHistory).order_by(MembershipHistory.created_at.desc())
        if participant_id:
            query = query.filter(MembershipHistory.participant_id == participant_id)
        
        history = query.all()
        return [{
            "id": h.id,
            "participant_id": h.participant_id,
            "participant_name": h.participant.name if h.participant else None,
            "group_id": h.group_id,
            "group_name": h.group.name if h.group else None,
            "joined_at": h.joined_at,
            "left_at": h.left_at,
            "reason": h.reason,
            "created_at": h.created_at.isoformat() if h.created_at else None
        } for h in history]
    finally:
        db.close()


@app.get("/api/participants/{participant_id}/balance")
async def get_participant_balance(participant_id: int):
    """🆕 Получить детальный баланс участника"""
    db = SessionLocal()
    try:
        p = db.query(Participant).filter(Participant.id == participant_id).first()
        if not p:
            raise HTTPException(status_code=404, detail="Участник не найден")
        
        current_month = datetime.now().strftime("%Y-%m")
        
        # Считаем сколько должен был внести с момента начала
        if p.start_date:
            start_year, start_month = map(int, p.start_date.split('-'))
            curr_year, curr_month = map(int, current_month.split('-'))
            months_since_start = (curr_year - start_year) * 12 + (curr_month - start_month) + 1
        else:
            months_since_start = 0

        # Сколько должен был внести
        should_have_paid = 0
        if p.group and p.group.monthly_fee > 0:
            should_have_paid = months_since_start * p.group.monthly_fee

        # Следующий месяц платежа
        if p.paid_until_month:
            year, month = map(int, p.paid_until_month.split('-'))
            if month == 12:
                next_payment_month = f"{year+1}-01"
            else:
                next_payment_month = f"{year}-{month+1:02d}"
        else:
            next_payment_month = current_month

        return {
            "participant_id": participant_id,
            "name": p.name,
            "total_paid": p.total_paid,
            "should_have_paid": should_have_paid,
            "balance": p.balance,
            "paid_until_month": p.paid_until_month,
            "next_payment_month": next_payment_month,
            "is_active": p.is_active,
            "group_name": p.group.name if p.group else None,
            "monthly_fee": p.group.monthly_fee if p.group else 0
        }
    finally:
        db.close()


# === API - КАТЕГОРИИ ДОХОДОВ ===
@app.get("/api/income_categories")
async def get_income_categories():
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

@app.post("/api/income_categories")
async def create_income_category(category: CategoryBase):
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

@app.put("/api/income_categories/{category_id}")
async def update_income_category(category_id: int, category: CategoryUpdate):
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

@app.delete("/api/income_categories/{category_id}")
async def delete_income_category(category_id: int):
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

# === API - КАТЕГОРИИ РАСХОДОВ ===
@app.get("/api/expense_categories")
async def get_expense_categories():
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

@app.post("/api/expense_categories")
async def create_expense_category(category: CategoryBase):
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

@app.put("/api/expense_categories/{category_id}")
async def update_expense_category(category_id: int, category: CategoryUpdate):
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

@app.delete("/api/expense_categories/{category_id}")
async def delete_expense_category(category_id: int):
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

# === API - ТРАНЗАКЦИИ ===
@app.get("/api/incomes")
async def get_incomes():
    db = SessionLocal()
    try:
        incomes = db.query(Income).order_by(Income.created_at.desc()).all()
        return [{
            "id": i.id,
            "participant_id": i.participant_id,
            "participant_name": i.participant.name,
            "category_id": i.category_id,
            "category_name": i.category.name,
            "amount": i.amount,
            "currency": i.currency,
            "amount_base": i.amount_base,
            "description": i.description,
            "created_at": i.created_at.isoformat() if i.created_at else None
        } for i in incomes]
    finally:
        db.close()

@app.post("/api/incomes")
async def create_income(transaction: TransactionCreate):
    """
    🆕 Создать доход с учётом start_date и приоритета погашения долгов
    🛡️ Защита от дублирования (проверка идентичного платежа за последние 5 секунд)
    """
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        # 🛡️ Проверка на дубликат (идентичный платёж за последние 5 секунд)
        if transaction.created_at:
            from datetime import timedelta
            five_seconds_ago = datetime.now() - timedelta(seconds=5)
            duplicate = db.query(Income).filter(
                Income.participant_id == transaction.participant_id,
                Income.category_id == transaction.category_id,
                Income.amount == transaction.amount,
                Income.description == (transaction.description or ''),
                Income.created_at >= five_seconds_ago
            ).first()
            
            if duplicate:
                logger.info(f"Обнаружен дубликат платежа: participant_id={transaction.participant_id}, amount={transaction.amount}")
                raise HTTPException(
                    status_code=400, 
                    detail="Этот платёж уже был внесён несколько секунд назад. Возможно, вы нажали кнопку дважды."
                )
        
        rate = get_currency_rate(db, transaction.currency)
        t = Income(
            participant_id=transaction.participant_id,
            category_id=transaction.category_id,
            amount=transaction.amount,
            currency=transaction.currency,
            amount_base=transaction.amount * rate,
            description=transaction.description,
            created_at=transaction.created_at or datetime.now()
        )
        db.add(t)

        # === 🆕 АВТОМАТИЧЕСКОЕ РАСПРЕДЕЛЕНИЕ ПО МЕСЯЦАМ (ВЕРСИЯ 2.0) ===
        # Если это взнос участника из группы с monthly_fee
        participant = db.query(Participant).filter(Participant.id == transaction.participant_id).first()
        if participant and participant.group and participant.is_active:
            group = participant.group
            if group.group_type == "contribution" and group.monthly_fee > 0:
                current_month = datetime.now().strftime("%Y-%m")
                amount = transaction.amount
                
                # 🆕 1. Определяем первый месяц для расчёта
                if participant.start_date:
                    # Если start_date в будущем, начинаем с него
                    first_month = max(participant.start_date, current_month)
                else:
                    first_month = current_month
                    participant.start_date = current_month
                
                # 🆕 2. Находим месяцы с долгом
                debt_months = 0
                if participant.paid_until_month and participant.paid_until_month < current_month:
                    # Считаем сколько месяцев просрочено
                    paid_year, paid_month = map(int, participant.paid_until_month.split('-'))
                    curr_year, curr_month = map(int, current_month.split('-'))
                    debt_months = (curr_year - paid_year) * 12 + (curr_month - paid_month)
                
                # 🆕 3. Сначала гасим долги
                amount_for_debts = debt_months * group.monthly_fee
                amount_remaining = amount - amount_for_debts
                
                # 🆕 4. Остаток распределяем вперёд
                if amount_remaining > 0:
                    advance_months = int(amount_remaining / group.monthly_fee)
                    balance_copecks = amount_remaining % group.monthly_fee
                else:
                    advance_months = 0
                    balance_copecks = 0
                
                # 🆕 5. Обновляем paid_until_month
                if advance_months > 0 or debt_months > 0:
                    if participant.paid_until_month and participant.paid_until_month >= current_month:
                        # Продолжаем с последнего оплаченного
                        year, month = map(int, participant.paid_until_month.split('-'))
                    else:
                        # Начинаем с первого месяца (first_month)
                        year, month = map(int, first_month.split('-'))
                    
                    # Добавляем оплаченные месяцы
                    for _ in range(advance_months):
                        month += 1
                        if month > 12:
                            month = 1
                            year += 1
                    
                    participant.paid_until_month = f"{year}-{month:02d}"
                elif amount > 0 and not participant.paid_until_month:
                    # Первый платёж, но меньше чем monthly_fee
                    participant.paid_until_month = first_month
                
                # 🆕 6. Обновляем баланс (копейки)
                participant.balance = balance_copecks
                
                # 🆕 7. Обновляем total_paid
                participant.total_paid += amount
                
                # 🆕 8. Создаём/обновляем Contribution записи
                # Определяем диапазон месяцев для создания записей
                if participant.start_date:
                    start_year, start_month = map(int, participant.start_date.split('-'))
                else:
                    start_year, start_month = map(int, current_month.split('-'))
                
                # Создаём записи от start_date до paid_until_month
                if participant.paid_until_month:
                    end_year, end_month = map(int, participant.paid_until_month.split('-'))
                    
                    current_year, current_month_num = map(int, current_month.split('-'))
                    
                    year_iter, month_iter = start_year, start_month
                    month_index = 0
                    
                    while (year_iter < end_year) or (year_iter == end_year and month_iter <= end_month):
                        month_str = f"{year_iter}-{month_iter:02d}"
                        
                        # Определяем статус месяца
                        is_past = (year_iter < current_year) or (year_iter == current_year and month_iter < current_month_num)
                        is_current = (year_iter == current_year and month_iter == current_month_num)
                        
                        # Проверяем, есть уже запись
                        existing = db.query(Contribution).filter(
                            Contribution.participant_id == participant.id,
                            Contribution.month == month_str
                        ).first()
                        
                        if not existing:
                            # Создаём новую запись
                            contribution = Contribution(
                                participant_id=participant.id,
                                month=month_str,
                                amount_required=group.monthly_fee,
                                amount_paid=group.monthly_fee,  # Считаем оплаченным
                                status="paid",
                                is_advance=(not is_past and not is_current),
                                paid_at=transaction.created_at or datetime.now()
                            )
                            db.add(contribution)
                        else:
                            # Обновляем существующую
                            existing.amount_paid = group.monthly_fee
                            existing.status = "paid"
                            existing.paid_at = transaction.created_at or datetime.now()
                        
                        # Переходим к следующему месяцу
                        month_iter += 1
                        if month_iter > 12:
                            month_iter = 1
                            year_iter += 1
                        month_index += 1

        db.commit()
        db.refresh(t)
        return {"id": t.id}
    finally:
        db.close()

@app.delete("/api/incomes/{income_id}")
async def delete_income(income_id: int):
    """
    🆕 Удалить доход с пересчётом полей участника
    """
    from sqlalchemy.orm import joinedload
    
    db = SessionLocal()
    try:
        t = db.query(Income).filter(Income.id == income_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Транзакция не найдена")

        participant_id = t.participant_id
        
        # Удаляем доход
        db.delete(t)
        db.flush()  # 🆕 Синхронизируем с БД перед пересчётом
        
        # 🆕 Теперь пересчитываем поля (после удаления, чтобы исключить этот доход)
        participant = db.query(Participant).options(
            joinedload(Participant.group)
        ).filter(Participant.id == participant_id).first()
        
        if participant and participant.group and participant.group.monthly_fee > 0:
            logger.info(f"Пересчёт полей для участника {participant.name} после удаления дохода")
            _recalculate_participant_fields(db, participant)
        else:
            logger.info(f"Пропуск пересчёта: participant={participant is not None}, group={participant.group if participant else None}")

        db.commit()
        return {"success": True}
    finally:
        db.close()

@app.put("/api/incomes/{income_id}")
async def update_income(income_id: int, transaction: TransactionCreate):
    """
    🆕 Обновить доход с пересчётом полей участника
    """
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        t = db.query(Income).filter(Income.id == income_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Транзакция не найдена")

        rate = get_currency_rate(db, transaction.currency)
        t.participant_id = transaction.participant_id
        t.category_id = transaction.category_id
        t.amount = transaction.amount
        t.currency = transaction.currency
        t.amount_base = transaction.amount * rate
        t.description = transaction.description
        t.created_at = transaction.created_at or datetime.now()

        # 🆕 Пересчитываем поля участника
        participant = db.query(Participant).filter(Participant.id == transaction.participant_id).first()
        if participant and participant.group and participant.group.monthly_fee > 0:
            _recalculate_participant_fields(db, participant)

        db.commit()
        db.refresh(t)
        return {"id": t.id, "success": True}
    finally:
        db.close()

@app.get("/api/expenses")
async def get_expenses():
    db = SessionLocal()
    try:
        expenses = db.query(Expense).order_by(Expense.created_at.desc()).all()
        return [{
            "id": e.id,
            "participant_id": e.participant_id,
            "participant_name": e.participant.name,
            "category_id": e.category_id,
            "category_name": e.category.name,
            "amount": e.amount,
            "currency": e.currency,
            "amount_base": e.amount_base,
            "description": e.description,
            "created_at": e.created_at.isoformat() if e.created_at else None
        } for e in expenses]
    finally:
        db.close()

@app.post("/api/expenses")
async def create_expense(transaction: TransactionCreate):
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        rate = get_currency_rate(db, transaction.currency)
        t = Expense(
            participant_id=transaction.participant_id,
            category_id=transaction.category_id,
            amount=transaction.amount,
            currency=transaction.currency,
            amount_base=transaction.amount * rate,
            description=transaction.description,
            created_at=transaction.created_at or datetime.now()
        )
        db.add(t)
        db.commit()
        db.refresh(t)
        return {"id": t.id}
    finally:
        db.close()

@app.delete("/api/expenses/{expense_id}")
async def delete_expense(expense_id: int):
    db = SessionLocal()
    try:
        t = db.query(Expense).filter(Expense.id == expense_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Транзакция не найдена")
        db.delete(t)
        db.commit()
        return {"success": True}
    finally:
        db.close()

@app.put("/api/expenses/{expense_id}")
async def update_expense(expense_id: int, transaction: TransactionCreate):
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        t = db.query(Expense).filter(Expense.id == expense_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Транзакция не найдена")
        
        rate = get_currency_rate(db, transaction.currency)
        t.participant_id = transaction.participant_id
        t.category_id = transaction.category_id
        t.amount = transaction.amount
        t.currency = transaction.currency
        t.amount_base = transaction.amount * rate
        t.description = transaction.description
        t.created_at = transaction.created_at or datetime.now()
        
        db.commit()
        db.refresh(t)
        return {"id": t.id, "success": True}
    finally:
        db.close()


# === API - ШАБЛОНЫ ТРАНЗАКЦИЙ ===
@app.get("/api/templates")
async def get_templates():
    db = SessionLocal()
    try:
        templates = db.query(TransactionTemplate).order_by(TransactionTemplate.is_active.desc(), TransactionTemplate.name).all()
        return [{
            "id": t.id,
            "name": t.name,
            "template_type": t.template_type,
            "participant_id": t.participant_id,
            "participant_name": t.participant.name,
            "category_id": t.category_id,
            "amount": t.amount,
            "description": t.description,
            "interval_days": t.interval_days,
            "is_active": t.is_active,
            "last_created": t.last_created.isoformat() if t.last_created else None,
            "next_due": t.next_due.isoformat() if t.next_due else None,
            "created_at": t.created_at.isoformat() if t.created_at else None
        } for t in templates]
    finally:
        db.close()

@app.post("/api/templates")
async def create_template(template: TransactionTemplateCreate):
    if not template.name or not template.name.strip():
        raise HTTPException(status_code=400, detail="Название не может быть пустым")
    if template.amount <= 0:
        raise HTTPException(status_code=400, detail="Сумма должна быть положительной")

    db = SessionLocal()
    try:
        t = TransactionTemplate(
            name=template.name.strip(),
            template_type=template.template_type,
            participant_id=template.participant_id,
            category_id=template.category_id,
            amount=template.amount,
            description=template.description,
            interval_days=template.interval_days,
            next_due=datetime.now() + timedelta(days=template.interval_days)
        )
        db.add(t)
        db.commit()
        db.refresh(t)
        return {"id": t.id, "name": t.name}
    finally:
        db.close()

@app.put("/api/templates/{template_id}")
async def update_template(template_id: int, update: TransactionTemplateUpdate):
    db = SessionLocal()
    try:
        t = db.query(TransactionTemplate).filter(TransactionTemplate.id == template_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Шаблон не найден")
        
        if update.name is not None:
            t.name = update.name.strip()
        if update.is_active is not None:
            t.is_active = update.is_active
        if update.interval_days is not None:
            t.interval_days = update.interval_days
            if t.is_active:
                t.next_due = datetime.now() + timedelta(days=update.interval_days)
        
        db.commit()
        db.refresh(t)
        return {"id": t.id, "name": t.name}
    finally:
        db.close()

@app.delete("/api/templates/{template_id}")
async def delete_template(template_id: int):
    db = SessionLocal()
    try:
        t = db.query(TransactionTemplate).filter(TransactionTemplate.id == template_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Шаблон не найден")
        db.delete(t)
        db.commit()
        return {"success": True}
    finally:
        db.close()

@app.post("/api/templates/{template_id}/execute")
async def execute_template(template_id: int):
    db = SessionLocal()
    try:
        t = db.query(TransactionTemplate).filter(TransactionTemplate.id == template_id).first()
        if not t:
            raise HTTPException(status_code=404, detail="Шаблон не найден")
        if not t.is_active:
            raise HTTPException(status_code=400, detail="Шаблон не активен")

        # Получаем курс валюты
        rate = get_currency_rate(db, t.currency)
        
        # Создаём транзакцию по шаблону
        if t.template_type == 'income':
            new_transaction = Income(
                participant_id=t.participant_id,
                category_id=t.category_id,
                amount=t.amount,
                currency=t.currency,
                amount_base=t.amount * rate,
                description=t.description or f"По шаблону: {t.name}"
            )
        else:
            new_transaction = Expense(
                participant_id=t.participant_id,
                category_id=t.category_id,
                amount=t.amount,
                currency=t.currency,
                amount_base=t.amount * rate,
                description=t.description or f"По шаблону: {t.name}"
            )

        db.add(new_transaction)

        # Обновляем даты шаблона
        t.last_created = datetime.now()
        t.next_due = datetime.now() + timedelta(days=t.interval_days)

        db.commit()
        return {"success": True, "transaction_id": new_transaction.id}
    finally:
        db.close()

@app.get("/api/templates/due")
async def get_due_templates():
    """Получить шаблоны, у которых срок наступил"""
    db = SessionLocal()
    try:
        now = datetime.now()
        templates = db.query(TransactionTemplate).filter(
            TransactionTemplate.is_active == True,
            TransactionTemplate.next_due <= now
        ).all()
        
        return [{
            "id": t.id,
            "name": t.name,
            "template_type": t.template_type,
            "amount": t.amount,
            "participant_name": t.participant.name,
            "days_overdue": (now - t.next_due).days if t.next_due else 0
        } for t in templates]
    finally:
        db.close()


# === API - ВАЛЮТЫ ===
@app.get("/api/currencies")
async def get_currencies():
    """Получить текущие курсы валют"""
    db = SessionLocal()
    try:
        rates = db.query(CurrencyRate).distinct(CurrencyRate.currency_code).all()
        
        # Получаем последние курсы для каждой валюты
        currencies = []
        for code in ['RUB', 'USD', 'EUR']:
            rate = db.query(CurrencyRate).filter(
                CurrencyRate.currency_code == code
            ).order_by(CurrencyRate.date.desc()).first()
            
            if rate:
                currencies.append({
                    "code": code,
                    "rate": rate.rate_to_base,
                    "date": rate.date.isoformat() if rate.date else None
                })
        
        return currencies
    finally:
        db.close()

@app.post("/api/currencies")
async def update_currency(currency_code: str, rate: float):
    """Обновить курс валюты"""
    if currency_code not in ['RUB', 'USD', 'EUR']:
        raise HTTPException(status_code=400, detail="Неподдерживаемая валюта")
    if rate <= 0:
        raise HTTPException(status_code=400, detail="Курс должен быть положительным")

    db = SessionLocal()
    try:
        new_rate = CurrencyRate(
            currency_code=currency_code.upper(),
            rate_to_base=rate
        )
        db.add(new_rate)
        db.commit()
        return {"success": True, "currency": currency_code, "rate": rate}
    finally:
        db.close()


# === API - ТЕГИ ===
@app.get("/api/transactions/tags/bulk")
async def get_all_transaction_tags():
    """Получить все теги для всех транзакций одним запросом"""
    db = SessionLocal()
    try:
        # Получаем все привязки тегов с данными тегов
        all_tags = db.query(TransactionTag).join(Tag).all()
        
        # Группируем по transaction_type и transaction_id
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


@app.get("/api/tags")
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

@app.post("/api/tags")
async def create_tag(tag: TagCreate):
    """Создать тег"""
    if not tag.name or not tag.name.strip():
        raise HTTPException(status_code=400, detail="Название не может быть пустым")

    db = SessionLocal()
    try:
        existing = db.query(Tag).filter(Tag.name.ilike(tag.name.strip())).first()
        if existing:
            raise HTTPException(status_code=400, detail="Те�� уже существует")
        
        t = Tag(name=tag.name.strip(), color=tag.color)
        db.add(t)
        db.commit()
        db.refresh(t)
        return {"id": t.id, "name": t.name, "color": t.color}
    finally:
        db.close()

@app.put("/api/tags/{tag_id}")
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

@app.delete("/api/tags/{tag_id}")
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

@app.get("/api/tags/transactions/{tag_id}")
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

@app.post("/api/transactions/{transaction_type}/{transaction_id}/tags")
async def add_tag_to_transaction(transaction_type: str, transaction_id: int, tag_id: int):
    """Добавить тег к транзакции"""
    if transaction_type not in ['income', 'expense']:
        raise HTTPException(status_code=400, detail="Неверный тип транзакции")

    db = SessionLocal()
    try:
        # Проверяем существование транзакции
        if transaction_type == 'income':
            t = db.query(Income).filter(Income.id == transaction_id).first()
        else:
            t = db.query(Expense).filter(Expense.id == transaction_id).first()
        
        if not t:
            raise HTTPException(status_code=404, detail="Транзакция не найдена")
        
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if not tag:
            raise HTTPException(status_code=404, detail="Тег не найден")
        
        # Проверяем, не добавлен ли уже тег
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

@app.delete("/api/transactions/{transaction_type}/{transaction_id}/tags/{tag_id}")
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

@app.get("/api/transactions/{transaction_type}/{transaction_id}/tags")
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


# === API - БЭКАПЫ ===
from fastapi.responses import FileResponse
import os
from datetime import datetime as dt

@app.get("/api/backup/export")
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
                "amount_base": i.amount_base,
                "description": i.description,
                "created_at": i.created_at.isoformat() if i.created_at else None
            } for i in db.query(Income).all()],
            "expenses": [{
                "id": e.id,
                "participant_id": e.participant_id,
                "category_id": e.category_id,
                "amount": e.amount,
                "currency": e.currency,
                "amount_base": e.amount_base,
                "description": e.description,
                "created_at": e.created_at.isoformat() if e.created_at else None
            } for e in db.query(Expense).all()],
            "tags": [{
                "id": t.id,
                "name": t.name,
                "color": t.color
            } for t in db.query(Tag).all()],
            "transaction_tags": [{
                "id": tt.id,
                "transaction_id": tt.transaction_id,
                "transaction_type": tt.transaction_type,
                "tag_id": tt.tag_id
            } for tt in db.query(TransactionTag).all()],
            "templates": [{
                "id": t.id,
                "name": t.name,
                "template_type": t.template_type,
                "participant_id": t.participant_id,
                "category_id": t.category_id,
                "amount": t.amount,
                "currency": t.currency,
                "description": t.description,
                "interval_days": t.interval_days,
                "is_active": t.is_active,
                "last_created": t.last_created.isoformat() if t.last_created else None,
                "next_due": t.next_due.isoformat() if t.next_due else None
            } for t in db.query(TransactionTemplate).all()],
            "currency_rates": [{
                "id": r.id,
                "currency_code": r.currency_code,
                "rate_to_base": r.rate_to_base,
                "date": r.date.isoformat() if r.date else None
            } for r in db.query(CurrencyRate).all()]
        }
        
        # Сохраняем в файл
        backup_dir = os.path.join(PROJECT_ROOT, "backups")
        os.makedirs(backup_dir, exist_ok=True)
        timestamp = dt.now().strftime("%Y%m%d_%H%M%S")
        filename = f"backup_{timestamp}.json"
        filepath = os.path.join(backup_dir, filename)

        import json
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

@app.post("/api/backup/import")
async def import_backup(backup_data: dict):
    """Импорт данных из JSON"""
    # Валидация структуры данных
    required_keys = ['version', 'participants', 'income_categories', 'expense_categories']
    for key in required_keys:
        if key not in backup_data:
            raise HTTPException(status_code=400, detail=f"Отсутствует обязательное поле: {key}")
    
    db = SessionLocal()
    try:
        # Очищаем базу (сначала удаляем зависимые записи)
        db.query(TransactionTag).delete()
        db.query(TransactionTemplate).delete()
        db.query(Income).delete()
        db.query(Expense).delete()
        db.query(Tag).delete()
        db.query(CurrencyRate).delete()
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
                amount_base=i.get('amount_base'),
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
                amount_base=e.get('amount_base'),
                description=e.get('description'),
                created_at=e['created_at']
            ))
        
        for t in backup_data.get('tags', []):
            db.add(Tag(id=t['id'], name=t['name'], color=t.get('color', '#8b5cf6')))
        
        for tt in backup_data.get('transaction_tags', []):
            db.add(TransactionTag(
                id=tt['id'],
                transaction_id=tt['transaction_id'],
                transaction_type=tt['transaction_type'],
                tag_id=tt['tag_id']
            ))
        
        for t in backup_data.get('templates', []):
            db.add(TransactionTemplate(
                id=t['id'],
                name=t['name'],
                template_type=t['template_type'],
                participant_id=t['participant_id'],
                category_id=t['category_id'],
                amount=t['amount'],
                currency=t.get('currency', 'RUB'),
                description=t.get('description'),
                interval_days=t.get('interval_days', 30),
                is_active=t.get('is_active', True),
                last_created=t['last_created'] if t.get('last_created') else None,
                next_due=t['next_due'] if t.get('next_due') else None
            ))
        
        for r in backup_data.get('currency_rates', []):
            db.add(CurrencyRate(
                id=r['id'],
                currency_code=r['currency_code'],
                rate_to_base=r['rate_to_base'],
                date=r['date']
            ))
        
        db.commit()
        logger.info("Данные успешно восстановлены из бэкапа")
        return {"success": True, "message": "Данные успешно восстановлены"}
    except Exception as ex:
        db.rollback()
        logger.exception(f"Ошибка восстановления из бэкапа: {ex}")
        raise HTTPException(status_code=400, detail=f"Ошибка импорта: {str(ex)}")
    finally:
        db.close()

@app.get("/api/backup/list")
async def list_backups():
    """Получить список файлов бэкапа"""
    backup_dir = os.path.join(PROJECT_ROOT, "backups")
    if not os.path.exists(backup_dir):
        return []

    files = []
    for f in os.listdir(backup_dir):
        if f.endswith('.json'):
            filepath = os.path.join(backup_dir, f)
            stat = os.stat(filepath)
            files.append({
                "filename": f,
                "size": stat.st_size,
                "created": dt.fromtimestamp(stat.st_ctime).isoformat()
            })

    return sorted(files, key=lambda x: x['created'], reverse=True)

@app.delete("/api/backup/{filename}")
async def delete_backup(filename: str):
    """Удалить файл бэкапа"""
    import re
    if not re.match(r'^backup_\d{8}_\d{6}\.json$', filename):
        raise HTTPException(status_code=400, detail="Неверное имя файла")

    filepath = os.path.join(PROJECT_ROOT, "backups", filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Файл не найден")

    os.remove(filepath)
    return {"success": True}


# === API - ГРУППЫ КОНТРАГЕНТОВ ===
@app.get("/api/groups")
async def get_groups():
    """
    🆕 Получить список групп контрагентов
    С информацией об активных участниках и ожидаемом доходе
    """
    db = SessionLocal()
    try:
        groups = db.query(ParticipantGroup).order_by(ParticipantGroup.name).all()
        current_month = datetime.now().strftime("%Y-%m")
        next_month_dt = datetime.now().replace(day=1) + timedelta(days=32)
        next_month = next_month_dt.replace(day=1).strftime("%Y-%m")
        
        result = []
        for g in groups:
            # Считаем активных участников
            active_participants = [p for p in g.participants if p.is_active]
            
            # Считаем тех, кто должен платить в следующем месяце
            should_pay_next_month = []
            for p in active_participants:
                if p.paid_until_month is None or p.paid_until_month < next_month:
                    should_pay_next_month.append(p.id)
            
            # Ожидаемый доход в месяц
            expected_monthly_income = len(active_participants) * g.monthly_fee
            
            result.append({
                "id": g.id,
                "name": g.name,
                "group_type": g.group_type,
                "monthly_fee": g.monthly_fee,
                "description": g.description,
                "is_active": g.is_active,
                "auto_create_contributions": g.auto_create_contributions,
                "participants_count": len(g.participants),
                "active_participants_count": len(active_participants),
                "should_pay_next_month_count": len(should_pay_next_month),
                "expected_monthly_income": expected_monthly_income,
                "created_at": g.created_at.isoformat() if g.created_at else None
            })
        
        return result
    finally:
        db.close()


@app.post("/api/groups")
async def create_group(group: ParticipantGroupCreate):
    """Создать группу контрагентов"""
    db = SessionLocal()
    try:
        g = ParticipantGroup(**group.dict())
        db.add(g)
        db.commit()
        db.refresh(g)
        return {"id": g.id, "success": True}
    finally:
        db.close()


@app.put("/api/groups/{group_id}")
async def update_group(group_id: int, group: ParticipantGroupUpdate):
    """
    Обновить группу
    ⚠️ При изменении monthly_fee возвращаем предупреждение — балансы участников не пересчитываются
    """
    db = SessionLocal()
    try:
        g = db.query(ParticipantGroup).filter(ParticipantGroup.id == group_id).first()
        if not g:
            raise HTTPException(status_code=404, detail="Группа не найдена")

        update_data = group.dict(exclude_unset=True)
        
        # 🆕 Проверяем изменение monthly_fee
        monthly_fee_changed = 'monthly_fee' in update_data and update_data['monthly_fee'] != g.monthly_fee
        monthly_fee_warning = None
        
        if monthly_fee_changed:
            # Считаем количество активных участников
            active_participants = [p for p in g.participants if p.is_active]
            monthly_fee_warning = (
                f"Ежемесячный платёж изменён с {g.monthly_fee} на {update_data['monthly_fee']}. "
                f"Балансы участников не пересчитаны. Затронуто активных участников: {len(active_participants)}. "
                f"Новый тариф применяется к будущим платежам."
            )
            logger.warning(f"Группа {g.name}: monthly_fee изменён с {g.monthly_fee} на {update_data['monthly_fee']}")

        for field, value in update_data.items():
            setattr(g, field, value)

        db.commit()
        
        return {
            "id": g.id,
            "success": True,
            "monthly_fee_changed": monthly_fee_changed,
            "monthly_fee_warning": monthly_fee_warning
        }
    finally:
        db.close()


@app.delete("/api/groups/{group_id}")
async def delete_group(group_id: int):
    """Удалить группу"""
    db = SessionLocal()
    try:
        g = db.query(ParticipantGroup).filter(ParticipantGroup.id == group_id).first()
        if not g:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        if g.participants:
            raise HTTPException(status_code=400, detail=f"В группе есть участники: {len(g.participants)}")
        db.delete(g)
        db.commit()
        return {"success": True}
    finally:
        db.close()


# === API - ЕЖЕМЕСЯЧНЫЕ РАСХОДЫ ===
@app.get("/api/monthly_expenses")
async def get_monthly_expenses():
    """Получить список ежемесячных расходов"""
    db = SessionLocal()
    try:
        expenses = db.query(MonthlyExpense).order_by(MonthlyExpense.name).all()
        return [{
            "id": e.id,
            "name": e.name,
            "participant_id": e.participant_id,
            "participant_name": e.participant.name if e.participant else None,
            "category_id": e.category_id,
            "category_name": e.category.name if e.category else None,
            "amount": e.amount,
            "day_of_month": e.day_of_month,
            "description": e.description,
            "is_active": e.is_active,
            "last_paid_month": e.last_paid_month,
            "next_due_date": e.next_due_date.isoformat() if e.next_due_date else None,
            "created_at": e.created_at.isoformat() if e.created_at else None
        } for e in expenses]
    finally:
        db.close()


@app.post("/api/monthly_expenses")
async def create_monthly_expense(expense: MonthlyExpenseCreate):
    """Создать ежемесячный расход"""
    db = SessionLocal()
    try:
        e = MonthlyExpense(**expense.dict())
        # Рассчитаем следующую дату платежа
        if e.day_of_month > 0:
            from datetime import timedelta
            today = datetime.now()
            # Если день в этом месяце ещё не прошёл
            if today.day <= e.day_of_month:
                e.next_due_date = today.replace(day=e.day_of_month)
            else:
                # Следующий месяц
                if today.month == 12:
                    e.next_due_date = today.replace(year=today.year + 1, month=1, day=e.day_of_month)
                else:
                    e.next_due_date = today.replace(month=today.month + 1, day=e.day_of_month)
        
        db.add(e)
        db.commit()
        db.refresh(e)
        return {"id": e.id, "success": True}
    finally:
        db.close()


@app.put("/api/monthly_expenses/{expense_id}")
async def update_monthly_expense(expense_id: int, expense: MonthlyExpenseUpdate):
    """Обновить ежемесячный расход"""
    db = SessionLocal()
    try:
        e = db.query(MonthlyExpense).filter(MonthlyExpense.id == expense_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Расход не найден")
        
        for field, value in expense.dict(exclude_unset=True).items():
            setattr(e, field, value)
        
        db.commit()
        return {"id": e.id, "success": True}
    finally:
        db.close()


@app.delete("/api/monthly_expenses/{expense_id}")
async def delete_monthly_expense(expense_id: int):
    """Удалить ежемесячный расход"""
    db = SessionLocal()
    try:
        e = db.query(MonthlyExpense).filter(MonthlyExpense.id == expense_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Расход не найден")
        db.delete(e)
        db.commit()
        return {"success": True}
    finally:
        db.close()


@app.post("/api/monthly_expenses/{expense_id}/pay")
async def pay_monthly_expense(expense_id: int, month: Optional[str] = None):
    """Отметить ежемесячный расход как оплаченный"""
    db = SessionLocal()
    try:
        e = db.query(MonthlyExpense).filter(MonthlyExpense.id == expense_id).first()
        if not e:
            raise HTTPException(status_code=404, detail="Расход не найден")
        
        if not month:
            month = datetime.now().strftime("%Y-%m")
        
        e.last_paid_month = month
        
        # Создадим Expense транзакцию
        if e.category_id and e.participant_id:
            expense = Expense(
                participant_id=e.participant_id,
                category_id=e.category_id,
                amount=e.amount,
                description=f"Ежемесячный платёж: {e.name} за {month}",
                created_at=datetime.now()
            )
            expense.amount_base = e.amount  # Упрощённо, без конвертации валюты
            db.add(expense)
        
        db.commit()
        return {"success": True, "last_paid_month": e.last_paid_month}
    finally:
        db.close()


# === API - ВЗНОСЫ ===
@app.get("/api/contributions")
async def get_contributions(participant_id: Optional[int] = None, month: Optional[str] = None):
    """Получить список взносов с фильтрацией"""
    db = SessionLocal()
    try:
        query = db.query(Contribution).order_by(Contribution.month.desc(), Contribution.participant_id)
        
        if participant_id:
            query = query.filter(Contribution.participant_id == participant_id)
        if month:
            query = query.filter(Contribution.month == month)
        
        contributions = query.all()
        return [{
            "id": c.id,
            "participant_id": c.participant_id,
            "participant_name": c.participant.name,
            "month": c.month,
            "amount_required": c.amount_required,
            "amount_paid": c.amount_paid,
            "status": c.status,
            "comment": c.comment,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        } for c in contributions]
    finally:
        db.close()


@app.get("/api/contributions/summary")
async def get_contributions_summary(month: Optional[str] = None):
    """Получить сводку по взносам"""
    db = SessionLocal()
    try:
        # Текущий месяц
        if not month:
            month = datetime.now().strftime("%Y-%m")

        # Общая статистика
        total_required = db.query(func.sum(Contribution.amount_required)).scalar() or 0
        total_paid = db.query(func.sum(Contribution.amount_paid)).scalar() or 0
        total_debt = total_required - total_paid

        # По месяцам
        months_data = db.query(
            Contribution.month,
            func.sum(Contribution.amount_required).label('required'),
            func.sum(Contribution.amount_paid).label('paid')
        ).group_by(Contribution.month).order_by(Contribution.month.desc()).all()

        # По участникам (за выбранный месяц)
        participants_data = db.query(
            Contribution.participant_id,
            Participant.name,
            func.sum(Contribution.amount_required).label('required'),
            func.sum(Contribution.amount_paid).label('paid')
        ).join(Participant).group_by(Contribution.participant_id, Participant.name).all()

        # Кто должен за текущий месяц
        debtors = db.query(
            Contribution.participant_id,
            Participant.name,
            Contribution.amount_required,
            Contribution.amount_paid,
            (Contribution.amount_required - Contribution.amount_paid).label('debt')
        ).join(Participant).filter(
            Contribution.month == month,
            Contribution.amount_paid < Contribution.amount_required
        ).all()

        return {
            "total_required": total_required,
            "total_paid": total_paid,
            "total_debt": total_debt,
            "months": [{"month": m.month, "required": m.required, "paid": m.paid} for m in months_data],
            "participants": [{
                "participant_id": p.participant_id,
                "name": p.name,
                "required": p.required,
                "paid": p.paid,
                "debt": p.required - p.paid
            } for p in participants_data],
            "debtors": [{
                "participant_id": d.participant_id,
                "name": d.name,
                "required": d.amount_required,
                "paid": d.amount_paid,
                "debt": d.debt
            } for d in debtors]
        }
    finally:
        db.close()


@app.get("/api/finance/forecast")
async def get_finance_forecast(months_ahead: int = 6):
    """🆕 Получить финансовый прогноз на N месяцев (с учётом активных участников)"""
    db = SessionLocal()
    try:
        from datetime import timedelta

        # 1. Текущий баланс (доходы - расходы)
        total_income = db.query(func.sum(Income.amount_base)).scalar() or 0
        total_expense = db.query(func.sum(Expense.amount_base)).scalar() or 0
        current_balance = total_income - total_expense

        # 2. 🆕 Ежемесячные доходы (взносы ТОЛЬКО АКТИВНЫХ участников)
        groups = db.query(ParticipantGroup).filter(
            ParticipantGroup.group_type == "contribution",
            ParticipantGroup.is_active == True,
            ParticipantGroup.monthly_fee > 0
        ).all()

        expected_monthly_income = 0
        participants_by_group = {}
        current_month = datetime.now().strftime("%Y-%m")

        for group in groups:
            # 🆕 Только активные участники в группе
            active_members = db.query(Participant).filter(
                Participant.group_id == group.id,
                Participant.is_active == True
            ).all()
            
            # 🆕 Считаем только тех, у кого paid_until_month < следующего месяца
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
                "active_payers": members_count,  # 🆕 Кто должен платить в следующем месяце
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
            # Определяем месяц
            if today.month + i > 12:
                year = today.year + (today.month + i - 1) // 12
                month = (today.month + i - 1) % 12 + 1
            else:
                year = today.year
                month = today.month + i

            month_str = f"{year}-{month:02d}"
            month_name = datetime(year, month, 1).strftime("%B %Y")

            # Считаем баланс
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

        # 5. 🆕 Участники с задолженностью (ТОЛЬКО АКТИВНЫЕ)
        debtors_query = db.query(
            Participant.id,
            Participant.name,
            Participant.total_paid,
            Participant.paid_until_month,
            Participant.is_active,
            ParticipantGroup.monthly_fee
        ).join(ParticipantGroup).filter(
            ParticipantGroup.group_type == "contribution",
            Participant.is_active == True  # 🆕 Только активные
        ).all()

        debtors = []
        for d in debtors_query:
            if d.paid_until_month is None or d.paid_until_month < current_month:
                months_unpaid = 0
                if d.paid_until_month:
                    # Считаем сколько месяцев не оплачено
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


# === API - ВЗНОСЫ (ТОЛЬКО ПРОСМОТР ИСТОРИИ) ===
# ⚠️ POST /api/contributions удалён — ручное создание взносов отключено
# ⚠️ PUT /api/contributions/{id} удалён — редактирование не используется
# Взносы создаются автоматически при внесении доходов (incomes)

@app.delete("/api/contributions/{contribution_id}")
async def delete_contribution(contribution_id: int):
    """Удалить запись о взносе"""
    db = SessionLocal()
    try:
        c = db.query(Contribution).filter(Contribution.id == contribution_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Взнос не найден")
        db.delete(c)
        db.commit()
        return {"success": True}
    finally:
        db.close()


# ⚠️ POST /api/contributions/bulk-create удалён — массовое создание отключено
# ⚠️ POST /api/contributions/apply-payment удалён — используется через incomes


if __name__ == "__main__":
    import uvicorn
    # log_level="warning" отключает логирование запросов Uvicorn (оставляет только ошибки)
    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="warning")
