import { motion } from 'framer-motion'
import { useFormik } from 'formik'
import { ArrowLeft, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import * as Yup from 'yup'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { forgotPassword } from '../services/authService'

const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Enter a valid email address.')
    .required('Email is required.'),
})

function ForgotPassword() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVariant, setToastVariant] = useState('success')

  const showToast = (message, variant = 'success') => {
    setToastVariant(variant)
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values) => {
      const cleanEmail = values.email.trim().toLowerCase()
    setLoading(true)
    try {
      const response = await forgotPassword({ email: cleanEmail })
      sessionStorage.setItem('resetEmail', cleanEmail)
      sessionStorage.setItem('resetExpiresAt', response.expiresAt || '')
      showToast(response.message)
      navigate('/verify-otp', { state: { email: cleanEmail, expiresAt: response.expiresAt } })
    } catch (error) {
      showToast(error.response?.data?.message || error.userMessage || 'Unable to send reset OTP', 'error')
    } finally {
      setLoading(false)
    }
    },
  })

  return (
    <main className="grid min-h-[80vh] place-items-center bg-slate-50 px-4 py-12">
      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={formik.handleSubmit}
        className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_30px_80px_rgba(15,23,42,0.14)]"
      >
        <Link to="/?login=1" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <div className="mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Mail className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-500">LocalFixr</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Forgot password?</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Enter your registered email and we will send a 6-digit OTP to reset your password.</p>

        <label className="mt-6 block text-sm font-semibold text-slate-700">
          Email <span className="text-rose-500">*</span>
          <input
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            disabled={loading}
            className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${
              formik.touched.email && formik.errors.email ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
            }`}
            placeholder="you@example.com"
          />
          {formik.touched.email && formik.errors.email && (
            <span className="mt-2 block text-xs font-semibold text-rose-600">{formik.errors.email}</span>
          )}
        </label>

        <Button type="submit" disabled={loading} className="mt-6 w-full justify-center rounded-2xl py-4">
          {loading ? 'Sending OTP...' : 'Send reset OTP'}
        </Button>
      </motion.form>
      <Toast message={toast} variant={toastVariant} />
    </main>
  )
}

export default ForgotPassword
