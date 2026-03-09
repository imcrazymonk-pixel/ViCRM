import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

/**
 * Хук для управления доходами
 */
export function useIncomes() {
  const [incomes, setIncomes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchIncomes = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get('/incomes')
      setIncomes(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Ошибка загрузки доходов')
    } finally {
      setLoading(false)
    }
  }, [])

  const createIncome = useCallback(async (data) => {
    await api.post('/incomes', data)
    await fetchIncomes()
  }, [fetchIncomes])

  const updateIncome = useCallback(async (id, data) => {
    await api.put(`/incomes/${id}`, data)
    await fetchIncomes()
  }, [fetchIncomes])

  const deleteIncome = useCallback(async (id) => {
    await api.delete(`/incomes/${id}`)
    await fetchIncomes()
  }, [fetchIncomes])

  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  return {
    incomes,
    loading,
    error,
    refetch: fetchIncomes,
    createIncome,
    updateIncome,
    deleteIncome
  }
}

/**
 * Хук для управления расходами
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get('/expenses')
      setExpenses(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err.message || 'Ошибка загрузки расходов')
    } finally {
      setLoading(false)
    }
  }, [])

  const createExpense = useCallback(async (data) => {
    await api.post('/expenses', data)
    await fetchExpenses()
  }, [fetchExpenses])

  const updateExpense = useCallback(async (id, data) => {
    await api.put(`/expenses/${id}`, data)
    await fetchExpenses()
  }, [fetchExpenses])

  const deleteExpense = useCallback(async (id) => {
    await api.delete(`/expenses/${id}`)
    await fetchExpenses()
  }, [fetchExpenses])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  return {
    expenses,
    loading,
    error,
    refetch: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  }
}
