import { useState } from 'react'

// 🆕 Модальное окно деактивации
export const DeactivateModal = ({ participant, onConfirm, onClose }) => {
  const [reason, setReason] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(participant.id, reason)
  }

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-sm">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title">
              <i className="bi bi-exclamation-triangle"></i> Приостановить участника
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <p className="mb-2"><strong>{participant.name}</strong></p>
              <p className="text-muted small mb-3">
                Баланс будет сохранён. Последний месяц будет возвращён в баланс.
              </p>
              <div className="mb-3">
                <label className="form-label">Причина (необязательно)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Например: Приостановил услугу"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="btn btn-warning">
                <i className="bi bi-pause"></i> Приостановить
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default DeactivateModal
