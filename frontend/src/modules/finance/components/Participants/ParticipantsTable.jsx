import { formatMoney } from '@core/utils/format'
import { StatusBadge } from './common/StatusBadge'
import { BalanceCell } from './common/BalanceCell'

// 🆕 Таблица участников
export const ParticipantsTable = ({ participants, onEdit, onView, onActivate, onDeactivate, onPayment }) => {
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

export default ParticipantsTable
