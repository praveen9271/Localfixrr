import { motion } from 'framer-motion'
import { useFormik } from 'formik'
import { ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import * as Yup from 'yup'
import OTPInput from '../components/OTPInput'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import { forgotPassword, verifyResetOtp } from '../services/authService'

const getSecondsLeft = (expiresAt) => {
  const expiry = new Date(expiresAt || 0).getTime()
  if (!expiry) return 0
  return Math.max(0, Math.ceil((expiry - Date.now()) / 1000))
}

const otpSchema = Yup.object({
  otp: Yup.string()
    .matches(/^\d{6}$/, 'Enter the 6-digit OTP.')
    .required('OTP is required.'),
})

function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || sessionStorage.getItem('resetEmail') || ''
  const [expiresAt, setExpiresAt] = useState(location.state?.expiresAt || sessionStorage.getItem('resetExpiresAt') || '')
  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft(expiresAt))
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVariant, setToastVariant] = useState('success')

  const countdown = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = String(secondsLeft % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  }, [secondsLeft])

  const showToast = (message, variant = 'success') => {
    setToastVariant(variant)
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const formik = useFormik({
    initialValues: { otp: '' },
    validationSchema: otpSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      setLoading(true)
      try {
        const response = await verifyResetOtp({ email, otp: values.otp })
        sessionStorage.setItem('resetToken', response.resetToken)
        showToast(response.message)
        navigate('/reset-password', { state: { resetToken: response.resetToken } })
      } catch (error) {
        showToast(error.response?.data?.message || 'OTP verification failed', 'error')
      } finally {
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true })
      return
    }
    const timer = setInterval(() => setSecondsLeft(getSecondsLeft(expiresAt)), 1000)
    return () => clearInterval(timer)
  }, [email, expiresAt, navigate])

  const handleResend = async () => {
    setLoading(true)
    try {
      const response = await forgotPassword({ email })
      setExpiresAt(response.expiresAt || '')
      sessionStorage.setItem('resetExpiresAt', response.expiresAt || '')
      formik.resetForm()
      showToast('New OTP sent to your email')
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to resend OTP', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-[80vh] place-items-center bg-slate-50 px-4 py-12">
      <motion.form
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={formik.handleSubmit}
        className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_30px_80px_rgba(15,23,42,0.14)]"
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-500">Secure reset</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Verify OTP</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Enter the 6-digit code sent to <span className="font-bold text-slate-700">{email}</span>.</p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            OTP <span className="text-rose-500">*</span>
          </label>
          <OTPInput
            value={formik.values.otp}
            onChange={(value) => {
              formik.setFieldTouched('otp', true, false)
              formik.setFieldValue('otp', value)
            }}
            disabled={loading}
          />
          {formik.touched.otp && formik.errors.otp && (
            <span className="mt-2 block text-xs font-semibold text-rose-600">{formik.errors.otp}</span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-500">Expires in {countdown}</span>
          <button type="button" disabled={loading || secondsLeft > 0} onClick={handleResend} className="font-bold text-indigo-600 disabled:text-slate-400">
            Resend OTP
          </button>
        </div>

        <Button type="submit" disabled={loading || !formik.isValid} className="mt-6 w-full justify-center rounded-2xl py-4">
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Button>

        <Link to="/forgot-password" className="mt-5 block text-center text-sm font-bold text-slate-500 hover:text-indigo-600">
          Change email address
        </Link>
      </motion.form>
      <Toast message={toast} variant={toastVariant} />
    </main>
  )
}

export default VerifyOTP
