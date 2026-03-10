// Компонент модального окна со списком
export const ListModal = ({ show, title, headerClass, items, onEdit, onDelete, formatItemStats }) => {
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

export default ListModal
