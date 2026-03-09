"""
Скрипт миграции БД
Запустить: python migrate.py
"""
import sqlite3
import os

DB_PATH = r"c:\Users\kovalevaa\Desktop\VPN\Bu\data\ViCRM.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Начало миграции...")
    
    # Добавляем колонки в participants
    columns_to_add = [
        ("group_id", "INTEGER"),
        ("total_paid", "FLOAT DEFAULT 0"),
        ("paid_until_month", "VARCHAR(7)")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE participants ADD COLUMN {col_name} {col_type}")
            print(f"[+] Dobavlena kolonka {col_name} v participants")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"[=] Kolonka {col_name} uzhe sushchestvuet")
            else:
                raise
    
    # Sozdaem tablicu participant_groups esli net
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
    print("[+] Tablica participant_groups sozdana/sushchestvuet")
    
    # Sozdaem tablicu monthly_expenses esli net
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
    print("[+] Tablica monthly_expenses sozdana/sushchestvuet")
    
    # Dobavlaem kolonki v contributions
    contrib_columns = [
        ("is_advance", "BOOLEAN DEFAULT 0"),
        ("paid_at", "DATETIME")
    ]
    
    for col_name, col_type in contrib_columns:
        try:
            cursor.execute(f"ALTER TABLE contributions ADD COLUMN {col_name} {col_type}")
            print(f"[+] Dobavlena kolonka {col_name} v contributions")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"[=] Kolonka {col_name} uzhe sushchestvuet")
            else:
                raise
    
    conn.commit()
    conn.close()
    
    print("\n[OK] Migraciya zavershena uspeshno!")

if __name__ == "__main__":
    migrate()
