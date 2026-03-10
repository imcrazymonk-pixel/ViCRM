"""
Скрипт миграции БД
Запустить: python migrate.py
"""
import sqlite3
import os

# Путь к БД относительно этого файла
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "ViCRM.db")
DB_PATH = os.path.abspath(DB_PATH)

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Начало миграции...")

    # Добавляем колонки в participants
    columns_to_add = [
        ("group_id", "INTEGER"),
        ("total_paid", "FLOAT DEFAULT 0"),
        ("paid_until_month", "VARCHAR(7)"),
        ("balance", "FLOAT DEFAULT 0"),
        ("paused_from", "VARCHAR(7)"),
        ("paused_to", "VARCHAR(7)")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE participants ADD COLUMN {col_name} {col_type}")
            print(f"[+] Добавлена колонка {col_name} в participants")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"[=] Колонка {col_name} уже существует")
            else:
                raise

    # Создаем таблицу participant_groups если нет
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS participant_groups (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            group_type VARCHAR(20) DEFAULT 'contribution',
            monthly_fee FLOAT DEFAULT 0,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            auto_create_contributions BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("[+] Таблица participant_groups создана/существует")

    # Создаем таблицу membership_history если нет
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS membership_history (
            id INTEGER PRIMARY KEY,
            participant_id INTEGER NOT NULL,
            group_id INTEGER NOT NULL,
            joined_at VARCHAR(7) NOT NULL,
            left_at VARCHAR(7),
            reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("[+] Таблица membership_history создана/существует")

    # Создаем таблицу monthly_expenses если нет
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS monthly_expenses (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            participant_id INTEGER,
            category_id INTEGER,
            amount FLOAT NOT NULL,
            day_of_month INTEGER DEFAULT 1,
            description TEXT,
            is_active BOOLEAN DEFAULT 1,
            last_paid_month VARCHAR(7),
            next_due_date DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("[+] Таблица monthly_expenses создана/существует")

    # Добавляем колонки в contributions
    contrib_columns = [
        ("is_advance", "BOOLEAN DEFAULT 0"),
        ("paid_at", "DATETIME")
    ]

    for col_name, col_type in contrib_columns:
        try:
            cursor.execute(f"ALTER TABLE contributions ADD COLUMN {col_name} {col_type}")
            print(f"[+] Добавлена колонка {col_name} в contributions")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"[=] Колонка {col_name} уже существует")
            else:
                raise

    conn.commit()
    conn.close()

    print("\n[OK] Миграция завершена успешно!")

if __name__ == "__main__":
    migrate()
