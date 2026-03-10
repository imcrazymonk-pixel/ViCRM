import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatMoney, formatDate } from '@core/utils/format'
import { notifySuccess, notifyError, notifyInfo } from '@core/utils/notifications'

const API_URL = 'http://localhost:8002/api'

// 🆕 Компонент статуса участника
const StatusBadge = ({ isActive, balance }) => {
  if (!isActive) {
    return (
      <span className="badge bg-secondary text-white">
        ⏸️ Пауза
      </span>
    )
  }
  
  if (balance < 0) {
    return (
      <span className="badge bg-danger text-white">
        🔴 Долг
      </span>
    )
  }
  
  if (balance > 0) {
    return (
      <span className="badge bg-success text-white">
        🟢 Аванс
      </span>
    )
  }
  
  return (
    <span className="badge bg-primary text-white">
      ✅ Активен
    </span>
  )
}

// 🆕 Компонент баланса с цветом
const BalanceCell = ({ balance }) => {
  if (balance > 0) {
    return <span className="text-success">+{formatMoney(balance)}</span>
  }
  if (balance < 0) {
    return <span className="text-danger">{formatMoney(balance)}</span>
  }
  return <span className="text-muted">0₽</span>
}

// 🆕 Форма внесения платежа (упрощённая)
const PaymentForm = ({ participants, groups, onSubmit, onCancel, submitting }) => {
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

// 🆕 Таблица участников
const ParticipantsTable = ({ participants, onEdit, onView, onActivate, onDeactivate, onPayment }) => {
  if (!participants || participants.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-people"></i>
        <p>Нет участников</p>
      </div>
    )
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Имя</th>
          <th>Группа</th>
          <th>Статус</th>
          <th>Дата начала</th>
          <th>Внёс всего</th>
          <th>Баланс</th>
          <th>Оплачено до</th>
          <th>Следующий платёж</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {participants.map(p => {
          // Рассчитываем следующий месяц платежа
          let nextPayment = '—'
          if (p.paid_until_month) {
            const [year, month] = p.paid_until_month.split('-').map(Number)
            const nextMonth = month === 12 ? 1 : month + 1
            const nextYear = month === 12 ? year + 1 : year
            nextPayment = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`
          }

          return (
            <tr key={p.id}>
              <td><strong>{p.name}</strong></td>
              <td>
                {p.group_name ? (
                  <span className="badge-soft">{p.group_name}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                <StatusBadge isActive={p.is_active} balance={p.balance} />
              </td>
              <td>
                {p.start_date ? (
                  <span className="badge-soft">{p.start_date}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td className="amount-positive">{formatMoney(p.total_paid)}</td>
              <td>
                <BalanceCell balance={p.balance} />
              </td>
              <td>
                {p.paid_until_month ? (
                  <span className="badge-soft bg-success">{p.paid_until_month}</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
              <td>
                <span className="badge-soft bg-warning text-dark">{nextPayment}</span>
              </td>
              <td>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-outline-info btn-sm action-btn"
                    onClick={() => onView(p)}
                    title="Подробно"
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                  {p.is_active ? (
                    <button
                      className="btn btn-outline-warning btn-sm action-btn"
                      onClick={() => onDeactivate(p)}
                      title="Приостановить"
                    >
                      <i className="bi bi-pause"></i>
                    </button>
                  ) : (
                    <button
                      className="btn btn-outline-success btn-sm action-btn"
                      onClick={() => onActivate(p)}
                      title="Возобновить"
                    >
                      <i className="bi bi-play"></i>
                    </button>
                  )}
                  <button
                    className="btn btn-outline-primary btn-sm action-btn"
                    onClick={() => onPayment(p)}
                    title="Внести платёж"
                  >
                    <i className="bi bi-cash"></i>
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm action-btn"
                    onClick={() => onEdit(p)}
                    title="Редактировать"
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// 🆕 Сводка по участникам
const ParticipantsSummary = ({ participants }) => {
  const active = participants.filter(p => p.is_active).length
  const inactive = participants.filter(p => !p.is_active).length
  const debtors = participants.filter(p => p.is_active && p.balance < 0).length
  const withAdvance = participants.filter(p => p.balance > 0).length
  
  const totalBalance = participants.reduce((sum, p) => sum + p.balance, 0)
  const totalPaid = participants.reduce((sum, p) => sum + p.total_paid, 0)

  return (
    <div className="summary-cards-grid mb-3">
      <div className="summary-info-card">
        <div className="card-label">👥 Всего участников</div>
        <div className="card-value">{participants.length}</div>
      </div>
      
      <div className="summary-info-card">
        <div className="card-label">✅ Активные</div>
        <div className="card-value text-success">{active}</div>
      </div>
      
      <div className="summary-info-card">
        <div className="card-label">⏸️ На паузе</div>
        <div className="card-value text-secondary">{inactive}</div>
      </div>
      
      <div className="summary-info-card">
        <div className="card-label">🔴 Должники</div>
        <div className="card-value text-danger">{debtors}</div>
      </div>
      
      <div className="summary-info-card">
        <div className="card-label">🟢 С авансом</div>
        <div className="card-value text-success">{withAdvance}</div>
      </div>
      
      <div className="summary-info-card">
        <div className="card-label">💰 Общий баланс</div>
        <div className={`card-value ${totalBalance >= 0 ? 'text-success' : 'text-danger'}`}>
          {formatMoney(totalBalance)}
        </div>
      </div>
    </div>
  )
}

// 🆕 Модальное окно редактирования участника
const EditParticipantModal = ({ participant, groups, onSave, onClose }) => {
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

// 🆕 Модальное окно деактивации
const DeactivateModal = ({ participant, onConfirm, onClose }) => {
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

// 🆕 Модальное окно активации
const ActivateModal = ({ participant, groups, onConfirm, onClose }) => {
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

// 🆕 Боковая панель с детальной информацией об участнике
const ParticipantDetailPanel = ({ participant, incomes, onClose }) => {
  if (!participant) return null

  // 🆕 Фильтруем доходы только этого участника (показываем все, а не только 10)
  const participantIncomes = incomes.filter(i => i.participant_id === participant.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div className="modal show d-block" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary">
            <h5 className="modal-title">
              <i className="bi bi-person-badge"></i> {participant.name}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {/* Основная информация */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-light">
                    <strong>📊 Информация</strong>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <div className="text-muted small">Группа</div>
                      <div>{participant.group_name || '—'}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Статус</div>
                      <div><StatusBadge isActive={participant.is_active} balance={participant.balance} /></div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Дата начала</div>
                      <div>{participant.start_date || '—'}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Ежемесячный платёж</div>
                      <div>{formatMoney(participant.monthly_fee || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card h-100">
                  <div className="card-header bg-light">
                    <strong>💰 Финансы</strong>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <div className="text-muted small">Внёс всего</div>
                      <div className="text-success"><strong>{formatMoney(participant.total_paid)}</strong></div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Баланс</div>
                      <div><BalanceCell balance={participant.balance} /></div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Оплачено до</div>
                      <div className="text-success">{participant.paid_until_month || '—'}</div>
                    </div>
                    <div className="mb-2">
                      <div className="text-muted small">Следующий платёж</div>
                      <div className="text-warning">
                        {participant.paid_until_month ? (
                          (() => {
                            const [year, month] = participant.paid_until_month.split('-').map(Number)
                            const nextMonth = month === 12 ? 1 : month + 1
                            const nextYear = month === 12 ? year + 1 : year
                            return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`
                          })()
                        ) : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* История платежей */}
            <div className="card">
              <div className="card-header bg-light">
                <strong>📈 История платежей</strong>
                <span className="text-muted small ms-2">
                  (всего {participantIncomes.length} из {participant.incomes_count || 0})
                </span>
              </div>
              <div className="card-body p-0" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {participantIncomes.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="bi bi-inbox" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-2">Нет платежей</p>
                  </div>
                ) : (
                  <table className="table table-sm table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Дата</th>
                        <th>Сумма</th>
                        <th>Описание</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participantIncomes.map(income => (
                        <tr key={income.id}>
                          <td>{formatDate(income.created_at)}</td>
                          <td className="text-success">{formatMoney(income.amount)}</td>
                          <td>{income.description || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Подсказка */}
            <div className="alert alert-info mt-3 mb-0 small">
              <i className="bi bi-info-circle"></i> 
              <strong>Как это работает:</strong> Все платежи, внесённые через меню "Редактор", 
              автоматически учитываются здесь. Деньги распределяются по месяцам начиная с даты начала участия.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <i className="bi bi-x"></i> Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 🎯 ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

export const ParticipantsManager = () => {
  const [participants, setParticipants] = useState([])
  const [groups, setGroups] = useState([])
  const [incomes, setIncomes] = useState([])  // 🆕 История доходов
  const [filter, setFilter] = useState('all') // all, active, debtors, advance, inactive
  const [editingParticipant, setEditingParticipant] = useState(null)
  const [deactivatingParticipant, setDeactivatingParticipant] = useState(null)
  const [activatingParticipant, setActivatingParticipant] = useState(null)
  const [paymentParticipant, setPaymentParticipant] = useState(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [viewingParticipant, setViewingParticipant] = useState(null)  // 🆕 Для детального просмотра
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)  // 🛡️ Блокировка повторной отправки

  // Загрузка данных
  const loadData = async () => {
    try {
      setLoading(true)
      const [participantsRes, groupsRes, incomesRes] = await Promise.all([
        axios.get(`${API_URL}/participants`),
        axios.get(`${API_URL}/groups`),
        axios.get(`${API_URL}/incomes`)
      ])
      setParticipants(participantsRes.data)
      setGroups(groupsRes.data)
      setIncomes(incomesRes.data)  // 🆕 Загружаем историю доходов
    } catch (err) {
      notifyError('Ошибка загрузки: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Фильтрация
  const filteredParticipants = participants.filter(p => {
    if (filter === 'active') return p.is_active
    if (filter === 'inactive') return !p.is_active
    if (filter === 'debtors') return p.is_active && p.balance < 0
    if (filter === 'advance') return p.is_active && p.balance > 0
    return true // all
  })

  // Внесение платежа
  const handlePayment = async (data) => {
    if (submitting) return;  // 🛡️ Защита от повторной отправки
    
    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/incomes`, data)
      notifySuccess('Платёж внесён')
      setShowPaymentForm(false)
      setPaymentParticipant(null)
      // 🆕 Небольшая задержка для применения изменений в БД
      setTimeout(() => {
        loadData()
      }, 500)
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка внесения платежа')
    } finally {
      setSubmitting(false);
    }
  }

  // 🆕 Просмотр детальной информации
  const handleView = (participant) => {
    setViewingParticipant(participant)
  }

  // Редактирование участника
  const handleEdit = async (participant) => {
    try {
      await axios.put(`${API_URL}/participants/${participant.id}`, participant)
      notifySuccess('Участник обновлён')
      setEditingParticipant(null)
      loadData()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка обновления')
    }
  }

  // Деактивация
  const handleDeactivate = async (participantId, reason) => {
    try {
      await axios.post(`${API_URL}/participants/${participantId}/deactivate`, { reason })
      notifySuccess('Участник приостановлен')
      setDeactivatingParticipant(null)
      loadData()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка деактивации')
    }
  }

  // Активация
  const handleActivate = async (participantId, groupId, startDate) => {
    try {
      await axios.post(`${API_URL}/participants/${participantId}/activate`, {
        group_id: groupId,
        start_date: startDate
      })
      notifySuccess('Участник возобновлён')
      setActivatingParticipant(null)
      loadData()
    } catch (err) {
      notifyError(err.response?.data?.detail || 'Ошибка активации')
    }
  }

  return (
    <div>
      {/* Заголовок */}
      <div className="content-header mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <h4><i className="bi bi-people-fill"></i> Участники</h4>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowPaymentForm(!showPaymentForm)}
          >
            <i className={`bi bi-${showPaymentForm ? 'x' : 'cash'}`}></i>
            {showPaymentForm ? 'Отмена' : 'Внести платёж'}
          </button>
        </div>
      </div>

      {/* Индикатор загрузки */}
      {loading && (
        <div className="chart-container">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
            <p className="mt-2 text-muted">Загрузка участников...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          {/* Сводка */}
          <ParticipantsSummary participants={filteredParticipants} />

          {/* Форма платежа */}
          {showPaymentForm && (
            <PaymentForm
              participants={participants}
              groups={groups}
              onSubmit={handlePayment}
              onCancel={() => {
                setShowPaymentForm(false)
                setPaymentParticipant(null)
              }}
              submitting={submitting}
            />
          )}

          {/* Фильтры */}
          <div className="chart-container mb-3">
            <div className="chart-title">
              <i className="bi bi-funnel"></i> Фильтры
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter('all')}
              >
                Все ({participants.length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'active' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter('active')}
              >
                ✅ Активные ({participants.filter(p => p.is_active).length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'debtors' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter('debtors')}
              >
                🔴 Должники ({participants.filter(p => p.is_active && p.balance < 0).length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'advance' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter('advance')}
              >
                🟢 С авансом ({participants.filter(p => p.is_active && p.balance > 0).length})
              </button>
              <button
                className={`btn btn-sm ${filter === 'inactive' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setFilter('inactive')}
              >
                ⏸️ На паузе ({participants.filter(p => !p.is_active).length})
              </button>
              {(filter !== 'all') && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setFilter('all')}
                >
                  <i className="bi bi-x"></i> Сброс
                </button>
              )}
            </div>
          </div>

          {/* Таблица участников */}
          <div className="chart-container">
            <div className="chart-title">
              <i className="bi bi-table"></i> Участники
              <span className="text-muted small ms-2">
                ({filteredParticipants.length} из {participants.length})
              </span>
            </div>
            <ParticipantsTable
              participants={filteredParticipants}
              onEdit={setEditingParticipant}
              onView={handleView}
              onActivate={setActivatingParticipant}
              onDeactivate={setDeactivatingParticipant}
              onPayment={(p) => {
                setPaymentParticipant(p)
                setShowPaymentForm(true)
              }}
            />
          </div>

          {/* Модальные окна */}
          {editingParticipant && (
            <EditParticipantModal
              participant={editingParticipant}
              groups={groups}
              onSave={handleEdit}
              onClose={() => setEditingParticipant(null)}
            />
          )}

          {deactivatingParticipant && (
            <DeactivateModal
              participant={deactivatingParticipant}
              onConfirm={handleDeactivate}
              onClose={() => setDeactivatingParticipant(null)}
            />
          )}

          {activatingParticipant && (
            <ActivateModal
              participant={activatingParticipant}
              groups={groups}
              onConfirm={handleActivate}
              onClose={() => setActivatingParticipant(null)}
            />
          )}

          {/* Детальный просмотр участника */}
          {viewingParticipant && (
            <ParticipantDetailPanel
              participant={viewingParticipant}
              incomes={incomes}
              onClose={() => setViewingParticipant(null)}
            />
          )}
        </>
      )}
    </div>
  )
}
