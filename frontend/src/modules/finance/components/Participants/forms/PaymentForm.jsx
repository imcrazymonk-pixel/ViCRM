import { useState } from 'react'
import { notifyError } from '@core/utils/notifications'
import { BalanceCell } from '../common/BalanceCell'

// 🆕 Форма внесения платежа (упрощённая)
export const PaymentForm = ({ participants, groups, onSubmit, onCancel, submitting }) => {
  const [formData, setFormData] = useState({
    participant_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5)
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.participant_id || !formData.amount) {
      notifyError('Выберите участника и укажите сумму')
      return
    }

    const dateTime = new Date(`${formData.date}T${formData.time || '00:00'}`)

    onSubmit({
      participant_id: parseInt(formData.participant_id),
      category_id: 1, // "Взнос участника" (по умолчанию)
      amount: parseFloat(formData.amount),
      currency: 'RUB',
      description: formData.description || 'Взнос участника',
      created_at: dateTime.toISOString()
    })
  }

  // Находим выбранного участника и показываем его инфо
  const selectedParticipant = participants.find(p => p.id === parseInt(formData.participant_id))

  return (
    <div className="action-card">
      <div className="card-header">
        <h5><i className="bi bi-cash-coin"></i> Внести платёж</h5>
        {onCancel && (
          <button className="btn-icon" onClick={onCancel}>
            <i className="bi bi-x"></i>
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
          <option value="">Выберите участника</option>
          {participants.filter(p => p.is_active).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {selectedParticipant && (
          <div className="alert alert-info mb-2 py-2 px-3 small">
            <div><strong>Группа:</strong> {selectedParticipant.group_name || '—'}</div>
            <div><strong>Оплачено до:</strong> {selectedParticipant.paid_until_month || '—'}</div>
            <div><strong>Баланс:</strong> <BalanceCell balance={selectedParticipant.balance} /></div>
          </div>
        )}

        <div className="mb-2">
          <label className="form-label small text-muted">Сумма (₽)</label>
          <input
            type="number"
            className="form-control"
            placeholder="150"
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        <div className="mb-2">
          <label className="form-label small text-muted">Комментарий</label>
          <input
            type="text"
            className="form-control"
            placeholder="Необязательно"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="d-flex gap-2 mb-2">
          <div style={{ flex: 1 }}>
            <label className="form-label small text-muted">Дата</label>
            <input
              type="date"
              className="form-control"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div style={{ width: '100px' }}>
            <label className="form-label small text-muted">Время</label>
            <input
              type="time"
              className="form-control"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>
        </div>

        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-success flex-fill"
            disabled={submitting}
          >
            <i className="bi bi-check-lg"></i> {submitting ? 'Внесение...' : 'Внести'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
              <i className="bi bi-x"></i> Отмена
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default PaymentForm
