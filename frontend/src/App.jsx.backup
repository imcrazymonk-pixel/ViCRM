import { useState, useEffect, useCallback } from 'react'
import { ToastContainer } from 'react-toastify'
import axios from 'axios'
import { Layout } from '@core/components'
import {
  ExpenseByCategory,
  IncomeByCategory,
  ByParticipant,
  BalanceOverTime,
  StatCard
} from '@modules/finance/components'
import { exportTransactions, exportReport, ExportButton } from '@core/utils/export'
import {
  notifySuccess,
  notifyError,
  notifyInfo,
  notifyParticipantAdded,
  notifyTransactionAdded,
  notifyDeleted,
  notifyExport,
  notifyDeleteError
} from '@core/utils/notifications'
import { formatMoney, formatDate } from '@core/utils/format'
import { TransactionFilters } from '@modules/finance/components'
import { BackupManager } from '@modules/settings/components'
import { GroupsManager, FinanceForecast, MonthlyExpensesManager, ParticipantsManager } from '@modules/finance/components'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, Label } from 'recharts'

const API_URL = 'http://localhost:8002/api'

// Компонент карточки сводки
const SummaryCard = ({ label, value, type = '' }) => (
  <div className={`summary-card ${type}`}>
    <div className="label">{label}</div>
    <div className="value">{value}</div>
  </div>
)

// Компонент формы транзакции (для создания и редактирования)
const TransactionForm = ({ title, icon, type, participants, categories, onSubmit, disabled, onOpenSettings, initialData, isEdit = false }) => {
  const [formData, setFormData] = useState(initialData || {
    participant_id: '',
    category_id: '',
    amount: '',
    currency: 'RUB',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5)
  })

  // Обновляем formData при изменении initialData
  useEffect(() => {
    if (initialData) {
      const date = initialData.created_at ? new Date(initialData.created_at) : new Date()
      setFormData({
        participant_id: initialData.participant_id || '',
        category_id: initialData.category_id || '',
        amount: initialData.amount || '',
        currency: initialData.currency || 'RUB',
        description: initialData.description || '',
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().split(' ')[0].substring(0, 5)
      })
    }
  }, [initialData])

  // 🆕 Вычисляем рекомендации для дохода при выборе участника
  const selectedParticipant = participants.find(p => p.id === parseInt(formData.participant_id))
  const recommendedAmount = selectedParticipant && type === 'income' ? (() => {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthlyFee = selectedParticipant.group_monthly_fee || 0
    if (!monthlyFee) return null
    
    // Если есть долг (paid_until_month < текущего)
    if (selectedParticipant.paid_until_month && selectedParticipant.paid_until_month < currentMonth) {
      const debtMonths = Math.ceil((new Date(currentMonth + '-01') - new Date(selectedParticipant.paid_until_month + '-01')) / (1000 * 60 * 60 * 24 * 30))
      return debtMonths * monthlyFee
    }
    // Иначе рекомендуемая сумма = ежемесячный платёж
    return monthlyFee
  })() : null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.participant_id || !formData.category_id) return

    // Создаём дату и время из выбранных значений
    const dateTime = new Date(`${formData.date}T${formData.time || '00:00'}`)

    onSubmit({
      participant_id: parseInt(formData.participant_id),
      category_id: parseInt(formData.category_id),
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      description: formData.description,
      created_at: dateTime.toISOString()
    })
    
    // Очищаем форму только если не режим редактирования
    if (!isEdit) {
      setFormData({
        participant_id: '',
        category_id: '',
        amount: '',
        currency: 'RUB',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5)
      })
    }
  }

  const isEditing = Object.keys(initialData || {}).length > 0

  return (
    <div className="action-card">
      <div className="card-header">
        <h5><i className={`bi ${icon}`}></i> {isEditing && isEdit ? '✏️ Редактирование' : title}</h5>
        {onOpenSettings && (
          <button className="btn-icon" onClick={onOpenSettings} title="Управление категориями">
            <i className="bi bi-gear"></i>
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <select
          className="form-select mb-2"
          value={formData.participant_id}
          onChange={(e) => setFormData({ ...formData, participant_id: e.target.value })}
          required
        >
          <option value="">Контрагент</option>
          {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        
        {/* 🆕 Информация об участнике для дохода */}
        {selectedParticipant && type === 'income' && (
          <div className="alert alert-info mb-2 py-2 px-3 small">
            <div><strong>Группа:</strong> {selectedParticipant.group_name || '—'}</div>
            <div><strong>Оплачено до:</strong> {selectedParticipant.paid_until_month || '—'}</div>
            <div><strong>Баланс:</strong> {selectedParticipant.balance >= 0 ? `+${selectedParticipant.balance}₽` : `${selectedParticipant.balance}₽`}</div>
            {recommendedAmount !== null && (
              <div className="mt-1">
                <strong>Рекомендуемая сумма:</strong> <span className="text-success fw-bold">{recommendedAmount}₽</span>
                {selectedParticipant.paid_until_month && selectedParticipant.paid_until_month < new Date().toISOString().slice(0, 7) && (
                  <span className="text-danger ms-2">⚠️ Есть задолженность</span>
                )}
              </div>
            )}
          </div>
        )}
        
        <select
          className="form-select mb-2"
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          required
        >
          <option value="">Категория</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="d-flex gap-2 mb-2">
          <input
            type="number"
            className="form-control"
            placeholder="Сумма"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
          <select
            className="form-select"
            style={{ width: '100px' }}
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          >
            <option value="RUB">RUB</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div className="d-flex gap-2 mb-2">
          <input
            type="date"
            className="form-control"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
          <input
            type="time"
            className="form-control"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            style={{ width: '100px' }}
          />
        </div>
        <input
          type="text"
          className="form-control mb-2"
          placeholder={type === 'income' ? 'Комментарий' : 'На что'}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <button
          type="submit"
          className={`btn btn-${type === 'income' ? 'success' : 'danger'} w-100`}
          disabled={disabled || !participants.length}
        >
          {type === 'income' ? 'Внести' : 'Списать'}
        </button>
      </form>
    </div>
  )
}

// Компонент таблицы транзакций
const TransactionTable = ({ data, type, onDelete, onEdit }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <i className={`bi bi-${type === 'income' ? 'inbox' : 'cart-x'}`}></i>
        <p>Нет {type === 'income' ? 'поступлений' : 'расходов'}</p>
      </div>
    )
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'RUB'
    }).format(amount)
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Контрагент</th>
          <th>Категория</th>
          <th>Описание</th>
          <th>Сумма</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id}>
            <td>{formatDate(item.created_at)}</td>
            <td>{item.participant_name}</td>
            <td><span className="badge-soft">{item.category_name}</span></td>
            <td>{item.description || '—'}</td>
            <td className={type === 'income' ? 'amount-positive' : 'amount-negative'}>
              {type === 'income' ? '+' : '-'}{formatCurrency(item.amount, item.currency || 'RUB')}
            </td>
            <td>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-outline-primary btn-sm action-btn"
                  onClick={() => onEdit(item)}
                  title="Редактировать"
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="btn btn-outline-danger btn-sm action-btn"
                  onClick={() => onDelete(item.id)}
                  title="Удалить"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Компонент единой таблицы всех транзакций
