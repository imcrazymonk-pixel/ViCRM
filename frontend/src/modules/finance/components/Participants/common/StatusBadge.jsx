// 🆕 Компонент статуса участника
export const StatusBadge = ({ isActive, balance }) => {
  if (!isActive) {
    return (
      <span className="badge bg-secondary text-white">
        ⏸️ Пауза
      </span>
    )
  }

  if (balance < 0) {
    return (
      <span className="badge bg-danger text-white">
        🔴 Долг
      </span>
    )
  }

  if (balance > 0) {
    return (
      <span className="badge bg-success text-white">
        🟢 Аванс
      </span>
    )
  }

  return (
    <span className="badge bg-primary text-white">
      ✅ Активен
    </span>
  )
}

export default StatusBadge
