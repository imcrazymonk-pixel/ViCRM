import { formatDate, formatMoney } from '@core/utils/format'
import { StatusBadge } from './common/StatusBadge'
import { BalanceCell } from './common/BalanceCell'

// 🆕 Боковая панель с детальной информацией об участнике
export const ParticipantDetailPanel = ({ participant, incomes, onClose }) => {
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

export default ParticipantDetailPanel