const AllTransactionsTable = ({ incomes, expenses, onDelete, onEdit }) => {
  // 🆕 Объединяем и сортируем по дате (показываем все, а не только 10)
  const allTransactions = [
    ...incomes.map(i => ({ ...i, type: 'income' })),
    ...expenses.map(e => ({ ...e, type: 'expense' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const recentTransactions = allTransactions

  if (recentTransactions.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-inbox"></i>
        <p>Нет транзакций</p>
      </div>
    )
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'RUB'
    }).format(amount)
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Тип</th>
          <th>Контрагент</th>
          <th>Категория</th>
          <th>Описание</th>
          <th>Сумма</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {recentTransactions.map((item, index) => (
          <tr key={`${item.type}-${item.id}-${index}`}>
            <td>{formatDate(item.created_at)}</td>
            <td>
              <span className={`badge-soft ${item.type === 'income' ? 'text-success' : 'text-danger'}`}>
                {item.type === 'income' ? '📈 Доход' : '📉 Расход'}
              </span>
            </td>
            <td>{item.participant_name}</td>
            <td><span className="badge-soft">{item.category_name}</span></td>
            <td>{item.description || '—'}</td>
            <td className={item.type === 'income' ? 'amount-positive' : 'amount-negative'}>
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, item.currency || 'RUB')}
            </td>
            <td>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-outline-primary btn-sm action-btn"
                  onClick={() => onEdit(item)}
                  title="Редактировать"
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="btn btn-outline-danger btn-sm action-btn"
                  onClick={() => onDelete(item.type === 'income' ? 'incomes' : 'expenses', item.id)}
                  title="Удалить"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Компонент модального окна подтверждения
const ConfirmModal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header bg-danger">
            <h5 className="modal-title">
              <i className="bi bi-exclamation-triangle"></i> {title}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <p className="text-white">{message}</p>
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Отмена
            </button>
            <button type="button" className="btn btn-danger" onClick={onConfirm}>
              <i className="bi bi-trash"></i> Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Компонент модального окна со списком
const ListModal = ({ show, title, headerClass, items, onEdit, onDelete, formatItemStats }) => {
  if (!show) return null

  return (
    <div className="modal show d-block" tabIndex="-1" onClick={() => onEdit(null)}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className={`modal-header ${headerClass}`}>
            <h5 className="modal-title"><i className="bi bi-folder"></i> {title}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={() => onEdit(null)}></button>
          </div>
          <div className="modal-body">
            {items.length === 0 ? (
              <p className="text-center text-muted">Нет элементов</p>
            ) : (
              <div className="list-group">
                {items.map(item => (
                  <div key={item.id} className="list-group-item p-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="text-white">{item.name}</strong>
                        <div className="text-muted small mt-1">
                          {formatItemStats(item)}
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            const newName = prompt('Новое название:', item.name)
                            if (newName && newName !== item.name) onEdit({ ...item, name: newName })
                          }}
                          title="Редактировать"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDelete(item.id, item.name)}
                          title="Удалить"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Компонент просмотра статистики
const StatsView = ({ incomes, expenses, summary, participants, incomeCategories, expenseCategories }) => {
  // Считаем общие суммы
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalBalance = totalIncome - totalExpense

  // Данные для бублика - только 2 сектора: Доходы и Расходы
  const allCategories = [
    { name: '📈 Доходы', value: totalIncome, color: '#10b981' },
    { name: '📉 Расходы', value: totalExpense, color: '#ef4444' }
  ].filter(d => d.value > 0)

  return (
    <div>
      {/* Графики */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {/* Единый бублик: Доходы и Расходы */}
        <div className="chart-container" style={{
          padding: '10px',
          borderRadius: '16px',
          width: '400px',
          maxWidth: '400px'
        }}>
          <div className="chart-title" style={{ marginBottom: '10px', paddingLeft: '10px' }}>
            <i className="bi bi-pie-chart"></i> Структура финансов
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={allCategories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1.5}
              >
                {allCategories.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.2))',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(30, 30, 40, 0.98)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  padding: '8px 12px'
                }}
                itemStyle={{
                  color: '#fff'
                }}
                formatter={(value, name) => [`${value.toFixed(2)} ₽`, name]}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                wrapperStyle={{
                  color: '#fff',
                  fontSize: '0.875rem',
                  paddingTop: '20px'
                }}
              />
              <Label
                value={`💰 ${totalBalance.toLocaleString('ru-RU')} ₽`}
                position="center"
                style={{
                  fill: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: '700'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Динамика баланса */}
        <div className="chart-container" style={{
          padding: '10px',
          borderRadius: '16px',
          width: '1050px',
          maxWidth: '1050px'
        }}>
          <div style={{ marginBottom: '10px', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            <i className="bi bi-graph-up"></i> Динамика баланса
          </div>
          <BalanceOverTime incomes={incomes} expenses={expenses} />
        </div>
      </div>
    </div>
  )
}

function App() {
  // Состояния данных
  const [summary, setSummary] = useState({ balance: 0, total_income: 0, total_expense: 0, participants_count: 0 })
  const [participants, setParticipants] = useState([])
  const [groups, setGroups] = useState([])
  const [incomeCategories, setIncomeCategories] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [forecastData, setForecastData] = useState(null)

  // Фильтрованные данные
  const [filteredIncomes, setFilteredIncomes] = useState([])
  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [showBackups, setShowBackups] = useState(false)

  // UI состояния
  const [activeTab, setActiveTab] = useState('incomes')
  const [showStats, setShowStats] = useState(false)
  const [statsTab, setStatsTab] = useState('overview')
  const [showModal, setShowModal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Состояния бокового меню
  const [activeModule, setActiveModule] = useState('finance')
  const [activeItem, setActiveItem] = useState('finance-stats')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Вкладки настроек
  const [settingsTab, setSettingsTab] = useState('backups')
  
  // Стиль таблиц
  const [tableStyle, setTableStyle] = useState(() => {
    const saved = localStorage.getItem('tableStyle')
    return saved || 'normal'
  })

  // Сохранение стиля таблиц
  useEffect(() => {
    localStorage.setItem('tableStyle', tableStyle)
  }, [tableStyle])

  // Эффект прозрачности
  const [glassEffect, setGlassEffect] = useState(() => {
    const saved = localStorage.getItem('glassEffect')
    return saved || 'glass'
  })

  // Сохранение эффекта прозрачности и установка атрибута
  useEffect(() => {
    localStorage.setItem('glassEffect', glassEffect)
    document.documentElement.setAttribute('data-glass-effect', glassEffect)
  }, [glassEffect])
  
  // Установка атрибута при первой загрузке
  useEffect(() => {
    const saved = localStorage.getItem('glassEffect') || 'glass'
    document.documentElement.setAttribute('data-glass-effect', saved)
  }, [])
  
  // Модальное окно экспорта
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all', // all, income, expense
    participant: 'all'
  })

  // Обработка переключения пунктов меню
  useEffect(() => {
    // === ФИНАНСЫ ===
    // finance-stats -> сводка, графики (только просмотр)
    // finance-editor -> формы ввода + категории + шаблоны
    // finance-forecast -> финансовый прогноз
    // finance-participants -> управление участниками

    // === НАСТРОЙКИ ===
    // При переключении на настройки показываем последнюю активную вкладку

    if (activeItem === 'finance-editor') {
      // Показываем формы ввода и категории
      setShowStats(false)
      setActiveTab('incomes')
      setActiveModule('finance')
    } else if (activeItem === 'finance-participants') {
      // Показываем управление участниками
      setShowStats(false)
      setActiveModule('finance')
    } else if (activeItem === 'finance-forecast') {
      // Показываем финансовый прогноз
      setShowStats(false)
      setActiveModule('finance')
    } else if (activeItem === 'settings-backups') {
      // Показываем бэкапы
      setShowStats(true)
      setStatsTab('backups')
      setActiveModule('settings')
    } else if (activeItem === 'settings-system') {
      // Системные настройки (пока ничего)
      setShowStats(false)
      setActiveModule('settings')
    } else if (activeItem === 'finance-stats') {
      // Показываем статистику (по умолчанию)
      setActiveModule('finance')
    }
  }, [activeItem])

  // Confirm modal состояние
  const [confirmData, setConfirmData] = useState({ show: false, type: '', id: null, message: '' })

  // Состояния форм
  const [newParticipant, setNewParticipant] = useState({ name: '', group_id: '', start_date: '' })
  const [newCategory, setNewCategory] = useState({ name: '' })

  // Тема приложения
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'dark'
  })

  // Применение темы
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Загрузка данных
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [summaryRes, participantsRes, groupsRes, incomeCatsRes, expenseCatsRes, incomesRes, expensesRes, forecastRes] = await Promise.all([
        axios.get(`${API_URL}/summary`),
        axios.get(`${API_URL}/participants`),
        axios.get(`${API_URL}/groups`),
        axios.get(`${API_URL}/income_categories`),
        axios.get(`${API_URL}/expense_categories`),
        axios.get(`${API_URL}/incomes`),
        axios.get(`${API_URL}/expenses`),
        axios.get(`${API_URL}/finance/forecast`)
      ])

      setSummary(summaryRes.data)
      setParticipants(participantsRes.data)
      setGroups(groupsRes.data)
      setIncomeCategories(incomeCatsRes.data)
      setExpenseCategories(expenseCatsRes.data)
      setIncomes(incomesRes.data)
      setExpenses(expensesRes.data)
      setFilteredIncomes(incomesRes.data)
      setFilteredExpenses(expensesRes.data)
      setForecastData(forecastRes.data)
    } catch (err) {
      setError('Ошибка загрузки данных: ' + err.message)
      console.error('Ошибка загрузки:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // === СУЩНОСТИ ===
  const [allowDuplicate, setAllowDuplicate] = useState(false)

  const addParticipant = async (e) => {
    e.preventDefault()
    if (!newParticipant.name.trim()) return
    
    // 🆕 Формируем данные для отправки
    const participantData = {
      name: newParticipant.name.trim(),
      group_id: newParticipant.group_id ? parseInt(newParticipant.group_id) : null,
      start_date: newParticipant.start_date || undefined,
      is_active: true
    }
    
    try {
      await axios.post(`${API_URL}/participants`, participantData, {
        params: { allow_duplicate: allowDuplicate }
      })
      notifyParticipantAdded(newParticipant.name)
      setNewParticipant({ name: '', group_id: '', start_date: '' })
      setAllowDuplicate(false)
      loadData()
    } catch (err) {
      // Если дубликат и чекбокс не установлен - показать подтверждение
      if (err.response?.status === 400 && err.response?.data?.detail?.includes('уже существует')) {
        const confirmed = window.confirm(
          `${err.response.data.detail}\n\nНажмите OK чтобы добавить дубликат, или Отмена для отмены.`
        )
        if (confirmed) {
          try {
            await axios.post(`${API_URL}/participants`, participantData, {
              params: { allow_duplicate: true }
            })
            notifyParticipantAdded(newParticipant.name)
            setNewParticipant({ name: '', group_id: '', start_date: '' })
            setAllowDuplicate(false)
            loadData()
          } catch (err2) {
            notifyError(err2.response?.data?.detail || 'Ошибка добавления')
          }
        }
      } else {
        notifyError(err.response?.data?.detail || 'Ошибка добавления')
      }
    }
  }

  const updateParticipant = async (item) => {
    if (!item) return
    await axios.put(`${API_URL}/participants/${item.id}`, { name: item.name })
    loadData()
  }

  const showConfirm = (type, id, name) => {
    setConfirmData({
      show: true,
      type,
      id,
      message: `Удалить "${name}"?`
    })
  }

  const confirmDelete = async () => {
    const { type, id, message } = confirmData
    try {
      if (type === 'participant') {
        await axios.delete(`${API_URL}/participants/${id}`)
        notifyDeleted('Контрагент', message.replace('Удалить "', '').replace('"?', ''))
      } else if (type === 'income_category') {
        await axios.delete(`${API_URL}/income_categories/${id}`)
        notifyDeleted('Категория дохода', message.replace('Удалить "', '').replace('"?', ''))
      } else if (type === 'expense_category') {
        await axios.delete(`${API_URL}/expense_categories/${id}`)
        notifyDeleted('Категория расхода', message.replace('Удалить "', '').replace('"?', ''))
      } else if (type === 'income') {
        await axios.delete(`${API_URL}/incomes/${id}`)
        notifyDeleted('Доход', message.replace('Удалить "', '').replace('"?', ''))
      } else if (type === 'expense') {
        await axios.delete(`${API_URL}/expenses/${id}`)
        notifyDeleted('Расход', message.replace('Удалить "', '').replace('"?', ''))
      }
      setConfirmData({ show: false, type: '', id: null, message: '' })
      loadData()
    } catch (err) {
      notifyDeleteError(err.response?.data?.detail || 'Ошибка удаления')
    }
  }

  const cancelDelete = () => {
    setConfirmData({ show: false, type: '', id: null, message: '' })
  }

  const deleteParticipant = (id, name) => showConfirm('participant', id, name)

  // === КАТЕГОРИИ ===
  const addCategory = async (type) => {
    if (!newCategory.name.trim()) return
    try {
      await axios.post(`${API_URL}/${type}_categories`, { name: newCategory.name })
      setNewCategory({ name: '' })
      loadData()
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка добавления')
    }
  }

  const updateCategory = async (type, item) => {
    if (!item) return
    await axios.put(`${API_URL}/${type}_categories/${item.id}`, { name: item.name })
    loadData()
  }

  const deleteCategory = (type, id, name) => showConfirm(`${type}_category`, id, name)

  // === ТРАНЗАКЦИИ ===
  const addIncome = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/incomes`, data)
      const participant = participants.find(p => p.id === data.participant_id)
      notifyTransactionAdded('income', formatMoney(data.amount), participant?.name || 'Контрагент')
      loadData()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка добавления')
    }
  }

  const addExpense = async (data) => {
    try {
      const res = await axios.post(`${API_URL}/expenses`, data)
      const participant = participants.find(p => p.id === data.participant_id)
      notifyTransactionAdded('expense', formatMoney(data.amount), participant?.name || 'Контрагент')
      loadData()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка добавления')
    }
  }

  const updateIncome = async (id, data) => {
    try {
      await axios.put(`${API_URL}/incomes/${id}`, data)
      notifySuccess('✅ Доход обновлён')
      loadData()
      setEditingTransaction(null)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка обновления')
    }
  }

  const updateExpense = async (id, data) => {
    try {
      await axios.put(`${API_URL}/expenses/${id}`, data)
      notifySuccess('✅ Расход обновлён')
      loadData()
      setEditingTransaction(null)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка обновления')
    }
  }

  const deleteTransaction = (type, id) => {
    const item = type === 'incomes'
      ? incomes.find(i => i.id === id)
      : expenses.find(e => e.id === id)
    showConfirm(type.slice(0, -1), id, `${item?.participant_name || 'Транзакция'} - ${formatMoney(item?.amount || 0)}`)
  }

  // === РЕДАКТИРОВАНИЕ ТРАНЗАКЦИЙ ===
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setEditingTransaction(null)
    setShowEditModal(false)
  }

  const handleEditTransaction = async (data) => {
    if (!editingTransaction) return
    
    if (editingTransaction.type === 'income') {
      await updateIncome(editingTransaction.id, data)
    } else {
      await updateExpense(editingTransaction.id, data)
    }
  }

  const openModal = (type) => setShowModal(type)
  const closeModal = () => setShowModal(null)

  // Форматирование статистики
  const formatParticipantStats = (p) => 
    `📈 ${p.incomes_count} доходов  •  📉 ${p.expenses_count} расходов`
  
  const formatCategoryStats = (c) =>
    `${c.transactions_count} транзакций • ${formatMoney(c.total_amount)}`

  // Вычисление средних значений
  const avgIncome = incomes.length > 0
    ? (incomes.reduce((sum, i) => sum + i.amount, 0) / incomes.length).toFixed(2)
    : 0

  const avgExpense = expenses.length > 0
    ? (expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length).toFixed(2)
    : 0

  // Расходуем в месяц (из прогноза - обязательные ежемесячные платежи)
  const monthlyExpense = forecastData?.expected_monthly_expense || 0

  if (loading && !incomes.length) {
    return (
      <div className="app-container">
        <div className="empty-state">
          <i className="bi bi-hourglass-split"></i>
          <p>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <Layout 
      activeItem={activeItem} 
      onItemChange={setActiveItem}
      theme={theme}
      onToggleTheme={(newTheme) => {
        console.log('Theme change requested:', newTheme)
        setTheme(newTheme)
      }}
    >
      {/* Уведомление об ошибке */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Основной контент */}
      <div className={`content-area table-style-${tableStyle}`}>
          {/* === ФИНАНСЫ === */}
          {activeModule === 'finance' && (
            <>
              {/* === СТАТИСТИКА (finance-stats) === */}
              {activeItem === 'finance-stats' && (
            <>
              {/* Заголовок в стиле CoreUI + Кнопка Экспорт */}
              <div className="content-header mb-3" style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-start' }}>
                <h4><i className="bi bi-bar-chart-line"></i> Статистика</h4>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setShowExportModal(true)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="bi bi-file-earmark-arrow-down"></i> Экспорт
                </button>
              </div>

              {/* Карточки сводки - объединённый блок */}
              <div className="summary-container">
                <div className="summary-cards-grid">
                  {/* Баланс */}
                  <div className="summary-info-card balance-card">
                    <div className="card-label">💰 Баланс</div>
                    <div className="card-value balance-value">{formatMoney(summary.balance)}</div>
                  </div>
                  {/* Доходы */}
                  <div className="summary-info-card income-card">
                    <div className="card-label">📈 Доходы</div>
                    <div className="card-value income-value">{formatMoney(summary.total_income)}</div>
                    <div className="card-subvalue">Средний: {formatMoney(avgIncome)}</div>
                  </div>
                  {/* Расходы */}
                  <div className="summary-info-card expense-card">
                    <div className="card-label">📉 Расходы</div>
                    <div className="card-value expense-value">{formatMoney(summary.total_expense)}</div>
                    <div className="card-subvalue">Средний: {formatMoney(avgExpense)}</div>
                  </div>
                  {/* Участники */}
                  <div
                    className="summary-info-card clickable"
                    onClick={() => setActiveItem('finance-editor')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-label">👥 Участники</div>
                    <div className="card-value" style={{ fontSize: '1.5rem' }}>{summary.participants_count}</div>
                    <div className="card-subvalue">Контрагентов всего</div>
                  </div>
                  {/* Прогноз */}
                  <div
                    className="summary-info-card clickable"
                    onClick={() => setActiveItem('finance-forecast')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-label">📉 Расходуем в месяц</div>
                    <div className="card-value expense-value">{formatMoney(monthlyExpense)}</div>
                    <div className="card-subvalue">См. прогноз</div>
                  </div>
                </div>
              </div>

              {/* Графики */}
              {/* 🆕 Сводка по участникам */}
              {forecastData && (
                <div className="summary-container" style={{ marginBottom: '20px' }}>
                  <div className="summary-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {/* Ожидаемый доход в следующем месяце */}
                    <div className="summary-info-card">
                      <div className="card-label">📅 Ожидаемый доход</div>
                      <div className="card-value" style={{ fontSize: '1.3rem', color: '#10b981' }}>
                        {formatMoney(forecastData.expected_monthly_income || 0)}
                      </div>
                      <div className="card-subvalue">В следующем месяце</div>
                    </div>
                    
                    {/* Участники с авансом */}
                    <div className="summary-info-card">
                      <div className="card-label">🟢 Внесли авансом</div>
                      <div className="card-value" style={{ fontSize: '1.3rem', color: '#10b981' }}>
                        {formatMoney(participants.filter(p => p.is_active && p.balance > 0).reduce((sum, p) => sum + p.balance, 0))}
                      </div>
                      <div className="card-subvalue">
                        {participants.filter(p => p.is_active && p.balance > 0).length} участн.
                      </div>
                    </div>
                    
                    {/* Общая задолженность */}
                    <div className="summary-info-card">
                      <div className="card-label">🔴 Общая задолженность</div>
                      <div className="card-value" style={{ fontSize: '1.3rem', color: '#ef4444' }}>
                        {formatMoney(Math.abs(participants.filter(p => p.is_active && p.balance < 0).reduce((sum, p) => sum + p.balance, 0)))}
                      </div>
                      <div className="card-subvalue">
                        {participants.filter(p => p.is_active && p.balance < 0).length} участн.
                      </div>
                    </div>
                    
                    {/* Активные участники */}
                    <div className="summary-info-card">
                      <div className="card-label">✅ Активные участники</div>
                      <div className="card-value" style={{ fontSize: '1.3rem' }}>
                        {participants.filter(p => p.is_active).length}
                      </div>
                      <div className="card-subvalue">
                        из {participants.length} всего
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <StatsView
                incomes={incomes}
                expenses={expenses}
                summary={summary}
                participants={participants}
                incomeCategories={incomeCategories}
                expenseCategories={expenseCategories}
              />

              {/* Все транзакции */}
              <div className="chart-container" style={{
                marginTop: '0',
                padding: '10px',
                paddingTop: '0',
                borderRadius: '16px',
                width: '1470px',
                maxWidth: '1470px'
              }}>
                <div className="chart-title with-divider" style={{ paddingLeft: '10px', paddingTop: '10px', paddingBottom: '8px' }}>
                  <span className="title-text">
                    <i className="bi bi-table"></i>
                    Все транзакции
                  </span>
                  <button
                    className="btn btn-sm btn-outline-primary title-btn"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <i className="bi bi-funnel"></i> Фильтры
                  </button>
                </div>

                {showFilters && (
                  <TransactionFilters
                    incomes={incomes}
                    expenses={expenses}
                    participants={participants}
                    incomeCategories={incomeCategories}
                    expenseCategories={expenseCategories}
                    onFilterChange={(filteredIncomes, filteredExpenses) => {
                      setFilteredIncomes(filteredIncomes)
                      setFilteredExpenses(filteredExpenses)
                    }}
                  />
                )}

                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <AllTransactionsTable
                    incomes={filteredIncomes}
                    expenses={filteredExpenses}
                    onDelete={(type, id) => deleteTransaction(type, id)}
                    onEdit={openEditModal}
                  />
                </div>
              </div>
            </>
          )}

          {/* === РЕДАКТОР (finance-editor) === */}
          {activeItem === 'finance-editor' && (
            <>
              <div className="content-header">
                <h4>📈 Редактор финансов</h4>
              </div>

              <div className="editor-grid">
                {/* Добавить контрагента */}
                <div className="action-card">
                  <div className="card-header">
                    <h5><i className="bi bi-people"></i> Контрагент</h5>
                    <button className="btn-icon" onClick={() => openModal('participants')} title="Управление">
                      <i className="bi bi-gear"></i>
                    </button>
                  </div>
                  <form onSubmit={addParticipant}>
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder="Название контрагента"
                      value={newParticipant.name}
                      onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                      required
                    />
                    
                    {/* 🆕 Выбор группы */}
                    <select
                      className="form-select mb-2"
                      value={newParticipant.group_id}
                      onChange={(e) => setNewParticipant({ ...newParticipant, group_id: e.target.value })}
                    >
                      <option value="">Без группы</option>
                      {groups.filter(g => g.group_type === 'contribution' && g.is_active).map(g => (
                        <option key={g.id} value={g.id}>{g.name} ({g.monthly_fee}₽/мес)</option>
                      ))}
                    </select>
                    
                    {/* 🆕 Дата начала */}
                    <div className="mb-2">
                      <label className="form-label small text-muted">Дата начала участия</label>
                      <input
                        type="month"
                        className="form-control"
                        value={newParticipant.start_date}
                        onChange={(e) => setNewParticipant({ ...newParticipant, start_date: e.target.value })}
                        placeholder="Необязательно"
                      />
                    </div>
                    
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="allowDuplicate"
                        checked={allowDuplicate}
                        onChange={(e) => setAllowDuplicate(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="allowDuplicate">
                        Разрешить дубликаты
                      </label>
                    </div>
                    <button type="submit" className="btn btn-primary w-100">Добавить</button>
                  </form>
                </div>

                {/* Внести средства */}
                <TransactionForm
                  title="Доход"
                  icon="bi-cash-coin"
                  type="income"
                  participants={participants}
                  categories={incomeCategories}
                  onSubmit={addIncome}
                  disabled={loading}
                  onOpenSettings={() => openModal('income_categories')}
                />

                {/* Расход средств */}
                <TransactionForm
                  title="Расход"
                  icon="bi-wallet2"
                  type="expense"
                  participants={participants}
                  categories={expenseCategories}
                  onSubmit={addExpense}
                  disabled={loading}
                  onOpenSettings={() => openModal('expense_categories')}
                />

                {/* Категории */}
                <div className="action-card">
                  <div className="card-header">
                    <h5><i className="bi bi-folder-plus"></i> Категории</h5>
                  </div>
                  <input
                    type="text"
                    className="form-control mb-2"
                    placeholder="Название категории"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ name: e.target.value })}
                  />
                  <div className="d-flex gap-2">
                    <button className="btn btn-success flex-fill btn-sm" onClick={() => addCategory('income')}>
                      <i className="bi bi-plus"></i> Доход
                    </button>
                    <button className="btn btn-danger flex-fill btn-sm" onClick={() => addCategory('expense')}>
                      <i className="bi bi-plus"></i> Расход
                    </button>
                  </div>
                </div>
              </div>

              {/* Группы контрагентов */}
              <div style={{ marginTop: '20px' }}>
                <GroupsManager />
              </div>

              {/* Ежемесячные платежи */}
              <div style={{ marginTop: '20px' }}>
                <MonthlyExpensesManager
                  expenseCategories={expenseCategories}
                  participants={participants}
                />
              </div>

              {/* Таблицы транзакций */}
              <div className="editor-grid" style={{ marginTop: '20px' }}>
                <div className="action-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="card-header">
                    <h5><i className="bi bi-cash-coin"></i> Доходы</h5>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <TransactionTable
                      data={incomes}
                      type="income"
                      onDelete={(id) => deleteTransaction('incomes', id)}
                      onEdit={openEditModal}
                    />
                  </div>
                </div>

                <div className="action-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="card-header">
                    <h5><i className="bi bi-wallet2"></i> Расходы</h5>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <TransactionTable
                      data={expenses}
                      type="expense"
                      onDelete={(id) => deleteTransaction('expenses', id)}
                      onEdit={openEditModal}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* === УЧАСТНИКИ (finance-participants) === */}
          {activeItem === 'finance-participants' && (
            <ParticipantsManager />
          )}

          {/* === ПРОГНОЗ (finance-forecast) === */}
          {activeItem === 'finance-forecast' && (
            <FinanceForecast />
          )}
          </>
          )}

          {/* === НАСТРОЙКИ (settings) === */}
          {activeModule === 'settings' && (
            <>
              <div className="content-header">
                <h4>⚙️ Настройки</h4>
              </div>

              {/* Вкладки настроек */}
              <div className="tabs mb-3">
                <button
                  className={`tab-btn ${settingsTab === 'backups' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('backups')}
                >
                  💾 Резервные копии
                </button>
                <button
                  className={`tab-btn ${settingsTab === 'system' ? 'active' : ''}`}
                  onClick={() => setSettingsTab('system')}
                >
                  🔧 Система
                </button>
              </div>

              {/* Контент вкладок */}
              {settingsTab === 'backups' && (
                <BackupManager
                  onClose={() => setActiveItem('finance-stats')}
                />
              )}

              {settingsTab === 'system' && (
                <div>
                  <div className="action-card">
                    <div className="card-header">
                      <h5><i className="bi bi-display"></i> Отображение таблиц</h5>
                    </div>
                    <div className="p-3">
                      <label className="filter-label mb-3">Выберите стиль отображения таблиц:</label>

                      <div className="d-flex flex-column gap-3">
                        {/* Нормальный */}
                        <label className="d-flex align-items-start gap-3 p-3 rounded"
                               style={{
                                 background: tableStyle === 'normal'
                                   ? 'rgba(139, 92, 246, 0.15)'
                                   : 'rgba(0, 0, 0, 0.2)',
                                 border: tableStyle === 'normal'
                                   ? '1px solid rgba(139, 92, 246, 0.3)'
                                   : '1px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s'
                               }}
                               onClick={() => setTableStyle('normal')}
                        >
                          <input
                            type="radio"
                            name="tableStyle"
                            className="mt-1"
                            checked={tableStyle === 'normal'}
                            onChange={() => setTableStyle('normal')}
                          />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              📊 Обычный
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              Стандартные отступы, читаемый шрифт. По умолчанию.
                            </div>
                          </div>
                        </label>

                        {/* Компактный */}
                        <label className="d-flex align-items-start gap-3 p-3 rounded"
                               style={{
                                 background: tableStyle === 'compact'
                                   ? 'rgba(139, 92, 246, 0.15)'
                                   : 'rgba(0, 0, 0, 0.2)',
                                 border: tableStyle === 'compact'
                                   ? '1px solid rgba(139, 92, 246, 0.3)'
                                   : '1px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s'
                               }}
                               onClick={() => setTableStyle('compact')}
                        >
                          <input
                            type="radio"
                            name="tableStyle"
                            className="mt-1"
                            checked={tableStyle === 'compact'}
                            onChange={() => setTableStyle('compact')}
                          />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              📐 Компактный
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              Уменьшенные отступы, шрифт 0.85rem. Экономия ~25% места.
                            </div>
                          </div>
                        </label>

                        {/* Ультра */}
                        <label className="d-flex align-items-start gap-3 p-3 rounded"
                               style={{
                                 background: tableStyle === 'ultra'
                                   ? 'rgba(139, 92, 246, 0.15)'
                                   : 'rgba(0, 0, 0, 0.2)',
                                 border: tableStyle === 'ultra'
                                   ? '1px solid rgba(139, 92, 246, 0.3)'
                                   : '1px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s'
                               }}
                               onClick={() => setTableStyle('ultra')}
                        >
                          <input
                            type="radio"
                            name="tableStyle"
                            className="mt-1"
                            checked={tableStyle === 'ultra'}
                            onChange={() => setTableStyle('ultra')}
                          />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              📏 Ультра-компактный
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              Минимальные отступы, шрифт 0.75rem. Экономия ~40% места.
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Предпросмотр */}
                      <div className="mt-4 p-3 rounded" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginBottom: '10px' }}>
                          👁️ Предпросмотр:
                        </div>
                        <table className="data-table" style={{ fontSize: tableStyle === 'ultra' ? '0.75rem' : tableStyle === 'compact' ? '0.85rem' : '0.9rem' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>Дата</th>
                              <th style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>Контрагент</th>
                              <th style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>Сумма</th>
                              <th style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>05.03.2026</td>
                              <td style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>ООО "Ромашка"</td>
                              <td style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }} className="amount-positive">+15 000 ₽</td>
                              <td style={{ padding: tableStyle === 'ultra' ? '6px 8px' : tableStyle === 'compact' ? '8px 10px' : '14px 16px' }}>
                                <button className="btn btn-outline-primary btn-sm action-btn" style={{ padding: tableStyle === 'ultra' ? '4px 8px' : '8px 12px' }}>
                                  <i className="bi bi-pencil"></i>
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Эффекты прозрачности */}
                  <div className="action-card mt-4">
                    <div className="card-header">
                      <h5><i className="bi bi-fingerprint"></i> Эффекты прозрачности</h5>
                    </div>
                    <div className="p-3">
                      <label className="filter-label mb-3">Выберите эффект оформления блоков:</label>

                      <div className="d-flex flex-column gap-3">
                        {/* Glassmorphism */}
                        <label className="d-flex align-items-start gap-3 p-3 rounded"
                               style={{
                                 background: glassEffect === 'glass'
                                   ? 'rgba(139, 92, 246, 0.15)'
                                   : 'rgba(0, 0, 0, 0.2)',
                                 border: glassEffect === 'glass'
                                   ? '1px solid rgba(139, 92, 246, 0.3)'
                                   : '1px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s'
                               }}
                               onClick={() => setGlassEffect('glass')}
                        >
                          <input
                            type="radio"
                            name="glassEffect"
                            className="mt-1"
                            checked={glassEffect === 'glass'}
                            onChange={() => setGlassEffect('glass')}
                          />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              🔮 Glassmorphism (по умолчанию)
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              Матовое стекло с размытием фона. Современный вид.
                            </div>
                          </div>
                        </label>

                        {/* Solid */}
                        <label className="d-flex align-items-start gap-3 p-3 rounded"
                               style={{
                                 background: glassEffect === 'solid'
                                   ? 'rgba(139, 92, 246, 0.15)'
                                   : 'rgba(0, 0, 0, 0.2)',
                                 border: glassEffect === 'solid'
                                   ? '1px solid rgba(139, 92, 246, 0.3)'
                                   : '1px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s'
                               }}
                               onClick={() => setGlassEffect('solid')}
                        >
                          <input
                            type="radio"
                            name="glassEffect"
                            className="mt-1"
                            checked={glassEffect === 'solid'}
                            onChange={() => setGlassEffect('solid')}
                          />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              🧱 Solid (непрозрачный)
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              Полностью непрозрачные блоки. Максимальная читаемость.
                            </div>
                          </div>
                        </label>

                        {/* Light Glass */}
                        <label className="d-flex align-items-start gap-3 p-3 rounded"
                               style={{
                                 background: glassEffect === 'light'
                                   ? 'rgba(139, 92, 246, 0.15)'
                                   : 'rgba(0, 0, 0, 0.2)',
                                 border: glassEffect === 'light'
                                   ? '1px solid rgba(139, 92, 246, 0.3)'
                                   : '1px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s'
                               }}
                               onClick={() => setGlassEffect('light')}
                        >
                          <input
                            type="radio"
                            name="glassEffect"
                            className="mt-1"
                            checked={glassEffect === 'light'}
                            onChange={() => setGlassEffect('light')}
                          />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              💎 Light Glass (лёгкий)
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              Лёгкая прозрачность 50%. Воздушный интерфейс.
                            </div>
                          </div>
                        </label>

                        {/* Deep Glass */}
                        <label className="d-flex align-items-start gap-3 p-3 rounded"
                               style={{
                                 background: glassEffect === 'deep'
                                   ? 'rgba(139, 92, 246, 0.15)'
                                   : 'rgba(0, 0, 0, 0.2)',
                                 border: glassEffect === 'deep'
                                   ? '1px solid rgba(139, 92, 246, 0.3)'
                                   : '1px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s'
                               }}
                               onClick={() => setGlassEffect('deep')}
                        >
                          <input
                            type="radio"
                            name="glassEffect"
                            className="mt-1"
                            checked={glassEffect === 'deep'}
                            onChange={() => setGlassEffect('deep')}
                          />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              🌊 Deep Glass (глубокий)
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              Усиленное размытие и прозра��ность. Глубоки�� эффект.
                            </div>
                          </div>
                        </label>

                        {/* Neon Glass */}
                        <label className="d-flex align-items-start gap-3 p-3 rounded"
                               style={{
                                 background: glassEffect === 'neon'
                                   ? 'rgba(139, 92, 246, 0.15)'
                                   : 'rgba(0, 0, 0, 0.2)',
                                 border: glassEffect === 'neon'
                                   ? '1px solid rgba(139, 92, 246, 0.3)'
                                   : '1px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s'
                               }}
                               onClick={() => setGlassEffect('neon')}
                        >
                          <input
                            type="radio"
                            name="glassEffect"
                            className="mt-1"
                            checked={glassEffect === 'neon'}
                            onChange={() => setGlassEffect('neon')}
                          />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              ✨ Neon Glass (неон)
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              Св��чение ��о краям бло��ов. Эффектный ���ид.
                            </div>
                          </div>
                        </label>

                        {/* Gradient Glass */}
                        <label className="d-flex align-items-start gap-3 p-3 rounded"
                               style={{
                                 background: glassEffect === 'gradient'
                                   ? 'rgba(139, 92, 246, 0.15)'
                                   : 'rgba(0, 0, 0, 0.2)',
                                 border: glassEffect === 'gradient'
                                   ? '1px solid rgba(139, 92, 246, 0.3)'
                                   : '1px solid transparent',
                                 cursor: 'pointer',
                                 transition: 'all 0.2s'
                               }}
                               onClick={() => setGlassEffect('gradient')}
                        >
                          <input
                            type="radio"
                            name="glassEffect"
                            className="mt-1"
                            checked={glassEffect === 'gradient'}
                            onChange={() => setGlassEffect('gradient')}
                          />
                          <div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                              🌈 Gradient Glass (градиент)
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                              Градиентная прозрачность. Яркий современный ��тиль.
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      {/* === МОДАЛЬНЫЕ ОКНА === */}

      <ListModal
        show={showModal === 'participants'}
        title="Сущности"
        headerClass="bg-primary"
        items={participants}
        onEdit={(item) => {
          if (item) updateParticipant(item)
          else closeModal()
        }}
        onDelete={deleteParticipant}
        formatItemStats={formatParticipantStats}
      />

      <ListModal
        show={showModal === 'income_categories'}
        title="Категории доходов"
        headerClass="bg-success"
        items={incomeCategories}
        onEdit={(item) => {
          if (item) updateCategory('income', item)
          else closeModal()
        }}
        onDelete={(id) => deleteCategory('income', id)}
        formatItemStats={formatCategoryStats}
      />

      <ListModal
        show={showModal === 'expense_categories'}
        title="Категории расходов"
        headerClass="bg-danger"
        items={expenseCategories}
        onEdit={(item) => {
          if (item) updateCategory('expense', item)
          else closeModal()
        }}
        onDelete={(id, name) => deleteCategory('expense', id, name)}
        formatItemStats={formatCategoryStats}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        show={confirmData.show}
        title="Подтверждение удаления"
        message={confirmData.message}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal show d-block" tabIndex="-1" onClick={() => setShowExportModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header bg-primary">
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-excel"></i> Экспорт отчёта
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowExportModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Период</label>
                  <div className="d-flex gap-2">
                    <input
                      type="date"
                      className="form-control"
                      placeholder="С"
                      value={exportOptions.dateFrom}
                      onChange={(e) => setExportOptions({ ...exportOptions, dateFrom: e.target.value })}
                    />
                    <input
                      type="date"
                      className="form-control"
                      placeholder="По"
                      value={exportOptions.dateTo}
                      onChange={(e) => setExportOptions({ ...exportOptions, dateTo: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Тип транзакций</label>
                  <select
                    className="form-select"
                    value={exportOptions.type}
                    onChange={(e) => setExportOptions({ ...exportOptions, type: e.target.value })}
                  >
                    <option value="all">Все транзакции</option>
                    <option value="income">Только доходы</option>
                    <option value="expense">Только расходы</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Контрагенты</label>
                  <select
                    className="form-select"
                    value={exportOptions.participant}
                    onChange={(e) => setExportOptions({ ...exportOptions, participant: e.target.value })}
                  >
                    <option value="all">Все контрагенты</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExportModal(false)}>
                  Отмена
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    exportTransactions(
                      exportOptions.type === 'expense' ? [] : incomes,
                      exportOptions.type === 'income' ? [] : expenses,
                      exportOptions.type
                    )
                    setShowExportModal(false)
                  }}
                >
                  <i className="bi bi-download"></i> Скачать отчёт
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && editingTransaction && (
        <div className="modal show d-block" tabIndex="-1" onClick={closeEditModal}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingTransaction.type === 'income' ? '📈 Редактирование дохода' : '📉 Редактирование расхода'}
                </h5>
                <button type="button" className="btn-close" onClick={closeEditModal}></button>
              </div>
              <div className="modal-body">
                <TransactionForm
                  title={editingTransaction.type === 'income' ? 'Доход' : 'Расход'}
                  icon={editingTransaction.type === 'income' ? 'bi-cash-coin' : 'bi-cart-x'}
                  type={editingTransaction.type}
                  participants={participants}
                  categories={editingTransaction.type === 'income' ? incomeCategories : expenseCategories}
                  onSubmit={handleEditTransaction}
                  initialData={editingTransaction}
                  isEdit={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer />
    </Layout>
  )
}

export default App
