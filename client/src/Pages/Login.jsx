import { useState } from 'react'
import { useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { getDashboardRoute, getDashboardRouteForRole, isAuthenticated, login, persistSession } from '../services/authService'

const getLoginErrorMessage = (err) => {
  const message = err.response?.data?.message || err.message || ''
  const lowerMessage = message.toLowerCase()

  if (
    err.response?.status === 503 ||
    lowerMessage.includes('mongodb') ||
    lowerMessage.includes('ssl') ||
    lowerMessage.includes('tls') ||
    lowerMessage.includes('network access')
  ) {
    return 'Login service is temporarily unavailable. Check MongoDB Atlas Network Access and try again.'
  }

  return message || 'Login failed'
}

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(getDashboardRoute(), { replace: true })
    }
  }, [navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      persistSession(response)
      navigate(getDashboardRouteForRole(response.user?.role), { replace: true })
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">LocalFixr</p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">Login</h1>
        <p className="mt-3 text-slate-500">Access your customer, provider, or admin dashboard.</p>

        {error && <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400"
          />
        </label>

        <label className="mt-5 block text-sm font-semibold text-slate-700">
          Password
          <div className="mt-2 flex rounded-lg border border-slate-200 transition focus-within:border-indigo-400">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
              className="w-full rounded-l-lg px-4 py-3 outline-none"
            />
            <button type="button" onClick={() => setShowPassword((current) => !current)} className="grid w-12 place-items-center text-slate-500">
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </label>

        <div className="mt-3 text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            Forgot Password?
          </Link>
        </div>

        <button disabled={loading} className="mt-7 w-full rounded-lg bg-indigo-600 px-6 py-4 font-semibold text-white disabled:opacity-60">
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <p className="mt-5 text-center text-sm text-slate-500">
          New here? <Link to="/" className="font-semibold text-indigo-600">Use the register button in the header</Link>
        </p>
      </form>
    </main>
  )
}

export default Login
