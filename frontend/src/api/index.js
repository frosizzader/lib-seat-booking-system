import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const request = axios.create({
  baseURL,
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export const login = (data) => request.post('/auth/login', data)
export const register = (data) => request.post('/auth/register', data)
export const getUserInfo = () => request.get('/auth/me')
export const getMyReservations = (params) => request.get('/reservations/me', { params })
export const getAllReservations = (params) => request.get('/reservations/all', { params })
export const getSeats = (params) => request.get('/seats', { params })
export const getUsers = () => request.get('/users')
export const updateRules = (data) => request.put('/rules', data)
export const updateSeat = (id, data) => request.put(`/seats/${id}`, data)
export const deleteSeat = (id) => request.delete(`/seats/${id}`)
export const cancelRes = (id) => request.post(`/reservations/${id}/cancel`)
export const createReservation = (data) => request.post('/reservations', data)
export const checkin = (id) => request.post(`/reservations/${id}/checkin`)
export const release = (id) => request.post(`/reservations/${id}/release`)
export const getStats = () => request.get('/stats/overview')
export const getViolations = () => request.get('/violations')
export const getMyViolations = () => request.get('/violations/me')
export const deleteViolation = (id) => request.delete(`/violations/${id}`)

export default request