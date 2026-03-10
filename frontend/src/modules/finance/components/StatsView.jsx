import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, Label } from 'recharts'
import { BalanceOverTime } from './Stats'

// Компонент просмотра статистики
export const StatsView = ({ incomes, expenses, summary, participants, incomeCategories, expenseCategories }) => {
  // Считаем общие суммы
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalBalance = totalIncome - totalExpense

  // Данные для бублика - только 2 сектора: Доходы и Расходы
  const allCategories = [
    { name: '📈 Доходы', value: totalIncome, color: '#10b981' },
    { name: '📉 Расходы', value: totalExpense, color: '#ef4444' }
  ].filter(d => d.value > 0)

  return (
    <div>
      {/* Графики */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
        {/* Единый бублик: Доходы и Расходы */}
        <div className="chart-container" style={{
          padding: '10px',
          borderRadius: '16px',
          width: '400px',
          maxWidth: '400px'
        }}>
          <div className="chart-title" style={{ marginBottom: '10px', paddingLeft: '10px' }}>
            <i className="bi bi-pie-chart"></i> Структура финансов
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={allCategories}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1.5}
              >
                {allCategories.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    style={{
                      filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.2))',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(30, 30, 40, 0.98)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '8px',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  padding: '8px 12px'
                }}
                itemStyle={{
                  color: '#fff'
                }}
                formatter={(value, name) => [`${value.toFixed(2)} ₽`, name]}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                wrapperStyle={{
                  color: '#fff',
                  fontSize: '0.875rem',
                  paddingTop: '20px'
                }}
              />
              <Label
                value={`💰 ${totalBalance.toLocaleString('ru-RU')} ₽`}
                position="center"
                style={{
                  fill: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: '700'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Динамика баланса */}
        <div className="chart-container" style={{
          padding: '10px',
          borderRadius: '16px',
          width: '1050px',
          maxWidth: '1050px'
        }}>
          <div style={{ marginBottom: '10px', paddingLeft: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>
            <i className="bi bi-graph-up"></i> Динамика баланса
          </div>
          <BalanceOverTime incomes={incomes} expenses={expenses} />
        </div>
      </div>
    </div>
  )
}

export default StatsView
