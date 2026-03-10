import { useState } from 'react'
import { formatMoney } from '@core/utils/format'
import { TransactionFilters } from '../Filters'
import { AllTransactionsTable } from '../Transactions/AllTransactionsTable'
import { StatsView } from '../StatsView'
import { SummaryCards } from './SummaryCards'

// Компонент Dashboard (статистика)
export const Dashboard = ({
  summary,
  avgIncome,
  avgExpense,
  monthlyExpense,
  forecastData,
  participants,
  incomes,
  expenses,
  incomeCategories,
  expenseCategories,
  filteredIncomes,
  filteredExpenses,
  showFilters,
  setShowFilters,
  setFilteredIncomes,
  setFilteredExpenses,
  deleteTransaction,
  openEditModal,
  setShowExportModal,
  setActiveItem
}) => {
  return (
    <>
      {/* Заголовок в стиле CoreUI + Кнопка Экспорт */}
      <div className="content-header mb-3" style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'flex-start' }}>
        <h4><i className="bi bi-bar-chart-line"></i> Статистика</h4>
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowExportModal(true)}
          style={{
            padding: '6px 12px',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <i className="bi bi-file-earmark-arrow-down"></i> Экспорт
        </button>
      </div>

      {/* Карточки сводки */}
      <SummaryCards
        summary={summary}
        avgIncome={avgIncome}
        avgExpense={avgExpense}
        monthlyExpense={monthlyExpense}
        forecastData={forecastData}
        participants={participants}
        onSetFinanceEditor={() => setActiveItem('finance-editor')}
        onSetFinanceForecast={() => setActiveItem('finance-forecast')}
      />

      <StatsView
        incomes={incomes}
        expenses={expenses}
        summary={summary}
        participants={participants}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
      />

      {/* Все транзакции */}
      <div className="chart-container" style={{
        marginTop: '0',
        padding: '10px',
        paddingTop: '0',
        borderRadius: '16px',
        width: '1470px',
        maxWidth: '1470px'
      }}>
        <div className="chart-title with-divider" style={{ paddingLeft: '10px', paddingTop: '10px', paddingBottom: '8px' }}>
          <span className="title-text">
            <i className="bi bi-table"></i>
            Все транзакции
          </span>
          <button
            className="btn btn-sm btn-outline-primary title-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="bi bi-funnel"></i> Фильтры
          </button>
        </div>

        {showFilters && (
          <TransactionFilters
            incomes={incomes}
            expenses={expenses}
            participants={participants}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            onFilterChange={(filteredIncomes, filteredExpenses) => {
              setFilteredIncomes(filteredIncomes)
              setFilteredExpenses(filteredExpenses)
            }}
          />
        )}

        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <AllTransactionsTable
            incomes={filteredIncomes}
            expenses={filteredExpenses}
            onDelete={(type, id) => deleteTransaction(type, id)}
            onEdit={openEditModal}
          />
        </div>
      </div>
    </>
  )
}

export default Dashboard
