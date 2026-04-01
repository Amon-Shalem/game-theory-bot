import axios from 'axios'

/** 統一的 axios instance，所有 API 呼叫都透過此 instance */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  response => response,
  error => {
    console.error('[API Error]', error.response?.data ?? error.message)
    return Promise.reject(error)
  }
)

export default api
