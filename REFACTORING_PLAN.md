# 📋 План рефакторинга App.jsx и ParticipantsManager.jsx

**Дата:** 10.03.2026  
**Цель:** Чистый рефакторинг без изменения функциональности  
**Принцип:** Копирование кода без изменений, только перенос в новые файлы

---

## 📁 Исходные файлы

| Файл | Строк | Описание |
|------|-------|----------|
| `frontend/src/App.jsx` | 1855 | Главный компонент приложения |
| `frontend/src/modules/finance/components/ParticipantsManager.jsx` | 981 | Управление участниками |

---

## 🎯 Итоговая структура

```
frontend/src/
├── App.jsx                          # ~200 строк — только роутинг и layout
├── App.styles.css
├── core/
│   ├── components/
│   │   ├── Layout.jsx               # Уже существует
│   │   ├── ConfirmModal.jsx         # Перенос из App.jsx
│   │   ├── ListModal.jsx            # Перенос из App.jsx
│   │   └── index.js                 # Обновление экспорта
│   ├── hooks/
│   │   ├── useFinanceData.js        # Логика finance из App.jsx
│   │   ├── useParticipants.js       # Логика participants
│   │   ├── useTransactions.js       # Логика транзакций
│   │   └── index.js                 # Экспорт хуков
│   ├── utils/
│   │   ├── export.jsx               # Уже существует
│   │   ├── format.js                # Уже существует
│   │   └── notifications.js         # Уже существует
│   └── api/
│       └── api.js                   # Базовый API клиент
└── modules/
    ├── finance/
    │   ├── components/
    │   │   ├── Dashboard/
    │   │   │   ├── Dashboard.jsx    # Сводка + карточки
    │   │   │   ├── SummaryCards.jsx # Карточки сводки
    │   │   │   └── Charts.jsx       # Графики
    │   │   ├── Transactions/
    │   │   │   ├── TransactionsEditor.jsx  # Редактор транзакций
    │   │   │   ├── TransactionForm.jsx     # Форма транзакции
    │   │   │   ├── TransactionTable.jsx    # Таблица транзакций
    │   │   │   └── AllTransactionsTable.jsx # Общая таблица
    │   │   ├── Participants/
    │   │   │   ├── index.js                # Экспорт компонентов
    │   │   │   ├── ParticipantsManager.jsx # Главный компонент (~200 строк)
    │   │   │   ├── ParticipantsTable.jsx   # Таблица (~150 строк)
    │   │   │   ├── ParticipantDetailPanel.jsx # Панель деталей (~150 строк)
    │   │   │   ├── ParticipantsSummary.jsx # Сводка (~100 строк)
    │   │   │   ├── forms/
    │   │   │   │   ├── PaymentForm.jsx         # Форма платежа (~100 строк)
    │   │   │   │   ├── EditParticipantModal.jsx # Редактирование (~150 строк)
    │   │   │   │   ├── ActivateModal.jsx       # Активация (~100 строк)
    │   │   │   │   └── DeactivateModal.jsx     # Деактивация (~100 строк)
    │   │   │   └── common/
    │   │   │       ├── StatusBadge.jsx         # Статус (~40 строк)
    │   │   │       └── BalanceCell.jsx         # Баланс (~20 строк)
    │   │   ├── SummaryCard.jsx        # Карточка сводки
    │   │   ├── StatsView.jsx          # Просмотр статистики
    │   │   ├── GroupsManager.jsx      # Уже существует
    │   │   ├── MonthlyExpensesManager.jsx # Уже существует
    │   │   ├── FinanceForecast.jsx    # Уже существует
    │   │   └── Stats.jsx              # Уже существует
    │   ├── hooks/
    │   │   └── useFinanceData.js      # Хук для данных finance
    │   └── api/
    │       └── financeApi.js          # API для finance
    └── settings/
        └── components/
            ├── BackupManager.jsx      # Уже существует
            └── SystemSettings.jsx     # Настройки таблиц/тем
```

---

## 📝 ПОШАГОВЫЙ ПЛАН

