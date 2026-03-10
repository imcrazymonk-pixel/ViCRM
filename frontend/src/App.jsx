import { useState, useEffect, useCallback } from 'react'
import { ToastContainer } from 'react-toastify'
import axios from 'axios'
import { Layout, ConfirmModal, ListModal } from '@core/components'
import {
  Dashboard,
  TransactionsEditor,
  ParticipantsManager,
  FinanceForecast,
  MonthlyExpensesManager,
  GroupsManager
} from '@modules/finance/components'
import { BackupManager, SystemSettings } from '@modules/settings/components'
import { exportTransactions } from '@core/utils/export'
import {
  notifySuccess,
  notifyError,
  notifyParticipantAdded,
  notifyTransactionAdded,
  notifyDeleted,
  notifyDeleteError
} from '@core/utils/notifications'
import { formatMoney, formatDate } from '@core/utils/format'
import { TransactionForm } from '@modules/finance/components'

const API_URL = 'http://localhost:8002/api'

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

  // UI состояния
  const [activeTab, setActiveTab] = useState('incomes')
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

  // Модальное окно экспорта
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportOptions, setExportOptions] = useState({
    dateFrom: '',
    dateTo: '',
    type: 'all',
    participant: 'all'
  })

  // Confirm modal состояния
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

  // Редактирование транзакций
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Вычисление средних значений
  const avgIncome = incomes.length > 0
    ? (incomes.reduce((sum, i) => sum + i.amount, 0) / incomes.length).toFixed(2)
    : 0

  const avgExpense = expenses.length > 0
    ? (expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length).toFixed(2)
    : 0

  // Расходуем в месяц (из прогноза)
  const monthlyExpense = forecastData?.expected_monthly_expense || 0

  // Загрузка данных
  const loadData = useCallback(async () => {
    try {
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

  // Обработка переключения пунктов меню
  useEffect(() => {
    if (activeItem === 'finance-editor') {
      setActiveModule('finance')
    } else if (activeItem === 'finance-participants') {
      setActiveModule('finance')
    } else if (activeItem === 'finance-forecast') {
      setActiveModule('finance')
    } else if (activeItem === 'settings-backups') {
      setSettingsTab('backups')
      setActiveModule('settings')
    } else if (activeItem === 'settings-system') {
      setSettingsTab('system')
      setActiveModule('settings')
    } else if (activeItem === 'finance-stats') {
      setActiveModule('finance')
    }
  }, [activeItem])

  // === СУЩНОСТИ ===
  const [allowDuplicate, setAllowDuplicate] = useState(false)

  const addParticipant = async (e) => {
    e.preventDefault()
    if (!newParticipant.name.trim()) return

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
    const { type, id } = confirmData
    try {
      if (type === 'participant') {
        await axios.delete(`${API_URL}/participants/${id}`)
      } else if (type === 'income_category') {
        await axios.delete(`${API_URL}/income_categories/${id}`)
      } else if (type === 'expense_category') {
        await axios.delete(`${API_URL}/expense_categories/${id}`)
      } else if (type === 'income') {
        await axios.delete(`${API_URL}/incomes/${id}`)
      } else if (type === 'expense') {
        await axios.delete(`${API_URL}/expenses/${id}`)
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
              <Dashboard
                summary={summary}
                avgIncome={avgIncome}
                avgExpense={avgExpense}
                monthlyExpense={monthlyExpense}
                forecastData={forecastData}
                participants={participants}
                incomes={incomes}
                expenses={expenses}
                incomeCategories={incomeCategories}
                expenseCategories={expenseCategories}
                filteredIncomes={filteredIncomes}
                filteredExpenses={filteredExpenses}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                setFilteredIncomes={setFilteredIncomes}
                setFilteredExpenses={setFilteredExpenses}
                deleteTransaction={deleteTransaction}
                openEditModal={openEditModal}
                setShowExportModal={setShowExportModal}
                setActiveItem={setActiveItem}
              />
            )}

            {/* === РЕДАКТОР (finance-editor) === */}
            {activeItem === 'finance-editor' && (
              <TransactionsEditor
                newParticipant={newParticipant}
                setNewParticipant={setNewParticipant}
                allowDuplicate={allowDuplicate}
                setAllowDuplicate={setAllowDuplicate}
                groups={groups}
                addParticipant={addParticipant}
                participants={participants}
                incomeCategories={incomeCategories}
                expenseCategories={expenseCategories}
                addIncome={addIncome}
                addExpense={addExpense}
                loading={loading}
                openModal={openModal}
                newCategory={newCategory}
                setNewCategory={setNewCategory}
                addCategory={addCategory}
                incomes={incomes}
                expenses={expenses}
                deleteTransaction={deleteTransaction}
                openEditModal={openEditModal}
              />
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
            <div className="mb-3">
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
              <SystemSettings
                tableStyle={tableStyle}
                setTableStyle={setTableStyle}
                glassEffect={glassEffect}
                setGlassEffect={setGlassEffect}
              />
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
                  initialData={editingTransaction}
                  isEdit={true}
                  onSubmit={handleEditTransaction}
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
