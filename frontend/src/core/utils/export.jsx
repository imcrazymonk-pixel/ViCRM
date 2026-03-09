import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { notifySuccess } from './notifications'

// Экспорт в CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('Нет данных для экспорта')
    return
  }

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header =>
        `"${row[header] || ''}"`
      ).join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `${filename}.csv`)
  notifySuccess('📥 Файл экспортирован')
}

// Экспорт в Excel
export const exportToExcel = (data, filename, sheetName = 'Data') => {
  if (!data || data.length === 0) {
    alert('Нет данных для экспорта')
    return
  }

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Генерируем файл
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${filename}.xlsx`)
  notifySuccess('📥 Файл экспортирован')
}

// Экспорт транзакций
export const exportTransactions = (incomes, expenses, type = 'all') => {
  const formatTransaction = (t, ttype) => ({
    'Дата': new Date(t.created_at).toLocaleDateString('ru-RU'),
    'Тип': ttype === 'income' ? 'Доход' : 'Расход',
    'Участник': t.participant_name,
    'Категория': t.category_name,
    'Сумма': t.amount.toFixed(2),
    'Описание': t.description || '-'
  })

  let data = []
  let filename = `transactions_${new Date().toISOString().split('T')[0]}`

  if (type === 'all' || type === 'incomes') {
    data = [...data, ...incomes.map(t => formatTransaction(t, 'income'))]
  }

  if (type === 'all' || type === 'expenses') {
    data = [...data, ...expenses.map(t => formatTransaction(t, 'expense'))]
  }

  // Сортируем по дате
  data.sort((a, b) => new Date(a['Дата']) - new Date(b['Дата']))

  exportToExcel(data, filename, 'Транзакции')
}

// Экспорт отчёта
export const exportReport = (summary, incomes, expenses, participants) => {
  const report = [
    { 'Отчёт': 'Финансы группы', 'Дата': new Date().toLocaleDateString('ru-RU') },
    {},
    { 'Показатель': 'Общая сумма', 'Значение': '' },
    { 'Показатель': 'Баланс', 'Значение': summary.balance.toFixed(2) },
    { 'Показатель': 'Доходы', 'Значение': summary.total_income.toFixed(2) },
    { 'Показатель': 'Расходы', 'Значение': summary.total_expense.toFixed(2) },
    { 'Показатель': 'Участников', 'Значение': summary.participants_count },
    { 'Показатель': 'Всего транзакций', 'Значение': incomes.length + expenses.length },
    {},
    { 'Показатель': 'Средний чек (доход)', 'Значение': (incomes.length > 0 ? (summary.total_income / incomes.length).toFixed(2) : '0') },
    { 'Показатель': 'Средний чек (расход)', 'Значение': (expenses.length > 0 ? (summary.total_expense / expenses.length).toFixed(2) : '0') },
  ]

  exportToExcel(report, `report_${new Date().toISOString().split('T')[0]}`, 'Отчёт')
}

// Кнопка экспорта
export const ExportButton = ({ onClick, variant = 'primary', size = 'sm', children }) => {
  const btnClass = variant === 'success' ? 'btn-success' :
                   variant === 'danger' ? 'btn-danger' :
                   variant === 'outline' ? 'btn-outline-primary' : 'btn-primary'

  return (
    <button className={`btn ${btnClass} ${size === 'sm' ? 'btn-sm' : ''}`} onClick={onClick}>
      <i className="bi bi-download"></i> {children}
    </button>
  )
}