### ШАГ 1: Создание бэкапов

| Файл бэкапа | Оригинал |
|-------------|----------|
| `frontend/src/App.jsx.backup` | `frontend/src/App.jsx` |
| `frontend/src/modules/finance/components/ParticipantsManager.jsx.backup` | `frontend/src/modules/finance/components/ParticipantsManager.jsx` |

---

### ШАГ 2: Создание `core/api/api.js`

**Новый файл:** `frontend/src/core/api/api.js`

**Содержимое:**
```javascript
import axios from 'axios'

const API_URL = 'http://localhost:8002/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export { API_URL }
```

**Строки из App.jsx:** Не переносятся (новая утилита)

---

### ШАГ 3: Создание `core/components/ConfirmModal.jsx`

**Новый файл:** `frontend/src/core/components/ConfirmModal.jsx`

**Строки из App.jsx:** 376-406 (31 строка)

**Содержимое:**
- Компонент `ConfirmModal` (модальное окно подтверждения удаления)
- Пропсы: `show`, `title`, `message`, `onConfirm`, `onCancel`

---

### ШАГ 4: Создание `core/components/ListModal.jsx`

**Новый файл:** `frontend/src/core/components/ListModal.jsx`

**Строки из App.jsx:** 409-453 (45 строк)

**Содержимое:**
- Компонент `ListModal` (модальное окно со списком элементов)
- Пропсы: `show`, `title`, `headerClass`, `items`, `onEdit`, `onDelete`, `formatItemStats`

---

### ШАГ 5: Обновление `core/components/index.js`

**Файл:** `frontend/src/core/components/index.js`

**Добавить экспорт:**
```javascript
export { default as Layout } from './Layout'
export { ConfirmModal } from './ConfirmModal'
export { ListModal } from './ListModal'
```

---

### ШАГ 6: Создание `modules/finance/components/SummaryCard.jsx`

**Новый файл:** `frontend/src/modules/finance/components/SummaryCard.jsx`

**Строки из App.jsx:** 24-29 (6 строк)

**Содержимое:**
- Компонент `SummaryCard` (карточка сводки)
- Пропсы: `label`, `value`, `type`

---

### ШАГ 7: Создание `modules/finance/components/StatsView.jsx`

**Новый файл:** `frontend/src/modules/finance/components/StatsView.jsx`

**Строки из App.jsx:** 544-649 (106 строк)

**Содержимое:**
- Компонент `StatsView` (просмотр статистики с графиками)
- Пропсы: `incomes`, `expenses`, `summary`, `participants`, `incomeCategories`, `expenseCategories`
- Использует `ResponsiveContainer`, `PieChart`, `Pie`, `Cell`, `Tooltip`, `Legend`, `Label` из `recharts`

---

### ШАГ 8: Создание `modules/finance/components/Transactions/TransactionForm.jsx`

**Новый файл:** `frontend/src/modules/finance/components/Transactions/TransactionForm.jsx`

**Строки из App.jsx:** 32-229 (198 строк)

**Содержимое:**
- Компонент `TransactionForm` (форма создания/редактирования транзакции)
- Пропсы: `title`, `icon`, `type`, `participants`, `categories`, `onSubmit`, `disabled`, `onOpenSettings`, `initialData`, `isEdit`
- Внутренние хуки: `useState`, `useEffect`
- Встроенная логика расчёта рекомендуемой суммы для дохода

---

### ШАГ 9: Создание `modules/finance/components/Transactions/TransactionTable.jsx`

**Новый файл:** `frontend/src/modules/finance/components/Transactions/TransactionTable.jsx`

**Строки из App.jsx:** 232-284 (53 строки)

**Содержимое:**
- Компонент `TransactionTable` (таблица транзакций одного типа)
- Пропсы: `data`, `type`, `onDelete`, `onEdit`
- Встроенная функция `formatCurrency`

---

### ШАГ 10: Создание `modules/finance/components/Transactions/AllTransactionsTable.jsx`

**Новый файл:** `frontend/src/modules/finance/components/Transactions/AllTransactionsTable.jsx`

