import { formatDate } from '@core/utils/format'

// Компонент единой таблицы всех транзакций
export const AllTransactionsTable = ({ incomes, expenses, onDelete, onEdit }) => {
  // 🆕 Объединяем и сортируем по дате (показываем все, а не только 10)
  const allTransactions = [
    ...incomes.map(i => ({ ...i, type: 'income' })),
    ...expenses.map(e => ({ ...e, type: 'expense' }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const recentTransactions = allTransactions

  if (recentTransactions.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-inbox"></i>
        <p>Нет транзакций</p>
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
          <th>Тип</th>
          <th>Контрагент</th>
          <th>Категория</th>
          <th>Описание</th>
          <th>Сумма</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {recentTransactions.map((item, index) => (
          <tr key={`${item.type}-${item.id}-${index}`}>
            <td>{formatDate(item.created_at)}</td>
            <td>
              <span className={`badge-soft ${item.type === 'income' ? 'text-success' : 'text-danger'}`}>
                {item.type === 'income' ? '📈 Доход' : '📉 Расход'}
              </span>
            </td>
            <td>{item.participant_name}</td>
            <td><span className="badge-soft">{item.category_name}</span></td>
            <td>{item.description || '—'}</td>
            <td className={item.type === 'income' ? 'amount-positive' : 'amount-negative'}>
              {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, item.currency || 'RUB')}
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
                  onClick={() => onDelete(item.type === 'income' ? 'incomes' : 'expenses', item.id)}
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

export default AllTransactionsTable
