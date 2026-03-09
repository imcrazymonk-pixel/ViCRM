import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatMoney } from '@core/utils/format'
import { notifySuccess, notifyError } from '@core/utils/notifications'

const API_URL = 'http://localhost:8002/api'

// Форма создания/редактирования группы
const GroupForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    group_type: 'contribution',
    monthly_fee: '',
    description: '',
    is_active: true,
    auto_create_contributions: true
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      notifyError('Введите название группы')
      return
    }
    
    onSubmit({
      ...formData,
      monthly_fee: parseFloat(formData.monthly_fee) || 0
    })
  }

  return (
    <div className="action-card">
      <div className="card-header">
        <h5><i className="bi bi-people-fill"></i> {initialData ? '✏️ Редактировать' : '📝 Новая'} группа</h5>
        {onCancel && (
          <button className="btn-icon" onClick={onCancel}>
            <i className="bi bi-x"></i>
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-2">
          <label className="form-label small text-muted">Название группы</label>
          <input
            type="text"
            className="form-control"
            placeholder="Например: VPN участники"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="mb-2">
          <label className="form-label small text-muted">Тип группы</label>
          <select
            className="form-select"
            value={formData.group_type}
            onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
          >
            <option value="contribution">Участники (с них берём взносы)</option>
            <option value="expense">Хосты (им платим)</option>
          </select>
        </div>

        {formData.group_type === 'contribution' && (
          <div className="mb-2">
            <label className="form-label small text-muted">Ежемесячный взнос (₽)</label>
            <input
              type="number"
              className="form-control"
              placeholder="150"
              step="0.01"
              min="0"
              value={formData.monthly_fee}
              onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
            />
          </div>
        )}

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
            <span className="form-check-label">Активна</span>
          </label>
        </div>

        {formData.group_type === 'contribution' && (
          <div className="mb-2">
            <label className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={formData.auto_create_contributions}
                onChange={(e) => setFormData({ ...formData, auto_create_contributions: e.target.checked })}
              />
              <span className="form-check-label">Авто-создание обязательств</span>
            </label>
          </div>
        )}

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

// Карточка группы
const GroupCard = ({ group, onEdit, onDelete }) => {
  const typeConfig = {
    contribution: { icon: '📈', label: 'Участники', color: 'success' },
    expense: { icon: '📉', label: 'Хосты', color: 'danger' }
  }

  const config = typeConfig[group.group_type]

  return (
    <div className="action-card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5>
            <span className="me-2">{config.icon}</span>
            {group.name}
          </h5>
          <div className="d-flex gap-1">
            <button
              className="btn btn-outline-primary btn-sm action-btn"
              onClick={() => onEdit(group)}
              title="Редактировать"
            >
              <i className="bi bi-pencil"></i>
            </button>
            <button
              className="btn btn-outline-danger btn-sm action-btn"
              onClick={() => onDelete(group.id, group.name)}
              title="Удалить"
              disabled={group.participants_count > 0}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-3">
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Тип:</span>
          <span className={`badge bg-${config.color}`}>{config.label}</span>
        </div>
        
        {group.group_type === 'contribution' && (
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Взнос в месяц:</span>
            <strong>{formatMoney(group.monthly_fee)}</strong>
          </div>
        )}
        
        {group.group_type === 'expense' && (
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted">Платёж в месяц:</span>
            <strong>{formatMoney(group.monthly_fee)}</strong>
          </div>
        )}
        
        <div className="d-flex justify-content-between mb-2">
          <span className="text-muted">Участников:</span>
          <strong>{group.participants_count}</strong>
        </div>
        
        {group.description && (
          <div className="text-muted small mt-2">
            <i className="bi bi-info-circle"></i> {group.description}
          </div>
        )}
        
        {!group.is_active && (
          <div className="badge bg-secondary mt-2">Не активна</div>
        )}
      </div>
    </div>
  )
}

// Основной компонент
export const GroupsManager = () => {
  const [groups, setGroups] = useState([])
  const [editingGroup, setEditingGroup] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const loadGroups = async () => {
    try {
      const res = await axios.get(`${API_URL}/groups`)
      setGroups(res.data)
    } catch (err) {
      notifyError('Ошибка загрузки групп: ' + err.message)
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const handleCreate = async (data) => {
    try {
      await axios.post(`${API_URL}/groups`, data)
      notifySuccess('Группа создана')
      setShowForm(false)
      loadGroups()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка создания')
    }
  }

  const handleUpdate = async (data) => {
    try {
      await axios.put(`${API_URL}/groups/${editingGroup.id}`, data)
      notifySuccess('Группа обновлена')
      setEditingGroup(null)
      setShowForm(false)
      loadGroups()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка обновления')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await axios.delete(`${API_URL}/groups/${confirmDelete.id}`)
      notifySuccess('Группа удалена')
      setConfirmDelete(null)
      loadGroups()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка удаления')
    }
  }

  return (
    <div>
      {/* Заголовок */}
      <div className="content-header mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <h4><i className="bi bi-people-fill"></i> Группы контрагентов</h4>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingGroup(null)
              setShowForm(!showForm)
            }}
          >
            <i className={`bi bi-${showForm ? 'x' : 'plus'}`}></i> {showForm ? 'Отмена' : 'Добавить группу'}
          </button>
        </div>
      </div>

      {/* Форма */}
      {showForm && (
        <GroupForm
          initialData={editingGroup}
          onSubmit={editingGroup ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false)
            setEditingGroup(null)
          }}
        />
      )}

      {/* Список групп */}
      <div className="editor-grid">
        {groups.map(group => (
          <GroupCard
            key={group.id}
            group={group}
            onEdit={(g) => {
              setEditingGroup(g)
              setShowForm(true)
            }}
            onDelete={(id, name) => setConfirmDelete({ id, name })}
          />
        ))}
      </div>

      {groups.length === 0 && !showForm && (
        <div className="empty-state">
          <i className="bi bi-people"></i>
          <p>Нет групп</p>
          <button className="btn btn-primary mt-2" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus"></i> Создать первую группу
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
                <p className="text-white mb-0">Удалить группу "{confirmDelete.name}"?</p>
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
