// Компонент карточки сводки
export const SummaryCard = ({ label, value, type = '' }) => (
  <div className={`summary-card ${type}`}>
    <div className="label">{label}</div>
    <div className="value">{value}</div>
  </div>
)

export default SummaryCard
