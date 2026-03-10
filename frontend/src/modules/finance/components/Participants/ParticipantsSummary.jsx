import { formatMoney } from '@core/utils/format'

// 🆕 Сводка по участникам
export const ParticipantsSummary = ({ participants }) => {
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

export default ParticipantsSummary
