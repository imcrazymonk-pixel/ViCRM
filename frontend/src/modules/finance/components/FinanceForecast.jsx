import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatMoney } from '@core/utils/format'
import { notifyError } from '@core/utils/notifications'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell, ReferenceLine } from 'recharts'

const API_URL = 'http://localhost:8002/api'

// Карточка прогноза на месяц
const ForecastMonthCard = ({ forecast, isCurrent }) => {
  const isDeficit = forecast.status === 'DEFICIT'
  
  return (
    <div className={`summary-info-card ${isDeficit ? 'border-danger' : ''}`} style={{ 
      borderColor: isDeficit ? '#ef4444' : undefined,
      borderWidth: isDeficit ? '2px' : undefined
    }}>
      <div className="card-label">
        {forecast.month_name}
        {isCurrent && <span className="badge bg-primary ms-2">Сейчас</span>}
      </div>
      
      <div className="d-flex justify-content-between mb-2 mt-2">
        <span className="text-muted small">Доходы:</span>
        <span className="text-success">{formatMoney(forecast.income)}</span>
      </div>
      
      <div className="d-flex justify-content-between mb-2">
        <span className="text-muted small">Расходы:</span>
        <span className="text-danger">{formatMoney(forecast.expense)}</span>
      </div>
      
      <div className="d-flex justify-content-between mb-2">
        <span className="text-muted small">Δ:</span>
        <span className={forecast.delta >= 0 ? 'text-success' : 'text-danger'}>
          {forecast.delta >= 0 ? '+' : ''}{formatMoney(forecast.delta)}
        </span>
      </div>
      
      <div className="mt-2 pt-2 border-top">
        <div className="d-flex justify-content-between">
          <span className="text-muted small">Баланс:</span>
          <strong className={forecast.running_balance >= 0 ? 'text-success' : 'text-danger'}>
            {formatMoney(forecast.running_balance)}
          </strong>
        </div>
      </div>
      
      {isDeficit && (
        <div className="alert alert-danger mt-2 mb-0 py-1 small">
          <i className="bi bi-exclamation-triangle"></i> Дефицит!
        </div>
      )}
    </div>
  )
}

// График прогноза
const ForecastChart = ({ forecast }) => {
  const chartData = forecast.map(f => ({
    name: f.month_name.split(' ')[0], // Только название месяца
    full_name: f.month_name,
    balance: Math.round(f.running_balance),
    delta: Math.round(f.delta),
    status: f.status
  }))

  const colors = chartData.map(d => d.status === 'DEFICIT' ? '#ef4444' : '#10b981')

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <XAxis 
          dataKey="name" 
          stroke="#71717a"
          tick={{ fill: '#71717a', fontSize: 10 }}
        />
        <YAxis 
          stroke="#71717a"
          tick={{ fill: '#71717a', fontSize: 10 }}
          tickFormatter={(value) => `${value}₽`}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(18, 18, 26, 0.98)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            color: '#fff'
          }}
          formatter={(value, name) => {
            const labels = {
              balance: 'Баланс',
              delta: 'Изменение'
            }
            return [formatMoney(value), labels[name] || name]
          }}
          labelFormatter={(label, payload) => {
            if (payload && payload[0]) {
              return payload[0].payload.full_name
            }
            return label
          }}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
        <Bar 
          dataKey="balance" 
          name="Баланс"
          radius={[4, 4, 0, 0]}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Список должников
