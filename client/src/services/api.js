import axios from 'axios'

const LOCAL_API_URL = 'http://localhost:5000/api'
const PRODUCTION_API_URL = 'https://localfixr.onrender.com/api'

const normalizeApiUrl = (url) => {
  const cleanUrl = String(url || '').trim().replace(/\/+$/, '')
  if (!cleanUrl) return LOCAL_API_URL
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`
}

const getApiBaseUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_URL
  const fallbackUrl = import.meta.env.PROD ? PRODUCTION_API_URL : LOCAL_API_URL
  return normalizeApiUrl(envApiUrl || fallbackUrl)
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const passwordResetPaths = ['/forgot-password', '/verify-otp', '/reset-password']
      if (passwordResetPaths.includes(window.location.pathname)) {
        return Promise.reject(error)
      }
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default api