**Строки из App.jsx:** 287-373 (87 строк)

**Содержимое:**
- Компонент `AllTransactionsTable` (единая таблица всех транзакций)
- Пропсы: `incomes`, `expenses`, `onDelete`, `onEdit`
- Логика объединения и сортировки доходов и расходов

---

### ШАГ 11: Создание `modules/finance/components/Transactions/TransactionsEditor.jsx`

**Новый файл:** `frontend/src/modules/finance/components/Transactions/TransactionsEditor.jsx`

**Строки из App.jsx:** 1077-1230 (154 строки) — секция `{activeItem === 'finance-editor'}`

**Содержимое:**
- Компонент `TransactionsEditor` (редактор транзакций)
- Включает:
  - Форма добавления контрагента
  - `TransactionForm` для дохода
  - `TransactionForm` для расхода
  - Форма добавления категорий
  - `GroupsManager`
  - `MonthlyExpensesManager`
  - Таблицы доходов и расходов

---

### ШАГ 12: Создание `modules/finance/components/Dashboard/SummaryCards.jsx`

**Новый файл:** `frontend/src/modules/finance/components/Dashboard/SummaryCards.jsx`

**Строки из App.jsx:** 996-1074 (79 строк) — секция карточек сводки

**Содержимое:**
- Компонент `SummaryCards` (сетка карточек сводки)
- Пропсы: `summary`, `avgIncome`, `avgExpense`, `monthlyExpense`, `forecastData`, `participants`, `onSetFinanceEditor`, `onSetFinanceForecast`
- 5 карточек: Баланс, Доходы, Расходы, Участники, Расходуем в месяц

---

### ШАГ 13: Создание `modules/finance/components/Dashboard/Dashboard.jsx`

**Новый файл:** `frontend/src/modules/finance/components/Dashboard/Dashboard.jsx`

**Строки из App.jsx:** 969-1327 (359 строк) — секция `{activeItem === 'finance-stats'}`

**Содержимое:**
- Компонент `Dashboard` (главная страница статистики)
- Включает:
  - Заголовок с кнопкой экспорта
  - `SummaryCards`
  - Сводка по участникам (из прогноза)
  - `StatsView`
  - `AllTransactionsTable` с фильтрами

---

### ШАГ 14: Создание `modules/settings/components/SystemSettings.jsx`

**Новый файл:** `frontend/src/modules/settings/components/SystemSettings.jsx`

**Строки из App.jsx:** 1343-1693 (351 строка) — секция `{settingsTab === 'system'}`

**Содержимое:**
- Компонент `SystemSettings` (системные настройки)
- Включает:
  - Настройки стиля таблиц (normal/compact/ultra)
  - Предпросмотр таблицы
  - Настройки эффектов прозрачности (glass/solid/light/deep/neon/gradient)

---

### ШАГ 15: Создание `modules/finance/hooks/useFinanceData.js`

**Новый файл:** `frontend/src/modules/finance/hooks/useFinanceData.js`

**Строки из App.jsx:** 658-730 (73 строки) — состояния и `loadData`

**Содержимое:**
- Хук `useFinanceData`
- Состояния: `summary`, `participants`, `groups`, `incomeCategories`, `expenseCategories`, `incomes`, `expenses`, `forecastData`, `loading`, `error`
- Метод `loadData` (загрузка всех данных)
- Метод `refresh` (обновление данных)

---

### ШАГ 16: Создание `modules/finance/api/financeApi.js`

**Новый файл:** `frontend/src/modules/finance/api/financeApi.js`

