import { useState, useEffect } from 'react'

// Компонент формы транзакции (для создания и редактирования)
export const TransactionForm = ({ title, icon, type, participants, categories, onSubmit, disabled, onOpenSettings, initialData, isEdit = false }) => {
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

export default TransactionForm
