import { api, API_URL } from '@core/api/api'

export const financeApi = {
  // Summary
  getSummary: () => api.get('/summary'),
  
  // Participants
  getParticipants: () => api.get('/participants'),
  createParticipant: (data, allowDuplicate) => 
    api.post('/participants', data, { params: { allow_duplicate: allowDuplicate } }),
  updateParticipant: (id, data) => api.put(`/participants/${id}`, data),
  deleteParticipant: (id) => api.delete(`/participants/${id}`),
  
  // Groups
  getGroups: () => api.get('/groups'),
  
  // Categories
  getIncomeCategories: () => api.get('/income_categories'),
  getExpenseCategories: () => api.get('/expense_categories'),
  createCategory: (type, name) => api.post(`/${type}_categories`, { name }),
  updateCategory: (type, id, name) => api.put(`/${type}_categories/${id}`, { name }),
  deleteCategory: (type, id) => api.delete(`/${type}_categories/${id}`),
  
  // Transactions
  getIncomes: () => api.get('/incomes'),
  getExpenses: () => api.get('/expenses'),
  createIncome: (data) => api.post('/incomes', data),
  createExpense: (data) => api.post('/expenses', data),
  updateIncome: (id, data) => api.put(`/incomes/${id}`, data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteIncome: (id) => api.delete(`/incomes/${id}`),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  
  // Forecast
  getForecast: () => api.get('/finance/forecast')
}
