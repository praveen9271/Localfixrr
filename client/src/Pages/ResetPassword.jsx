import { motion } from 'framer-motion'
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { resetPassword } from '../services/authService'

const getPasswordScore = (password) => {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  return score
}

function ResetPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const resetToken = location.state?.resetToken || sessionStorage.getItem('resetToken') || ''
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVariant, setToastVariant] = useState('success')

  const score = useMemo(() => getPasswordScore(form.newPassword), [form.newPassword])
  const strength = ['Very weak', 'Weak', 'Good', 'Strong', 'Excellent'][Math.max(0, score - 1)] || 'Very weak'

  const showToast = (message, variant = 'success') => {
    setToastVariant(variant)
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const response = await resetPassword({ resetToken, ...form })
      sessionStorage.removeItem('resetEmail')
      sessionStorage.removeItem('resetExpiresAt')
      sessionStorage.removeItem('resetToken')
      setSuccess(true)
      showToast(response.message)
      setTimeout(() => navigate('/?login=1', { replace: true }), 1500)
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to reset password', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-[80vh] place-items-center bg-slate-50 px-4 py-12">
      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_30px_80px_rgba(15,23,42,0.14)]"
      >
        {success ? (
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-8 text-center">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            <h1 className="mt-5 text-3xl font-black text-slate-950">Password updated</h1>
            <p className="mt-3 text-sm text-slate-500">Redirecting you to login...</p>
          </motion.div>
        ) : (
          <>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Lock className="h-7 w-7" />
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-500">LocalFixr</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Create new password</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Use at least 8 characters with uppercase, lowercase, and a number.</p>

            {!resetToken && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Reset session missing. Please verify your OTP again.
              </div>
            )}

            <label className="mt-6 block text-sm font-semibold text-slate-700">
              New Password
              <div className="mt-2 flex rounded-2xl border border-slate-200 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                  required
                  className="w-full rounded-l-2xl px-4 py-3 outline-none"
                  placeholder="Enter new password"
                />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="grid w-12 place-items-center text-slate-500">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.min(score, 5) * 20}%` }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-500">Password strength: {strength}</p>
            </div>

            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Confirm Password
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                placeholder="Confirm new password"
              />
            </label>

            <Button type="submit" disabled={loading || !resetToken} className="mt-6 w-full justify-center rounded-2xl py-4">
              {loading ? 'Updating...' : 'Update password'}
            </Button>

            <Link to="/forgot-password" className="mt-5 block text-center text-sm font-bold text-slate-500 hover:text-indigo-600">
              Request a new OTP
            </Link>
          </>
        )}
      </motion.form>
      <Toast message={toast} variant={toastVariant} />
    </main>
  )
}

export default ResetPassword
