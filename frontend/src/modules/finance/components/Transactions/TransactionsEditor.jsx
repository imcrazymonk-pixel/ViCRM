import { TransactionForm } from './TransactionForm'
import { TransactionTable } from './TransactionTable'
import { GroupsManager } from '../GroupsManager'
import { MonthlyExpensesManager } from '../MonthlyExpensesManager'

// Компонент редактора транзакций
export const TransactionsEditor = ({
  newParticipant,
  setNewParticipant,
  allowDuplicate,
  setAllowDuplicate,
  groups,
  addParticipant,
  participants,
  incomeCategories,
  expenseCategories,
  addIncome,
  addExpense,
  loading,
  openModal,
  newCategory,
  setNewCategory,
  addCategory,
  incomes,
  expenses,
  deleteTransaction,
  openEditModal
}) => {
  return (
    <>
      <div className="content-header">
        <h4>📈 Редактор финансов</h4>
      </div>

      <div className="editor-grid">
        {/* Добавить контрагента */}
        <div className="action-card">
          <div className="card-header">
            <h5><i className="bi bi-people"></i> Контрагент</h5>
            <button className="btn-icon" onClick={() => openModal('participants')} title="Управление">
              <i className="bi bi-gear"></i>
            </button>
          </div>
          <form onSubmit={addParticipant}>
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Название контрагента"
              value={newParticipant.name}
              onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
              required
            />

            {/* 🆕 Выбор группы */}
            <select
              className="form-select mb-2"
              value={newParticipant.group_id}
              onChange={(e) => setNewParticipant({ ...newParticipant, group_id: e.target.value })}
            >
              <option value="">Без группы</option>
              {groups.filter(g => g.group_type === 'contribution' && g.is_active).map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.monthly_fee}₽/мес)</option>
              ))}
            </select>

            {/* 🆕 Дата начала */}
            <div className="mb-2">
              <label className="form-label small text-muted">Дата начала участия</label>
              <input
                type="month"
                className="form-control"
                value={newParticipant.start_date}
                onChange={(e) => setNewParticipant({ ...newParticipant, start_date: e.target.value })}
                placeholder="Необязательно"
              />
            </div>

            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="allowDuplicate"
                checked={allowDuplicate}
                onChange={(e) => setAllowDuplicate(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="allowDuplicate">
                Разрешить дубликаты
              </label>
            </div>
            <button type="submit" className="btn btn-primary w-100">Добавить</button>
          </form>
        </div>

        {/* Внести средства */}
        <TransactionForm
          title="Доход"
          icon="bi-cash-coin"
          type="income"
          participants={participants}
          categories={incomeCategories}
          onSubmit={addIncome}
          disabled={loading}
          onOpenSettings={() => openModal('income_categories')}
        />

        {/* Расход средств */}
        <TransactionForm
          title="Расход"
          icon="bi-wallet2"
          type="expense"
          participants={participants}
          categories={expenseCategories}
          onSubmit={addExpense}
          disabled={loading}
          onOpenSettings={() => openModal('expense_categories')}
        />

        {/* Категории */}
        <div className="action-card">
          <div className="card-header">
            <h5><i className="bi bi-folder-plus"></i> Категории</h5>
          </div>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Название категории"
            value={newCategory.name}
            onChange={(e) => setNewCategory({ name: e.target.value })}
          />
          <div className="d-flex gap-2">
            <button className="btn btn-success flex-fill btn-sm" onClick={() => addCategory('income')}>
              <i className="bi bi-plus"></i> Доход
            </button>
            <button className="btn btn-danger flex-fill btn-sm" onClick={() => addCategory('expense')}>
              <i className="bi bi-plus"></i> Расход
            </button>
          </div>
        </div>
      </div>

      {/* Группы контрагентов */}
      <div style={{ marginTop: '20px' }}>
        <GroupsManager />
      </div>

      {/* Ежемесячные платежи */}
      <div style={{ marginTop: '20px' }}>
        <MonthlyExpensesManager
          expenseCategories={expenseCategories}
          participants={participants}
        />
      </div>

      {/* Таблицы транзакций */}
      <div className="editor-grid" style={{ marginTop: '20px' }}>
        <div className="action-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h5><i className="bi bi-cash-coin"></i> Доходы</h5>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <TransactionTable
              data={incomes}
              type="income"
              onDelete={(id) => deleteTransaction('incomes', id)}
              onEdit={openEditModal}
            />
          </div>
        </div>

        <div className="action-card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h5><i className="bi bi-wallet2"></i> Расходы</h5>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <TransactionTable
              data={expenses}
              type="expense"
              onDelete={(id) => deleteTransaction('expenses', id)}
              onEdit={openEditModal}
            />
          </div>
        </div>
      </div>
    </>
  )
}

export default TransactionsEditor
