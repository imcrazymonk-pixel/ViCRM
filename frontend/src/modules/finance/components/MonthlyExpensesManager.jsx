import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatMoney, formatDate } from '@core/utils/format'
import { notifySuccess, notifyError } from '@core/utils/notifications'

const API_URL = 'http://localhost:8002/api'

// Форма создания ежемесячного расхода
const MonthlyExpenseForm = ({ initialData, expenseCategories, participants, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    participant_id: '',
    category_id: '',
    amount: '',
    day_of_month: 1,
    description: '',
    is_active: true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.amount) {
      notifyError('Заполните название и сумму')
      return
    }
    
    onSubmit({
      ...formData,
      participant_id: formData.participant_id ? parseInt(formData.participant_id) : null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      amount: parseFloat(formData.amount),
      day_of_month: parseInt(formData.day_of_month) || 1
    })
  }

  return (
    <div className="action-card">
      <div className="card-header">
        <h5><i className="bi bi-calendar-check"></i> {initialData ? '✏️ Редактировать' : '📝 Новый'} ежемесячный платёж</h5>
        {onCancel && (
          <button className="btn-icon" onClick={onCancel}>
            <i className="bi bi-x"></i>
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="form-label small text-muted">Название</label>
          <input
            type="text"
            className="form-control"
            placeholder="Например: Хостинг Selectel"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="mb-2">
          <label className="form-label small text-muted">Контрагент (необязательно)</label>
          <select
            className="form-select"
            value={formData.participant_id}
            onChange={(e) => setFormData({ ...formData, participant_id: e.target.value })}
          >
            <option value="">Без контрагента</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="form-label small text-muted">Категория расходов</label>
          <select
            className="form-select"
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          >
            <option value="">Без категории</option>
            {expenseCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="d-flex gap-2 mb-2">
          <div style={{ flex: 1 }}>
            <label className="form-label small text-muted">Сумма (₽)</label>
            <input
              type="number"
              className="form-control"
              placeholder="500"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>
          <div style={{ width: '120px' }}>
            <label className="form-label small text-muted">День месяца</label>
            <input
              type="number"
              className="form-control"
              placeholder="1"
              min="1"
              max="31"
              value={formData.day_of_month}
              onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
            />
          </div>
        </div>

        <div className="mb-2">
          <label className="form-label small text-muted">Описание</label>
          <input
            type="text"
            className="form-control"
            placeholder="Примечание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="mb-2">
          <label className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
            <span className="form-check-label">Активен</span>
          </label>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary flex-fill">
            <i className="bi bi-check-lg"></i> Сохранить
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              <i className="bi bi-x"></i> Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

// Карточка ежемесячного расхода
const MonthlyExpenseCard = ({ expense, onEdit, onDelete, onPay }) => {
  const isOverdue = expense.last_paid_month && expense.last_paid_month < new Date().toISOString().slice(0, 7)

  return (
    <div className="action-card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5>
            <i className="bi bi-calendar-check"></i> {expense.name}
          </h5>
          <div className="d-flex gap-1">
            <button
              className="btn btn-outline-primary btn-sm action-btn"
              onClick={() => onEdit(expense)}
              title="Редактировать"
            >
              <i className="bi bi-pencil"></i>
            </button>
            <button
              className="btn btn-outline-danger btn-sm action-btn"
              onClick={() => onDelete(expense.id, expense.name)}
              title="Удалить"
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-3">
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Сумма:</span>
          <strong className="text-danger">{formatMoney(expense.amount)}</strong>
        </div>
        
        {expense.participant_name && (
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Контрагент:</span>
            <span>{expense.participant_name}</span>
          </div>
        )}
        
        {expense.category_name && (
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Категория:</span>
            <span className="badge-soft">{expense.category_name}</span>
          </div>
        )}
        
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">День платежа:</span>
          <span>{expense.day_of_month}-е число</span>
        </div>
        
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Последняя оплата:</span>
          <span className={isOverdue ? 'text-danger' : 'text-success'}>
            {expense.last_paid_month || 'Не оплачено'}
          </span>
        </div>
        
        {isOverdue && (
          <div className="alert alert-warning mt-2 mb-2 py-1 small">
            <i className="bi bi-exclamation-triangle"></i> Просрочено!
          </div>
        )}
        
        <button
          className="btn btn-success w-100 mt-2"
          onClick={() => onPay(expense.id, expense.name, expense.amount)}
        >
          <i className="bi bi-check-circle"></i> Оплатил за {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </button>
      </div>
    </div>
  )
}

// Основной компонент
export const MonthlyExpensesManager = ({ expenseCategories, participants }) => {
  const [expenses, setExpenses] = useState([])
  const [editingExpense, setEditingExpense] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const loadExpenses = async () => {
    try {
      const res = await axios.get(`${API_URL}/monthly_expenses`)
      setExpenses(res.data)
    } catch (err) {
      notifyError('Ошибка загрузки: ' + err.message)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API_URL}/monthly_expenses`, data)
      notifySuccess('Ежемесячный платёж создан')
      setShowForm(false)
      loadExpenses()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка создания')
    }
  }

  const handleUpdate = async (data) => {
    try {
      await axios.put(`${API_URL}/monthly_expenses/${editingExpense.id}`, data)
      notifySuccess('Платёж обновлён')
      setEditingExpense(null)
      setShowForm(false)
      loadExpenses()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка обновления')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await axios.delete(`${API_URL}/monthly_expenses/${confirmDelete.id}`)
      notifySuccess('Платёж удалён')
      setConfirmDelete(null)
      loadExpenses()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка удаления')
    }
  }

  const handlePay = async (id, name, amount) => {
    const confirmed = window.confirm(`Отметить "${name}" как оплаченный за текущий месяц?\n\nБудет создана транзакция расхода на ${formatMoney(amount)}₽`)
    if (!confirmed) return

    try {
      await axios.post(`${API_URL}/monthly_expenses/${id}/pay`)
      notifySuccess(`Платёж "${name}" отмечен как оплаченный`)
      loadExpenses()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка оплаты')
    }
  }

  return (
    <div>
      {/* Заголовок */}
      <div className="content-header mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <h4><i className="bi bi-calendar-check"></i> Ежемесячные платежи</h4>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingExpense(null)
              setShowForm(!showForm)
            }}
          >
            <i className={`bi bi-${showForm ? 'x' : 'plus'}`}></i> {showForm ? 'Отмена' : 'Добавить платёж'}
          </button>
        </div>
      </div>

      {/* Форма */}
      {showForm && (
        <MonthlyExpenseForm
          initialData={editingExpense}
          expenseCategories={expenseCategories}
          participants={participants}
          onSubmit={editingExpense ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false)
            setEditingExpense(null)
          }}
        />
      )}

      {/* Список */}
      <div className="editor-grid">
        {expenses.map(expense => (
          <MonthlyExpenseCard
            key={expense.id}
            expense={expense}
            onEdit={(e) => {
              setEditingExpense(e)
              setShowForm(true)
            }}
            onDelete={(id, name) => setConfirmDelete({ id, name })}
            onPay={handlePay}
          />
        ))}
      </div>

      {expenses.length === 0 && !showForm && (
        <div className="empty-state">
          <i className="bi bi-calendar-x"></i>
          <p>Нет ежемесячных платежей</p>
          <button className="btn btn-primary mt-2" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus"></i> Создать первый платёж
          </button>
        </div>
      )}

      {/* Модальное окно удаления */}
      {confirmDelete && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header bg-danger">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle"></i> Удаление
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setConfirmDelete(null)}></button>
              </div>
              <div className="modal-body">
                <p className="text-white mb-0">Удалить платёж "{confirmDelete.name}"?</p>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>
                  Отмена
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>
                  <i className="bi bi-trash"></i> Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
