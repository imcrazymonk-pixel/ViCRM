import { formatMoney } from '@core/utils/format'

// 🆕 Компонент баланса с цветом
export const BalanceCell = ({ balance }) => {
  if (balance > 0) {
    return <span className="text-success">+{formatMoney(balance)}</span>
  }
  if (balance < 0) {
    return <span className="text-danger">{formatMoney(balance)}</span>
  }
  return <span className="text-muted">0₽</span>
}

export default BalanceCell
