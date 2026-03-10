import { useState, useEffect } from 'react'
import axios from 'axios'
import { notifySuccess, notifyError } from '@core/utils/notifications'
import { ParticipantsTable } from './ParticipantsTable'
import { ParticipantsSummary } from './ParticipantsSummary'
import { PaymentForm } from './forms/PaymentForm'
import { EditParticipantModal } from './forms/EditParticipantModal'
import { DeactivateModal } from './forms/DeactivateModal'
import { ActivateModal } from './forms/ActivateModal'
import { ParticipantDetailPanel } from './ParticipantDetailPanel'

const API_URL = 'http://localhost:8002/api'

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
