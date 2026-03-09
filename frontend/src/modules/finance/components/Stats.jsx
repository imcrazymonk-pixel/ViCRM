import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ReferenceLine, Area } from 'recharts'

const COLORS = {
  primary: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'],
  income: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
  expense: ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2']
}

// Градиенты для графиков
const GRADIENTS = {
  income: [
    { offset: '0%', stopColor: '#10b981', stopOpacity: 1 },
    { offset: '100%', stopColor: '#059669', stopOpacity: 0.8 }
  ],
  expense: [
    { offset: '0%', stopColor: '#ef4444', stopOpacity: 1 },
    { offset: '100%', stopColor: '#dc2626', stopOpacity: 0.8 }
  ],
  balance: [
    { offset: '0%', stopColor: '#8b5cf6', stopOpacity: 1 },
    { offset: '100%', stopColor: '#6366f1', stopOpacity: 0.8 }
  ]
}

// Круговая диаграмма расходов по категориям
export const ExpenseByCategory = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <i className="bi bi-pie-chart"></i>
        <p>Нет данных для отображения</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS.expense[index % COLORS.expense.length]}
              style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' }}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgba(18, 18, 26, 0.98)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
          formatter={(value) => [`${value.toFixed(2)} ₽`, 'Сумма']}
        />
        <Legend
          wrapperStyle={{
            color: '#fff',
            fontSize: '0.875rem'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Круговая диаграмма доходов по категориям
export const IncomeByCategory = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        <i className="bi bi-pie-chart"></i>
        <p>Нет данных для отображения</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS.income[index % COLORS.income.length]}
              style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))' }}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgba(18, 18, 26, 0.98)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}
          formatter={(value) => [`${value.toFixed(2)} ₽`, 'Сумма']}
        />
        <Legend
          wrapperStyle={{
            color: '#fff',
            fontSize: '0.875rem'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Столбчатая диаграмма по участникам
export const ByParticipant = ({ incomes, expenses }) => {
  const data = []
  const participants = new Set([...incomes.map(i => i.participant_name), ...expenses.map(e => e.participant_name)])

  participants.forEach(name => {
    const income = incomes.filter(i => i.participant_name === name).reduce((sum, i) => sum + i.amount, 0)
    const expense = expenses.filter(e => e.participant_name === name).reduce((sum, e) => sum + e.amount, 0)
    data.push({
      name,
      income: parseFloat(income.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      balance: parseFloat((income - expense).toFixed(2))
    })
  })

  // 🆕 Сортируем по убыванию баланса и показываем всех участников (раньше было топ-10)
  data.sort((a, b) => b.balance - a.balance)
  const topParticipants = data // Было: data.slice(0, 10)

  if (topParticipants.length === 0) {
    return (
      <div className="chart-empty">
        <i className="bi bi-bar-chart"></i>
        <p>Нет данных для отображения</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={topParticipants}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="name" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 10 }} />
        <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 10 }} tickFormatter={(value) => `${value}₽`} />
        <Tooltip
          contentStyle={{
            background: 'rgba(18, 18, 26, 0.98)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            fontSize: '0.75rem'
          }}
          formatter={(value, name) => {
            const labels = {
              income: '📈 Доходы',
              expense: '📉 Расходы',
              balance: '💰 Баланс'
            }
            return [`${value.toFixed(2)} ₽`, labels[name] || name]
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{
            color: '#fff',
            fontSize: '0.7rem',
            paddingTop: '10px'
          }}
        />
        <Bar dataKey="income" name="Доходы" fill="#10b981" />
        <Bar dataKey="expense" name="Расходы" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Линейный график с тремя линиями: Доходы, Расходы, Баланс
export const BalanceOverTime = ({ incomes, expenses }) => {
  // Группируем по датам
  const allTransactions = [
    ...incomes.map(i => ({ date: i.created_at.split('T')[0], amount: i.amount, type: 'income' })),
    ...expenses.map(e => ({ date: e.created_at.split('T')[0], amount: e.amount, type: 'expense' }))
  ]

  // Сортируем по дате
  allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date))

  // Считаем накопительные суммы по датам
  let totalIncome = 0
  let totalExpense = 0
  const data = []
  const dataByDate = {}

  allTransactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount
    } else {
      totalExpense += t.amount
    }
    // Баланс = Доходы - Расходы
    const balance = totalIncome - totalExpense
    dataByDate[t.date] = {
      income: totalIncome,
      expense: totalExpense,
      balance: balance
    }
  })

  // Сортируем даты перед добавлением в массив
  const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b))
  sortedDates.forEach(date => {
    const values = dataByDate[date]
    data.push({
      date: new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      income: parseFloat(values.income.toFixed(2)),
      expense: parseFloat(values.expense.toFixed(2)),
      balance: parseFloat(values.balance.toFixed(2))
    })
  })

  if (data.length === 0) {
    return (
      <div className="chart-empty">
        <i className="bi bi-graph-up"></i>
        <p>Нет данных для отображения</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width={1000} height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          stroke="#71717a"
          tick={{ fill: '#71717a', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#71717a"
          tick={{ fill: '#71717a', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}₽`}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(18, 18, 26, 0.98)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            color: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            fontSize: '0.75rem'
          }}
          formatter={(value, name) => {
            const labels = {
              income: '📈 Доходы',
              expense: '📉 Расходы',
              balance: '💰 Баланс'
            }
            return [`${value.toFixed(2)} ₽`, labels[name] || name]
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{
            color: '#fff',
            fontSize: '0.7rem',
            paddingTop: '10px'
          }}
        />
        {/* Линия нуля — более заметная */}
        <ReferenceLine y={0} stroke="rgba(255, 255, 255, 0.5)" strokeWidth={2} strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="income"
          name="Доходы"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ fill: '#10b981', r: 4, strokeWidth: 1.5, stroke: '#fff' }}
          activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 1.5 }}
        />
        <Line
          type="monotone"
          dataKey="expense"
          name="Расходы"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: '#ef4444', r: 4, strokeWidth: 1.5, stroke: '#fff' }}
          activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 1.5 }}
        />
        {/* Баланс — заливка области */}
        <Area
          type="monotone"
          dataKey="balance"
          stroke="none"
          fill="rgba(139, 92, 246, 0.15)"
          dot={false}
        />
        {/* Баланс — линия поверх заливки */}
        <Line
          type="monotone"
          dataKey="balance"
          name="Баланс"
          stroke="#8b5cf6"
          strokeWidth={3}
          dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 1.5, stroke: '#fff' }}
          activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 1.5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Карточка статистики
export const StatCard = ({ icon, label, value, color = 'primary' }) => (
  <div className={`stat-card stat-${color}`}>
    <div className="stat-icon">
      <i className={`bi bi-${icon}`}></i>
    </div>
    <div className="stat-content">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
)
