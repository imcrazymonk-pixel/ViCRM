import { useState } from 'react'
import { formatMoney } from '@core/utils/format'
import { notifyError } from '@core/utils/notifications'

// 🆕 Модальное окно активации
export const ActivateModal = ({ participant, groups, onConfirm, onClose }) => {
  const [formData, setFormData] = useState({
    group_id: '',
    start_date: new Date().toISOString().slice(0, 7)
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.group_id) {
      notifyError('Выберите группу')
      return
    }
    onConfirm(participant.id, parseInt(formData.group_id), formData.start_date)
  }

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-success">
            <h5 className="modal-title">
              <i className="bi bi-play"></i> Возобновить участника
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p className="mb-3"><strong>{participant.name}</strong></p>

              <div className="mb-3">
                <label className="form-label">Группа</label>
                <select
                  className="form-select"
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  required
                >
                  <option value="">Выберите группу</option>
                  {groups.filter(g => g.group_type === 'contribution').map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({formatMoney(g.monthly_fee)}/мес)</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Дата начала</label>
                <input
                  type="month"
                  className="form-control"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              {participant.balance !== 0 && (
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle"></i> Текущий баланс: <strong>{formatMoney(participant.balance)}</strong> будет учтён
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn-success">
                <i className="bi bi-check-lg"></i> Возобновить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ActivateModal