**Содержимое:**
```javascript
import { api, API_URL } from '@core/api/api'

export const financeApi = {
  // Summary
  getSummary: () => api.get('/summary'),
  
  // Participants
  getParticipants: () => api.get('/participants'),
  createParticipant: (data, allowDuplicate) => 
    api.post('/participants', data, { params: { allow_duplicate: allowDuplicate } }),
  updateParticipant: (id, data) => api.put(`/participants/${id}`, data),
  deleteParticipant: (id) => api.delete(`/participants/${id}`),
  
  // Groups
  getGroups: () => api.get('/groups'),
  
  // Categories
  getIncomeCategories: () => api.get('/income_categories'),
  getExpenseCategories: () => api.get('/expense_categories'),
  createCategory: (type, name) => api.post(`/${type}_categories`, { name }),
  updateCategory: (type, id, name) => api.put(`/${type}_categories/${id}`, { name }),
  deleteCategory: (type, id) => api.delete(`/${type}_categories/${id}`),
  
  // Transactions
  getIncomes: () => api.get('/incomes'),
  getExpenses: () => api.get('/expenses'),
  createIncome: (data) => api.post('/incomes', data),
  createExpense: (data) => api.post('/expenses', data),
  updateIncome: (id, data) => api.put(`/incomes/${id}`, data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteIncome: (id) => api.delete(`/incomes/${id}`),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  
  // Forecast
  getForecast: () => api.get('/finance/forecast')
}
```

---

### ШАГ 17: Рефакторинг ParticipantsManager (9 файлов)

#### 17.1: `modules/finance/components/Participants/common/StatusBadge.jsx`

**Строки из ParticipantsManager.jsx:** 8-38 (31 строка)

**Содержимое:**
- Компонент `StatusBadge` (бейдж статуса участника)
- Пропсы: `isActive`, `balance`
- 4 состояния: Пауза, Долг, Аванс, Активен

---

#### 17.2: `modules/finance/components/Participants/common/BalanceCell.jsx`

**Строки из ParticipantsManager.jsx:** 41-50 (10 строк)

**Содержимое:**
- Компонент `BalanceCell` (отображение баланса с цветом)
- Пропсы: `balance`
- 3 состояния: положительный, отрицательный, ноль

---

#### 17.3: `modules/finance/components/Participants/forms/PaymentForm.jsx`

**Строки из ParticipantsManager.jsx:** 53-179 (127 строк)

**Содержимое:**
- Компонент `PaymentForm` (форма внесения платежа)
- Пропсы: `participants`, `groups`, `onSubmit`, `onCancel`, `submitting`
- Внутреннее состояние: `formData` (participant_id, amount, description, date, time)
- Логика отображения информации об участнике

---

#### 17.4: `modules/finance/components/Participants/ParticipantsTable.jsx`

**Строки из ParticipantsManager.jsx:** 182-297 (116 строк)

**Содержимое:**
- Компонент `ParticipantsTable` (таблица участников)
- Пропсы: `participants`, `onEdit`, `onView`, `onActivate`, `onDeactivate`, `onPayment`
- Отображение: имя, группа, статус, дата начала, внесено, баланс, оплачено до, следующий платёж, действия

---

#### 17.5: `modules/finance/components/Participants/ParticipantsSummary.jsx`

**Строки из ParticipantsManager.jsx:** 301-350 (50 строк)

**Содержимое:**
- Компонент `ParticipantsSummary` (сводка по участникам)
- Пропсы: `participants`
- 6 карточек: Всего, Активные, На паузе, Должники, С авансом, Общий баланс

---

#### 17.6: `modules/finance/components/Participants/forms/EditParticipantModal.jsx`

**Строки из ParticipantsManager.jsx:** 353-444 (92 строки)

**Содержимое:**
- Компонент `EditParticipantModal` (модальное окно редактирования)
- Пропсы: `participant`, `groups`, `onSave`, `onClose`
- Поля: имя, группа, дата начала, чекбокс "активен"

---

#### 17.7: `modules/finance/components/Participants/forms/DeactivateModal.jsx`

**Строки из ParticipantsManager.jsx:** 447-494 (48 строк)

**Содержимое:**
- Компонент `DeactivateModal` (модальное окно деактивации)
- Пропсы: `participant`, `onConfirm`, `onClose`
- Поле: причина (необязательно)

---

#### 17.8: `modules/finance/components/Participants/forms/ActivateModal.jsx`

**Строки из ParticipantsManager.jsx:** 497-568 (72 строки)

