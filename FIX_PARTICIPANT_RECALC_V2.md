# ✅ ИСПРАВЛЕНИЕ ПЕРЕСЧЁТА УЧАСТНИКОВ

**Дата:** 10.03.2026  
**Статус:** ✅ **ИСПРАВЛЕНО**

---

## 🐛 ПРОБЛЕМЫ

### 1. При удалении транзакции данные участника не обновлялись
**Симптом:**
- Удаляешь транзакцию в меню "Статистика"
- В меню "Участники" данные не меняются (`balance`, `paid_until_month`)

### 2. При смене группы пересчёт не работал
**Симптом:**
- Меняешь группу с VIP (300₽) на Обычную (150₽)
- `balance` и `paid_until_month` не меняются

---

## 🔧 ПРИЧИНЫ

### Проблема 1: Удаление транзакции
`recalculate_participant_fields` **возвращалась сразу** если у участника нет группы:

```python
if not participant.group or participant.group.monthly_fee <= 0:
    return  # ❌ Ничего не пересчитывалось!
```

### Проблема 2: Смена группы
Условие проверки изменения группы не работало для `group_id = NULL`:

```python
if participant.group_id is not None and participant.group_id != p.group_id:
    # ❌ Не срабатывало при group_id = None
```

---

## ✅ РЕШЕНИЯ

### 1. Пересчёт даже без группы

**Файл:** `backend/services/participant_service.py`

**Новая логика:**
```python
# 1. Складываем ВСЕ платежи — это делаем всегда
total_amount = sum(income.amount for income in incomes)
participant.total_paid = total_amount

# 2. Если нет группы — весь баланс это аванс
if not participant.group or participant.group.monthly_fee <= 0:
    participant.balance = total_amount  # Весь баланс — это аванс
    participant.paid_until_month = None
    return

# 3. Есть группа — считаем по monthly_fee
monthly_fee = participant.group.monthly_fee
months_paid = int(total_amount / monthly_fee)
balance = total_amount % monthly_fee
participant.balance = balance
```

**Результат:**
- Без группы: `balance = вся сумма`, `paid_until_month = NULL`
- С группой: `balance = остаток`, `paid_until_month = дата`

---

### 2. Исправлена проверка смены группы

**Файл:** `backend/routers/participants.py`

**Новая логика:**
```python
group_changed = (
    (p.group_id is not None and participant.group_id is None) or  # Была группа → стала NULL
    (p.group_id is None and participant.group_id is not None) or  # Была NULL → стала группа
    (p.group_id is not None and participant.group_id is not None and p.group_id != participant.group_id)
)

if group_changed:
    recalculate_participant_fields(db, p)  # ✅ Теперь вызывается всегда
```

**Результат:**
- Смена группы → пересчёт ✅
- Смена на "Без группы" → пересчёт ✅
- Та же группа → пересчёт не нужен ✅

---

## 📊 РЕЗУЛЬТАТЫ

### Сценарий 1: Удаление транзакции

**До:**
- Алимов Д., группа: NULL
- Внесено: 150₽
- `balance`: 150₽
- **Удалили транзакцию**
- `balance`: **150₽** ❌ (должно быть 0₽)

**После:**
- `balance`: **0₽** ✅ (пересчиталось)

---

### Сценарий 2: Смена группы

**До:**
- Алимов Д., группа: VIP (300₽)
- Внесено: 150₽
- `balance`: 150₽, `paid_until_month`: NULL
- **Сменили на Обычную (150₽)**
- `balance`: **150₽**, `paid_until_month`: **NULL** ❌

**После:**
- `balance`: **0₽** ✅
- `paid_until_month`: **2026-04** ✅ (оплачено 1 месяц)

---

### Сценарий 3: Смена на "Без группы"

**До:**
- Алимов Д., группа: Обычная (150₽)
- Внесено: 150₽
- `balance`: 0₽, `paid_until_month`: 2026-04
- **Сменили на "Без группы"**
- `balance`: **0₽**, `paid_until_month`: **2026-04** ❌

**После:**
- `balance`: **150₽** ✅ (вся сумма как аванс)
- `paid_until_month`: **NULL** ✅ (нет группы для отсчёта)

---

## 📝 ИЗМЕНЁННЫЕ ФАЙЛЫ

| Файл | Изменения |
|------|-----------|
| `backend/services/participant_service.py` | Пересчёт даже без группы |
| `backend/routers/participants.py` | Исправлена проверка `group_changed` |

---

## 🚀 ПРОВЕРКА

**Перезапустите backend:**
```bash
# Остановить (Ctrl+C)
python main.py
```

**Проверка:**
1. Создайте участника без группы
2. Внесите платёж 150₽
3. Проверьте `balance = 150₽`
4. Смените группу на Обычную (150₽)
5. Проверьте `balance = 0₽`, `paid_until_month = 2026-04` ✅

---

## ✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО

Обе проблемы исправлены:
1. ✅ При удалении транзакции данные пересчитываются
2. ✅ При смене группы данные пересчитываются
