import axios from 'axios'

const AUTH_STORAGE_KEYS = ['token', 'user']

const readStorage = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const removeStorage = (key) => {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage failures in restricted browser contexts.
  }
}

const normalizeApiUrl = (url) => {
  const cleanUrl = String(url || '').trim().replace(/\/+$/, '')
  if (!cleanUrl) return 'http://localhost:5000/api'
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`
}

const getApiBaseUrl = () => {
  const { VITE_API_URL, VITE_LOCAL_API_URL } = import.meta.env
  return normalizeApiUrl(VITE_API_URL || VITE_LOCAL_API_URL)
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 15000),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = readStorage('token')
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
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'The server took too long to respond. Please try again.'
    } else if (!error.response) {
      error.userMessage = 'Unable to reach the local server. Make sure it is running on http://localhost:5000.'
    }

    if (error.response?.status === 401) {
      const passwordResetPaths = ['/forgot-password', '/verify-otp', '/reset-password']
      if (passwordResetPaths.includes(window.location.pathname)) {
        return Promise.reject(error)
      }
      AUTH_STORAGE_KEYS.forEach(removeStorage)
      if (window.location.pathname !== '/' || window.location.search !== '?login=1') {
        window.location.assign('/?login=1')
      }
    }
    return Promise.reject(error)
  }
)

export default api