**Содержимое:**
- Компонент `ActivateModal` (модальное окно активации)
- Пропсы: `participant`, `groups`, `onConfirm`, `onClose`
- Поля: группа, дата начала
- Отображение текущего баланса

---

#### 17.9: `modules/finance/components/Participants/ParticipantDetailPanel.jsx`

**Строки из ParticipantsManager.jsx:** 571-707 (137 строк)

**Содержимое:**
- Компонент `ParticipantDetailPanel` (панель деталей участника)
- Пропсы: `participant`, `incomes`, `onClose`
- 2 карточки: Информация, Финансы
- Таблица истории платежей
- Подсказка

---

#### 17.10: `modules/finance/components/Participants/ParticipantsManager.jsx` (обновлённый)

**Строки из ParticipantsManager.jsx:** 715-981 (267 строк) — основной компонент

**Содержимое:**
- Главный компонент `ParticipantsManager`
- Состояния: `participants`, `groups`, `incomes`, `filter`, `editingParticipant`, `deactivatingParticipant`, `activatingParticipant`, `paymentParticipant`, `showPaymentForm`, `viewingParticipant`, `loading`, `submitting`
- Методы: `loadData`, `handlePayment`, `handleView`, `handleEdit`, `handleDeactivate`, `handleActivate`
- Рендеринг: заголовок, индикатор загрузки, `ParticipantsSummary`, `PaymentForm`, фильтры, `ParticipantsTable`, модальные окна

---

### ШАГ 18: Обновление `modules/finance/components/index.js`

**Файл:** `frontend/src/modules/finance/components/index.js`

**Добавить экспорт:**
```javascript
// Экспорт компонентов Finance
export { ExpenseByCategory, IncomeByCategory, ByParticipant, BalanceOverTime, StatCard } from './Stats'
export { TransactionFilters } from './Filters'
export { ParticipantsManager } from './Participants'
export { GroupsManager } from './GroupsManager'
export { FinanceForecast } from './FinanceForecast'
export { MonthlyExpensesManager } from './MonthlyExpensesManager'

// Новые компоненты
export { SummaryCard } from './SummaryCard'
export { StatsView } from './StatsView'
export { Dashboard } from './Dashboard/Dashboard'
export { SummaryCards } from './Dashboard/SummaryCards'
export { TransactionsEditor } from './Transactions/TransactionsEditor'
export { TransactionForm } from './Transactions/TransactionForm'
export { TransactionTable } from './Transactions/TransactionTable'
export { AllTransactionsTable } from './Transactions/AllTransactionsTable'
```

---

### ШАГ 19: Обновление `modules/finance/components/Participants/index.js`

**Новый файл:** `frontend/src/modules/finance/components/Participants/index.js`

**Содержимое:**
```javascript
// Экспорт компонентов Participants
export { ParticipantsManager } from './ParticipantsManager'
export { ParticipantsTable } from './ParticipantsTable'
export { ParticipantDetailPanel } from './ParticipantDetailPanel'
export { ParticipantsSummary } from './ParticipantsSummary'

// Формы
export { PaymentForm } from './forms/PaymentForm'
export { EditParticipantModal } from './forms/EditParticipantModal'
export { ActivateModal } from './forms/ActivateModal'
export { DeactivateModal } from './forms/DeactivateModal'

// Общие компоненты
export { StatusBadge } from './common/StatusBadge'
export { BalanceCell } from './common/BalanceCell'
```

---

### ШАГ 20: Обновление `modules/settings/components/index.js`

**Файл:** `frontend/src/modules/settings/components/index.js`

**Добавить экспорт:**
```javascript
export { BackupManager } from './BackupManager'
export { SystemSettings } from './SystemSettings'
```

---

### ШАГ 21: Создание `modules/finance/hooks/index.js`

**Новый файл:** `frontend/src/modules/finance/hooks/index.js`

**Содержимое:**
```javascript
export { useFinanceData } from './useFinanceData'
```

---

### ШАГ 22: Создание `modules/finance/api/index.js`

**Новый файл:** `frontend/src/modules/finance/api/index.js`

**Содержимое:**
```javascript
export { financeApi } from './financeApi'
```

