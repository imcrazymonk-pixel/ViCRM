import { toast, Bounce } from 'react-toastify'

// Настройки по умолчанию
const defaultOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
  transition: Bounce,
}

// Успешное уведомление
export const notifySuccess = (message, options = {}) => {
  toast.success(message, { ...defaultOptions, ...options })
}

// Ошибка
export const notifyError = (message, options = {}) => {
  toast.error(message, { ...defaultOptions, ...options, autoClose: 5000 })
}

// Информация
export const notifyInfo = (message, options = {}) => {
  toast.info(message, { ...defaultOptions, ...options })
}

// Предупреждение
export const notifyWarning = (message, options = {}) => {
  toast.warning(message, { ...defaultOptions, ...options })
}

// Уведомление о добавлении контрагента
export const notifyParticipantAdded = (name) => {
  notifySuccess(`📦 Контрагент "${name}" добавлен`, {
    icon: '📦'
  })
}

// Уведомление о транзакции
export const notifyTransactionAdded = (type, amount, participant) => {
  const icon = type === 'income' ? '💰' : '💸'
  const text = type === 'income' ? 'внёс' : 'потратил'
  notifySuccess(`${icon} ${participant} ${text} ${amount}`, {
    icon
  })
}

// Уведомление об удалении
export const notifyDeleted = (type, name) => {
  notifyInfo(`🗑️ ${type} "${name}" удалён`, {
    icon: '🗑️'
  })
}

// Уведомление об экспорте
export const notifyExport = () => {
  notifySuccess('📥 Файл экспортирован', {
    icon: '📥'
  })
}

// Уведомление об ошибке удаления
export const notifyDeleteError = (reason) => {
  notifyError(`❌ Нельзя удалить: ${reason}`, {
    icon: '❌'
  })
}
