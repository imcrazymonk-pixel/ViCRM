import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

/**
 * Хук для управления контрагентами
 */
export function useParticipants() {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get('/participants')
      setParticipants(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Ошибка загрузки контрагентов:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createParticipant = useCallback(async (data) => {
    await api.post('/participants', data)
    await fetchParticipants()
  }, [fetchParticipants])

  const updateParticipant = useCallback(async (id, data) => {
    await api.put(`/participants/${id}`, data)
    await fetchParticipants()
  }, [fetchParticipants])

  const deleteParticipant = useCallback(async (id) => {
    await api.delete(`/participants/${id}`)
    await fetchParticipants()
  }, [fetchParticipants])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  return {
    participants,
    loading,
    refetch: fetchParticipants,
    createParticipant,
    updateParticipant,
    deleteParticipant
  }
}

/**
 * Хук для категорий доходов
 */
export function useIncomeCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/income_categories')
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}

/**
 * Хук для категорий расходов
 */
export function useExpenseCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/expense_categories')
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { categories, loading }
}

/**
 * Хук для сводной статистики
 */
export function useSummary() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.get('/summary')
      setSummary(data)
    } catch (err) {
      console.error('Ошибка загрузки сводки:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return { summary, loading, refetch: fetchSummary }
}