---

### ШАГ 23: Обновление `core/hooks/index.js`

**Новый файл:** `frontend/src/core/hooks/index.js`

**Содержимое:**
```javascript
export { useFinanceData } from './useFinanceData'
export { useParticipants } from './useParticipants'
export { useTransactions } from './useTransactions'
```

---

### ШАГ 24: Финальный `App.jsx` (~200 строк)

**Файл:** `frontend/src/App.jsx`

**Строки из оригинала:** Только роутинг и layout (строки 651-657, 956-967, 1328-1342, 1694-1855 с изменениями)

**Содержимое:**
- Импорты компонентов
- Главный компонент `App`
- Состояния UI: `activeModule`, `activeItem`, `sidebarCollapsed`, `settingsTab`, `tableStyle`, `glassEffect`, `theme`, `showExportModal`, `exportOptions`
- Эффекты: применение темы, сохранение настроек
- Роутинг по `activeItem` и `activeModule`
- Рендеринг:
  - `{activeItem === 'finance-stats'}` → `<Dashboard />`
  - `{activeItem === 'finance-editor'}` → `<TransactionsEditor />`
  - `{activeItem === 'finance-participants'}` → `<ParticipantsManager />`
  - `{activeItem === 'finance-forecast'}` → `<FinanceForecast />`
  - `{activeModule === 'settings'}` → `<BackupManager />` и `<SystemSettings />`
- Модальные окна: экспорт, редактирование транзакции
- `<ToastContainer />`

---

## 🔍 ПРОВЕРКА ПОСЛЕ КАЖДОГО ШАГА

После каждого шага выполняется:

1. **Сравнение с оригиналом** — убедиться, что код скопирован без изменений
2. **Проверка импортов** — все импорты указаны корректно
3. **Проверка экспортов** — все компоненты экспортированы
4. **Визуальная проверка** — структура кода соответствует оригиналу

---

## 📊 ИТОГОВАЯ СТАТИСТИКА

| Категория | Файлов | Строк (примерно) |
|-----------|--------|------------------|
| **Создано новых** | 25 | ~2500 |
| **Обновлено** | 6 | ~300 |
| **Бэкапы** | 2 | ~2836 |
| **Итого** | 33 | ~5636 |

### Распределение строк:

| Компонент | Строк |
|-----------|-------|
| App.jsx (финальный) | ~200 |
| ParticipantsManager (главный) | ~200 |
| ParticipantsTable | ~150 |
| ParticipantDetailPanel | ~150 |
| TransactionForm | ~200 |
| AllTransactionsTable | ~90 |
| StatsView | ~110 |
| Dashboard | ~360 |
| SummaryCards | ~80 |
| TransactionsEditor | ~155 |
| SystemSettings | ~350 |
| PaymentForm | ~130 |
| EditParticipantModal | ~95 |
| ActivateModal | ~75 |
| DeactivateModal | ~50 |
| ParticipantsSummary | ~50 |
| StatusBadge | ~35 |
| BalanceCell | ~15 |
| ConfirmModal | ~35 |
| ListModal | ~50 |
| Прочие (API, hooks, index) | ~300 |

---

## ✅ КРИТЕРИИ ЗАВЕРШЕНИЯ

1. [ ] Все бэкапы созданы
2. [ ] Все новые файлы созданы
3. [ ] Код скопирован без изменений (кроме импортов)
4. [ ] Все импорты обновлены
5. [ ] Все экспорты настроены
6. [ ] App.jsx сокращён до ~200 строк
7. [ ] Приложение запускается без ошибок
8. [ ] Вся функциональность сохранена

---

## ⚠️ ВАЖНЫЕ ПРИМЕЧАНИЯ

1. **Не изменять код** — только копировать в новые файлы
2. **Сохранять все комментарии** — включая emoji
3. **Сохранять стиль** — отступы, кавычки, форматирование
4. **Проверять импорты** — пути через `@core/` и `@modules/`
5. **После каждого шага** — сверяться с оригиналом

---

**Готов к началу выполнения?**
