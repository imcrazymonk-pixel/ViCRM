import axios from 'axios'

const API_URL = 'http://localhost:8002/api'

// Базовый API клиент
export const api = {
  get: async (endpoint) => {
    const response = await axios.get(`${API_URL}${endpoint}`)
    return response.data
  },
  post: async (endpoint, data) => {
    const response = await axios.post(`${API_URL}${endpoint}`, data)
    return response.data
  },
  put: async (endpoint, data) => {
    const response = await axios.put(`${API_URL}${endpoint}`, data)
    return response.data
  },
  delete: async (endpoint) => {
    const response = await axios.delete(`${API_URL}${endpoint}`)
    return response.data
  }
}
