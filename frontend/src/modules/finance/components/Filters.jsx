import { useState } from 'react'

export const TransactionFilters = ({ 
  incomes, 
  expenses, 
  participants, 
  incomeCategories, 
  expenseCategories,
  onFilterChange 
}) => {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all', // all, income, expense
    participant: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: ''
  })

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    applyFilters(newFilters)
  }

  const applyFilters = (filters) => {
    let filteredIncomes = [...incomes]
    let filteredExpenses = [...expenses]

    // Поиск по описанию
    if (filters.search) {
      const search = filters.search.toLowerCase()
      filteredIncomes = filteredIncomes.filter(i => 
        i.description?.toLowerCase().includes(search) ||
        i.participant_name.toLowerCase().includes(search) ||
        i.category_name.toLowerCase().includes(search)
      )
      filteredExpenses = filteredExpenses.filter(e => 
        e.description?.toLowerCase().includes(search) ||
        e.participant_name.toLowerCase().includes(search) ||
        e.category_name.toLowerCase().includes(search)
      )
    }

    // По типу
    if (filters.type === 'income') {
      filteredExpenses = []
    } else if (filters.type === 'expense') {
      filteredIncomes = []
    }

    // По участнику
    if (filters.participant !== 'all') {
      filteredIncomes = filteredIncomes.filter(i => i.participant_id === parseInt(filters.participant))
      filteredExpenses = filteredExpenses.filter(e => e.participant_id === parseInt(filters.participant))
    }

    // По категории
    if (filters.category !== 'all') {
      filteredIncomes = filteredIncomes.filter(i => i.category_id === parseInt(filters.category))
      filteredExpenses = filteredExpenses.filter(e => e.category_id === parseInt(filters.category))
    }

    // По датам
    if (filters.dateFrom) {
      const dateFrom = new Date(filters.dateFrom)
      filteredIncomes = filteredIncomes.filter(i => new Date(i.created_at) >= dateFrom)
      filteredExpenses = filteredExpenses.filter(e => new Date(e.created_at) >= dateFrom)
    }
    if (filters.dateTo) {
      const dateTo = new Date(filters.dateTo)
      dateTo.setHours(23, 59, 59, 999)
      filteredIncomes = filteredIncomes.filter(i => new Date(i.created_at) <= dateTo)
      filteredExpenses = filteredExpenses.filter(e => new Date(e.created_at) <= dateTo)
    }

    onFilterChange(filteredIncomes, filteredExpenses)
  }

  const resetFilters = () => {
    const defaultFilters = {
      search: '',
      type: 'all',
      participant: 'all',
      category: 'all',
      dateFrom: '',
      dateTo: ''
    }
    setFilters(defaultFilters)
    applyFilters(defaultFilters)
  }

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h5><i className="bi bi-funnel"></i> Фильтры</h5>
        <button className="btn btn-sm btn-outline-primary" onClick={resetFilters}>
          <i className="bi bi-x-circle"></i> Сброс
        </button>
      </div>

      <div className="filters-grid">
        {/* Поиск */}
        <div className="filter-item">
          <label className="filter-label">
            <i className="bi bi-search"></i> Поиск
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Описание, участник, категория..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {/* Тип */}
        <div className="filter-item">
          <label className="filter-label">
            <i className="bi bi-arrow-left-right"></i> Тип
          </label>
          <select
            className="form-select"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="all">Все</option>
            <option value="income">Доходы</option>
            <option value="expense">Расходы</option>
          </select>
        </div>

        {/* Участник */}
        <div className="filter-item">
          <label className="filter-label">
            <i className="bi bi-people"></i> Участник
          </label>
          <select
            className="form-select"
            value={filters.participant}
            onChange={(e) => handleFilterChange('participant', e.target.value)}
          >
            <option value="all">Все</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Категория */}
        <div className="filter-item">
          <label className="filter-label">
            <i className="bi bi-folder"></i> Категория
          </label>
          <select
            className="form-select"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="all">Все</option>
            {incomeCategories.map(c => (
              <option key={`income-${c.id}`} value={c.id}>{c.name}</option>
            ))}
            {expenseCategories.map(c => (
              <option key={`expense-${c.id}`} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Дата от */}
        <div className="filter-item">
          <label className="filter-label">
            <i className="bi bi-calendar-check"></i> С даты
          </label>
          <input
            type="date"
            className="form-control"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
          />
        </div>

        {/* Дата до */}
        <div className="filter-item">
          <label className="filter-label">
            <i className="bi bi-calendar-x"></i> По дату
          </label>
          <input
            type="date"
            className="form-control"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
          />
        </div>
      </div>

      {/* Результаты фильтрации */}
      <div className="filters-results">
        <span className="badge-soft">
          📈 {incomes.length} доходов
        </span>
        <span className="badge-soft">
          📉 {expenses.length} расходов
        </span>
        <span className="badge-soft">
          💰 Всего: {incomes.length + expenses.length}
        </span>
      </div>
    </div>
  )
}
