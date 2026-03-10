"""
Конфигурация приложения ViCRM
"""
import os

# === ПУТИ ===
# Корень проекта (на уровень выше backend/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Папка с данными
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
os.makedirs(DATA_DIR, exist_ok=True)

# Папка для логов
LOGS_DIR = os.path.join(PROJECT_ROOT, "logs")
os.makedirs(LOGS_DIR, exist_ok=True)

# Папка для бэкапов
BACKUP_DIR = os.path.join(PROJECT_ROOT, "backups")
os.makedirs(BACKUP_DIR, exist_ok=True)

# === БАЗА ДАННЫХ ===
DATABASE_PATH = os.path.join(DATA_DIR, "ViCRM.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# === НАСТРОЙКИ ПРИЛОЖЕНИЯ ===
APP_TITLE = "ViCRM API"
APP_HOST = "0.0.0.0"
APP_PORT = 8002

# === CORS ===
ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:3000"]

# === ЛОГИРОВАНИЕ ===
LOG_MAX_BYTES = 10 * 1024 * 1024  # 10 MB
LOG_BACKUP_COUNT = 5

# === КУРСЫ ВАЛЮТ ПО УМОЛЧАНИЮ ===
DEFAULT_CURRENCY_RATES = {
    'RUB': 1.0,
    'USD': 90.0,
    'EUR': 97.0
}

# === КАТЕГОРИИ ПО УМОЛЧАНИЮ ===
DEFAULT_INCOME_CATEGORIES = ["Взнос участника", "Пожертвование", "Прибыль", "Другое"]
DEFAULT_EXPENSE_CATEGORIES = ["Сервер", "Хостинг", "Услуги", "Реклама", "Налоги", "Другое"]
