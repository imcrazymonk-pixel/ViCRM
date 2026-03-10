import { formatMoney } from '@core/utils/format'

// Компонент карточек сводки
export const SummaryCards = ({ summary, avgIncome, avgExpense, monthlyExpense, forecastData, participants, onSetFinanceEditor, onSetFinanceForecast }) => {
  return (
    <>
      {/* Карточки сводки - объединённый блок */}
      <div className="summary-container">
        <div className="summary-cards-grid">
          {/* Баланс */}
          <div className="summary-info-card balance-card">
            <div className="card-label">💰 Баланс</div>
            <div className="card-value balance-value">{formatMoney(summary.balance)}</div>
          </div>
          {/* Доходы */}
          <div className="summary-info-card income-card">
            <div className="card-label">📈 Доходы</div>
            <div className="card-value income-value">{formatMoney(summary.total_income)}</div>
            <div className="card-subvalue">Средний: {formatMoney(avgIncome)}</div>
          </div>
          {/* Расходы */}
          <div className="summary-info-card expense-card">
            <div className="card-label">📉 Расходы</div>
            <div className="card-value expense-value">{formatMoney(summary.total_expense)}</div>
            <div className="card-subvalue">Средний: {formatMoney(avgExpense)}</div>
          </div>
          {/* Участники */}
          <div
            className="summary-info-card clickable"
            onClick={() => onSetFinanceEditor()}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-label">👥 Участники</div>
            <div className="card-value" style={{ fontSize: '1.5rem' }}>{summary.participants_count}</div>
            <div className="card-subvalue">Контрагентов всего</div>
          </div>
          {/* Прогноз */}
          <div
            className="summary-info-card clickable"
            onClick={() => onSetFinanceForecast()}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-label">📉 Расходуем в месяц</div>
            <div className="card-value expense-value">{formatMoney(monthlyExpense)}</div>
            <div className="card-subvalue">См. прогноз</div>
          </div>
        </div>
      </div>

      {/* Графики */}
      {/* 🆕 Сводка по участникам */}
      {forecastData && (
        <div className="summary-container" style={{ marginBottom: '20px' }}>
          <div className="summary-cards-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {/* Ожидаемый доход в следующем месяце */}
            <div className="summary-info-card">
              <div className="card-label">📅 Ожидаемый доход</div>
              <div className="card-value" style={{ fontSize: '1.3rem', color: '#10b981' }}>
                {formatMoney(forecastData.expected_monthly_income || 0)}
              </div>
              <div className="card-subvalue">В следующем месяце</div>
            </div>

            {/* Участники с авансом */}
            <div className="summary-info-card">
              <div className="card-label">🟢 Внесли авансом</div>
              <div className="card-value" style={{ fontSize: '1.3rem', color: '#10b981' }}>
                {formatMoney(participants.filter(p => p.is_active && p.balance > 0).reduce((sum, p) => sum + p.balance, 0))}
              </div>
              <div className="card-subvalue">
                {participants.filter(p => p.is_active && p.balance > 0).length} участн.
              </div>
            </div>

            {/* Общая задолженность */}
            <div className="summary-info-card">
              <div className="card-label">🔴 Общая задолженность</div>
              <div className="card-value" style={{ fontSize: '1.3rem', color: '#ef4444' }}>
                {formatMoney(Math.abs(participants.filter(p => p.is_active && p.balance < 0).reduce((sum, p) => sum + p.balance, 0)))}
              </div>
              <div className="card-subvalue">
                {participants.filter(p => p.is_active && p.balance < 0).length} участн.
              </div>
            </div>

            {/* Активные участники */}
            <div className="summary-info-card">
              <div className="card-label">✅ Активные участники</div>
              <div className="card-value" style={{ fontSize: '1.3rem' }}>
                {participants.filter(p => p.is_active).length}
              </div>
              <div className="card-subvalue">
                из {participants.length} всего
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SummaryCards
