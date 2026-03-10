import { formatDate } from '@core/utils/format'

// Компонент таблицы транзакций
export const TransactionTable = ({ data, type, onDelete, onEdit }) => {
  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <i className={`bi bi-${type === 'income' ? 'inbox' : 'cart-x'}`}></i>
        <p>Нет {type === 'income' ? 'поступлений' : 'расходов'}</p>
      </div>
    )
  }

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency || 'RUB'
    }).format(amount)
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Контрагент</th>
          <th>Категория</th>
          <th>Описание</th>
          <th>Сумма</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {data.map(item => (
          <tr key={item.id}>
            <td>{formatDate(item.created_at)}</td>
            <td>{item.participant_name}</td>
            <td><span className="badge-soft">{item.category_name}</span></td>
            <td>{item.description || '—'}</td>
            <td className={type === 'income' ? 'amount-positive' : 'amount-negative'}>
              {type === 'income' ? '+' : '-'}{formatCurrency(item.amount, item.currency || 'RUB')}
            </td>
            <td>
              <div className="d-flex gap-1">
                <button
                  className="btn btn-outline-primary btn-sm action-btn"
                  onClick={() => onEdit(item)}
                  title="Редактировать"
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="btn btn-outline-danger btn-sm action-btn"
                  onClick={() => onDelete(item.id)}
                  title="Удалить"
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TransactionTable
