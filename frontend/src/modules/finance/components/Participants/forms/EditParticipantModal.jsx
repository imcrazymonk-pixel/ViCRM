import { useState } from 'react'
import { formatMoney } from '@core/utils/format'

// 🆕 Модальное окно редактирования участника
export const EditParticipantModal = ({ participant, groups, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: participant?.name || '',
    group_id: participant?.group_id || '',
    start_date: participant?.start_date || new Date().toISOString().slice(0, 7),
    is_active: participant?.is_active ?? true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...participant,
      name: formData.name,
      group_id: formData.group_id ? parseInt(formData.group_id) : null,
      start_date: formData.start_date,
      is_active: formData.is_active
    })
  }

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary">
            <h5 className="modal-title">
              <i className="bi bi-pencil"></i> Редактировать участника
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Имя</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Группа</label>
                <select
                  className="form-select"
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                >
                  <option value="">Без группы</option>
                  {groups.filter(g => g.group_type === 'contribution').map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({formatMoney(g.monthly_fee)}/мес)</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Дата начала участия</label>
                <input
                  type="month"
                  className="form-control"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="is_active">
                  Активен
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-check-lg"></i> Сохранить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditParticipantModal
