"""
Подключение к базе данных ViCRM
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import DATABASE_URL

# Движок БД
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Сессия
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Базовый класс для моделей
Base = declarative_base()


def get_db():
    """Генератор сессий БД для зависимости FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