const DebtorsList = ({ debtors }) => {
  if (!debtors || debtors.length === 0) {
    return (
      <div className="text-muted small">
        <i className="bi bi-check-circle"></i> Должников нет
      </div>
    )
  }

  return (
    <div className="list-group">
      {debtors.map(d => (
        <div key={d.id} className="list-group-item py-2 px-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{d.name}</strong>
              <div className="text-muted small">
                {d.months_unpaid} мес. не оплачено
              </div>
            </div>
            <span className="text-danger">
              −{formatMoney(d.debt_amount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Список хостов с предупреждениями
const HostsAlertList = ({ hosts }) => {
  if (!hosts || hosts.length === 0) {
    return (
      <div className="text-muted small">
        <i className="bi bi-check-circle"></i> Все счета оплачены
      </div>
    )
  }

  return (
    <div className="list-group">
      {hosts.map(h => (
        <div key={h.id} className="list-group-item py-2 px-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{h.name}</strong>
              <div className="text-muted small">
                {h.last_paid ? `Оплачено: ${h.last_paid}` : 'Не оплачено'}
              </div>
            </div>
            <span className="text-warning">
              {formatMoney(h.amount)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// Основной компонент прогноза
export const FinanceForecast = () => {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadForecast = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_URL}/finance/forecast`)
      setForecast(res.data)
    } catch (err) {
      notifyError('Ошибка загрузки прогноза: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForecast()
  }, [])

  if (loading) {
    return (
      <div className="empty-state">
        <i className="bi bi-hourglass-split"></i>
        <p>Загрузка...</p>
      </div>
    )
  }

  if (!forecast) {
    return (
      <div className="empty-state">
        <i className="bi bi-exclamation-triangle"></i>
        <p>Ошибка загрузки данных</p>
      </div>
    )
  }

  const currentMonth = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

  return (
    <div>
      {/* Заголовок */}
      <div className="content-header mb-3">
        <h4><i className="bi bi-graph-up"></i> Финансовый прогноз</h4>
      </div>

      {/* Вывод */}
      <div className={`alert ${forecast.current_balance >= 0 ? 'alert-success' : 'alert-danger'} mb-3`}>
        <i className={`bi bi-${forecast.current_balance >= 0 ? 'check-circle' : 'exclamation-triangle'}`}></i>
        <strong> {forecast.conclusion}</strong>
      </div>

      {/* Карточки сводки */}
      <div className="summary-cards-grid mb-3">
        <div className="summary-info-card">
          <div className="card-label">💰 Текущий баланс</div>
          <div className={`card-value ${forecast.current_balance >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatMoney(forecast.current_balance)}
          </div>
        </div>

        <div className="summary-info-card">
          <div className="card-label">📈 Ожидаем в месяц</div>
          <div className="card-value text-success">
            {formatMoney(forecast.expected_monthly_income)}
          </div>
          <div className="card-subvalue text-muted small">
            Взносы участников
          </div>
        </div>

        <div className="summary-info-card">
          <div className="card-label">📉 Расходуем в месяц</div>
          <div className="card-value text-danger">
            {formatMoney(forecast.expected_monthly_expense)}
          </div>
          <div className="card-subvalue text-muted small">
            Обязательные платежи
          </div>
        </div>
      </div>

      {/* График */}
      <div className="chart-container mb-3">
        <div className="chart-title">
          <i className="bi bi-bar-chart"></i> Динамика баланса
        </div>
        <ForecastChart forecast={forecast.forecast} />
      </div>

      {/* Прогноз по месяцам */}
      <div className="chart-container mb-3">
        <div className="chart-title">
          <i className="bi bi-calendar3"></i> Прогноз по месяцам
        </div>
        <div className="editor-grid">
          {forecast.forecast.map((f, index) => (
            <ForecastMonthCard
              key={f.month}
              forecast={f}
              isCurrent={index === 0}
            />
          ))}
        </div>
      </div>

      {/* Должники и хосты */}
      <div className="editor-grid">
        {/* Должники */}
        <div className="action-card">
          <div className="card-header">
            <h5><i className="bi bi-person-x"></i> Должники</h5>
          </div>
          <div className="p-0">
            <DebtorsList debtors={forecast.debtors} />
          </div>
        </div>

        {/* Хосты */}
        <div className="action-card">
          <div className="card-header">
            <h5><i className="bi bi-exclamation-octagon"></i> Требуют оплаты</h5>
          </div>
          <div className="p-0">
            <HostsAlertList hosts={forecast.hosts_alert} />
          </div>
        </div>
      </div>

      {/* Участники по группам */}
      {forecast.participants_by_group && Object.keys(forecast.participants_by_group).length > 0 && (
        <div className="chart-container mt-3">
          <div className="chart-title">
            <i className="bi bi-people"></i> Участники по группам
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {Object.values(forecast.participants_by_group).map(g => (
              <div key={g.name} className="badge-soft p-3" style={{ minWidth: '150px' }}>
                <div className="small text-muted">{g.name}</div>
                <div className="text-white">
                  <strong>{g.members_count}</strong> участн.
                </div>
                <div className="text-success small">
                  {formatMoney(g.total_expected)}/мес
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
