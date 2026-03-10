// Компонент модального окна подтверждения
export const ConfirmModal = ({ show, title, message, onConfirm, onCancel }) => {
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

export default ConfirmModal
