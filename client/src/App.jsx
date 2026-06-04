import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { Camera, Eye, EyeOff, X } from 'lucide-react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import * as Yup from 'yup'
import Footer from './component/Footer'
import Navbar from './component/Navbar'
import RoleProtectedRoute from './component/RoleProtectedRoute'
import DashboardLayout from './component/DashboardLayout'
import Chatbot from './components/chatbot/Chatbot'
import { scrollToSection } from './utils/scroll'
import { SERVICE_CATEGORIES } from './constants/serviceCategories'
import {
  completeRegistration,
  getDashboardRoute,
  getDashboardRouteForRole,
  login,
  loginWithGoogle,
  persistSession,
  resendRegistrationOtp,
  startRegistration,
  updateProfilePhoto,
  verifyEmailOtp,
} from './services/authService'
import ProfileAvatar from './components/profile/ProfileAvatar'
import { button3d, button3dSubtle, darkAppShell, lightAppShell } from './utils/tailwindStyles'

const Home = lazy(() => import('./Pages/Home'))
const ForgotPassword = lazy(() => import('./Pages/ForgotPassword'))
const VerifyOTP = lazy(() => import('./Pages/VerifyOTP'))
const ResetPassword = lazy(() => import('./Pages/ResetPassword'))
const ProviderDetails = lazy(() => import('./Pages/ProviderDetails'))
const Services = lazy(() => import('./Pages/Services'))
const Reviews = lazy(() => import('./Pages/Reviews'))
const SupportPage = lazy(() => import('./Pages/SupportPage'))
const AdminDashboardNew = lazy(() => import('./dashboard/AdminDashboardNew'))
const ProviderDashboardNew = lazy(() => import('./dashboard/ProviderDashboardNew'))
const UserDashboardNew = lazy(() => import('./dashboard/UserDashboardNew'))
const UserProfile = lazy(() => import('./dashboard/UserProfile'))

const OTP_RESEND_COOLDOWN_SECONDS = 60
const GOOGLE_SCRIPT_ID = 'google-identity-services'
const PHONE_COUNTRY_CODES = [
  { code: '+91', label: 'IN +91' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+61', label: 'AU +61' },
  { code: '+971', label: 'AE +971' },
  { code: '+65', label: 'SG +65' },
]

const RequiredLabel = ({ children }) => (
  <span className="text-sm font-semibold text-slate-700">
    {children} <span className="text-rose-500">*</span>
  </span>
)

const FieldError = ({ children }) => (
  children ? <span className="mt-2 block text-xs font-semibold text-rose-600">{children}</span> : null
)

const inputStateClass = (hasError) =>
  hasError ? 'border-rose-300 bg-rose-50' : 'border-slate-200'

const loginSchema = Yup.object({
  email: Yup.string().trim().email('Enter a valid email address.').required('Email is required.'),
  password: Yup.string().required('Password is required.'),
})

const registerSchema = Yup.object({
  name: Yup.string().trim().min(2, 'Enter your full name.').required('Full name is required.'),
  email: Yup.string().trim().email('Enter a valid email address.').required('Email is required.'),
  phoneCountryCode: Yup.string().required('Country code is required.'),
  phone: Yup.string()
    .matches(/^\d{10}$/, 'Enter a valid 10-digit mobile number.')
    .required('Phone number is required.'),
  address: Yup.string().trim().min(5, 'Enter your complete address.').required('Address is required.'),
  city: Yup.string().trim().min(2, 'Enter your city.').required('City is required.'),
  state: Yup.string().trim().min(2, 'Enter your state.').required('State is required.'),
  role: Yup.string().oneOf(['user', 'service_provider']).required('Account type is required.'),
  businessName: Yup.string().when('role', {
    is: 'service_provider',
    then: (schema) => schema.trim().required('Business name is required.'),
    otherwise: (schema) => schema.notRequired(),
  }),
  serviceCategory: Yup.string().when('role', {
    is: 'service_provider',
    then: (schema) => schema.required('Select your service work.'),
    otherwise: (schema) => schema.notRequired(),
  }),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters.')
    .matches(/[A-Z]/, 'Add at least one uppercase letter.')
    .matches(/[a-z]/, 'Add at least one lowercase letter.')
    .matches(/\d/, 'Add at least one number.')
    .required('Password is required.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match.')
    .required('Confirm password is required.'),
})

const registrationOtpSchema = Yup.object({
  emailOtp: Yup.string()
    .matches(/^\d{6}$/, 'Enter the 6-digit email OTP.')
    .required('Verification code is required.'),
})

const loadGoogleIdentityScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID)
    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded bg-indigo-100" />
        <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  )
}

function ScrollManager() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const timer = setTimeout(() => scrollToSection(id), 0)
      return () => clearTimeout(timer)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname, location.search, location.hash])

  return null
}

function getLoginErrorMessage(error) {
  const message = error.response?.data?.message || error.message || ''
  const lowerMessage = message.toLowerCase()

  if (
    error.response?.status === 503 ||
    lowerMessage.includes('mongodb') ||
    lowerMessage.includes('ssl') ||
    lowerMessage.includes('tls') ||
    lowerMessage.includes('network access')
  ) {
    return 'Login service is temporarily unavailable. Add your current IP in MongoDB Atlas Network Access, then restart the server.'
  }

  return message || 'Login failed'
}

function LoginModal({ isOpen, onClose, onToast, onSwitchToRegister }) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const googleButtonRef = useRef(null)
  const navigate = useNavigate()

  const completeLogin = useCallback((response, resetForm) => {
    onToast(response.message)
    persistSession(response)
    resetForm?.()
    onClose()
    navigate(getDashboardRouteForRole(response.user?.role), { replace: true })
  }, [navigate, onClose, onToast])

  const loginFormik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true)

      try {
        const response = await login({ email: values.email.trim().toLowerCase(), password: values.password })
        completeLogin(response, resetForm)
      } catch (error) {
        onToast(getLoginErrorMessage(error))
      } finally {
        setLoading(false)
      }
    },
  })

  const handleGoogleCredential = useCallback(async (credential) => {
    if (!credential) {
      onToast('Google did not return a valid credential. Please try again.')
      return
    }

    setLoading(true)
    try {
      const response = await loginWithGoogle(credential)
      completeLogin(response)
    } catch (error) {
      onToast(error.response?.data?.message || error.userMessage || 'Google login failed')
    } finally {
      setLoading(false)
    }
  }, [completeLogin, onToast])

  useEffect(() => {
    if (!isOpen) return undefined

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || !googleButtonRef.current) return undefined

    let cancelled = false
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !googleButtonRef.current) return
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => handleGoogleCredential(response.credential),
        })
        googleButtonRef.current.innerHTML = ''
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 240,
        })
      })
      .catch(() => onToast('Unable to load Google sign-in. Please try again.'))

    return () => {
      cancelled = true
    }
  }, [handleGoogleCredential, isOpen, onToast])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <form
        onSubmit={loginFormik.handleSubmit}
        className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">
              LocalFixr
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Login</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`${button3dSubtle} rounded-full border border-slate-200 px-3 py-1 text-slate-500 hover:bg-slate-50`}
          >
            Close
          </button>
        </div>

        <label className="mt-6 block">
          <RequiredLabel>Email</RequiredLabel>
          <input
            name="email"
            type="email"
            value={loginFormik.values.email}
            onChange={loginFormik.handleChange}
            onBlur={loginFormik.handleBlur}
            className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${inputStateClass(loginFormik.touched.email && loginFormik.errors.email)}`}
            placeholder="you@example.com"
          />
          <FieldError>{loginFormik.touched.email && loginFormik.errors.email}</FieldError>
        </label>

        <label className="mt-4 block">
          <RequiredLabel>Password</RequiredLabel>
          <div className="mt-2 flex rounded-2xl border border-slate-200 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={loginFormik.values.password}
              onChange={loginFormik.handleChange}
              onBlur={loginFormik.handleBlur}
              className="w-full rounded-l-2xl px-4 py-3 outline-none"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="grid w-12 place-items-center text-slate-500 transition hover:scale-110 hover:text-indigo-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5 transition-transform" /> : <Eye className="h-5 w-5 transition-transform" />}
            </button>
          </div>
          <FieldError>{loginFormik.touched.password && loginFormik.errors.password}</FieldError>
        </label>

        <button
          type="submit"
          disabled={loading}
          className={`${button3d} mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4 font-semibold text-white disabled:opacity-50`}
        >
          {loading ? 'Logging in...' : 'Continue'}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <div ref={googleButtonRef} className="flex min-h-11 justify-center" />
        ) : (
          <button
            type="button"
            disabled
            className="mx-auto block w-auto rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-400"
          >
            Google sign-in is not configured
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onClose()
            navigate('/forgot-password')
          }}
          className="mt-4 w-full text-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Forgot Password?
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Register
          </button>
        </p>
      </form>
    </div>
  )
}

function RegisterModal({ isOpen, onClose, onToast, onSwitchToLogin }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [step, setStep] = useState('details')
  const [registrationSession, setRegistrationSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0)
  const [registrationPhotoFile, setRegistrationPhotoFile] = useState(null)
  const registrationPhotoInputRef = useRef(null)
  const navigate = useNavigate()
  const registrationPhotoPreview = useMemo(
    () => (registrationPhotoFile ? URL.createObjectURL(registrationPhotoFile) : ''),
    [registrationPhotoFile],
  )

  const buildRegistrationPayload = (values) => ({
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: values.phone.replace(/\D/g, '').slice(0, 10),
    address: [values.address, values.city, values.state].map((item) => item.trim()).filter(Boolean).join(', '),
    password: values.password,
    confirmPassword: values.confirmPassword,
    role: values.role,
    businessName: values.role === 'service_provider' ? values.businessName.trim() : undefined,
    serviceCategory: values.role === 'service_provider' ? values.serviceCategory : undefined,
  })

  const registerFormik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phoneCountryCode: '+91',
      phone: '',
      address: '',
      city: '',
      state: '',
      role: 'user',
      businessName: '',
      serviceCategory: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setLoading(true)

      try {
        const response = await startRegistration(buildRegistrationPayload(values))
        onToast(response.message)
        setRegistrationSession({ email: response.email, phone: response.phone })
        setResendSecondsLeft(response.retryAfterSeconds || OTP_RESEND_COOLDOWN_SECONDS)
        setStep('email')
      } catch (error) {
        onToast(error.response?.data?.message || 'Unable to send verification code')
      } finally {
        setLoading(false)
      }
    },
  })

  const otpFormik = useFormik({
    initialValues: { emailOtp: '' },
    validationSchema: registrationOtpSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      setLoading(true)
      try {
        const verifyResponse = await verifyEmailOtp({ ...registrationSession, otp: values.emailOtp })
        onToast(verifyResponse.message)
        const response = await completeRegistration(registrationSession)
        persistSession(response)
        if (registrationPhotoFile) {
          try {
            const photoResponse = await updateProfilePhoto(registrationPhotoFile)
            persistSession({ user: photoResponse.user })
            onToast(photoResponse.message || 'Profile photo saved')
          } catch (photoError) {
            onToast(photoError.response?.data?.message || 'Account created, but profile photo could not be saved')
          }
        }
        setStep('success')
        onToast(response.message)
        setTimeout(() => {
          resetRegisterForm()
          onClose()
          navigate(getDashboardRoute())
        }, 900)
      } catch (error) {
        onToast(error.response?.data?.message || 'Email OTP verification failed')
      } finally {
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    if (!isOpen || step !== 'email' || resendSecondsLeft <= 0) return undefined

    const timer = setInterval(() => {
      setResendSecondsLeft((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, step, resendSecondsLeft])

  useEffect(() => {
    if (!registrationPhotoPreview) return undefined
    return () => URL.revokeObjectURL(registrationPhotoPreview)
  }, [registrationPhotoPreview])

  if (!isOpen) return null

  const phoneDigits = registerFormik.values.phone.replace(/\D/g, '').slice(0, 10)
  const formattedPhone = phoneDigits.replace(/(\d{5})(\d{0,5})/, (_, first, second) =>
    second ? `${first} ${second}` : first,
  )

  const resetRegisterForm = () => {
    registerFormik.resetForm()
    otpFormik.resetForm()
    setShowPassword(false)
    setShowConfirmPassword(false)
    setRegistrationSession(null)
    setRegistrationPhotoFile(null)
    setResendSecondsLeft(0)
    setStep('details')
  }

  const handleRegistrationPhotoChange = (event) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setRegistrationPhotoFile(file)
  }

  const handleClose = () => {
    resetRegisterForm()
    onClose()
  }

  const handleResend = async () => {
    setLoading(true)
    try {
      if (!registrationSession?.email || !registrationSession?.phone) {
        const response = await startRegistration(buildRegistrationPayload(registerFormik.values))
        setRegistrationSession({ email: response.email, phone: response.phone })
        setResendSecondsLeft(response.retryAfterSeconds || OTP_RESEND_COOLDOWN_SECONDS)
        onToast(response.message)
        return
      }

      const response = await resendRegistrationOtp(registrationSession)
      setResendSecondsLeft(response.retryAfterSeconds || OTP_RESEND_COOLDOWN_SECONDS)
      onToast(response.message)
    } catch (error) {
      if (error.response?.data?.retryAfterSeconds) {
        setResendSecondsLeft(error.response.data.retryAfterSeconds)
      }
      if (error.response?.status === 404) {
        try {
          const response = await startRegistration(buildRegistrationPayload(registerFormik.values))
          setRegistrationSession({ email: response.email, phone: response.phone })
          setResendSecondsLeft(response.retryAfterSeconds || OTP_RESEND_COOLDOWN_SECONDS)
          otpFormik.resetForm()
          onToast(response.message)
          return
        } catch (restartError) {
          onToast(restartError.response?.data?.message || 'Please check your details and request a new OTP')
          return
        }
      }
      onToast(error.response?.data?.message || 'Unable to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  if (step !== 'details') {
    return (
      <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
        <form
          onSubmit={otpFormik.handleSubmit}
          className="w-full max-w-md rounded-[2rem] bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">
                Secure registration
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-900">
                {step === 'success' ? 'Account Created' : 'Verify Email'}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className={`${button3dSubtle} rounded-full border border-slate-200 px-3 py-1 text-slate-500 hover:bg-slate-50`}
            >
              Close
            </button>
          </div>

          {step === 'success' ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <p className="text-lg font-black">Your account is verified.</p>
              <p className="mt-2 text-sm">Redirecting you to your dashboard...</p>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Enter the 6-digit OTP sent to {registrationSession?.email}.
              </div>

              <label className="mt-5 block">
                <RequiredLabel>Verification code</RequiredLabel>
                <input
                  name="emailOtp"
                  type="text"
                  inputMode="numeric"
                  value={otpFormik.values.emailOtp}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, '').slice(0, 6)
                    otpFormik.setFieldTouched('emailOtp', true, false)
                    otpFormik.setFieldValue('emailOtp', value)
                  }}
                  onBlur={otpFormik.handleBlur}
                  minLength="6"
                  maxLength="6"
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-center text-2xl font-black tracking-[0.45em] outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${inputStateClass(otpFormik.touched.emailOtp && otpFormik.errors.emailOtp)}`}
                  placeholder="000000"
                />
                <FieldError>{otpFormik.touched.emailOtp && otpFormik.errors.emailOtp}</FieldError>
              </label>

              <button
                type="submit"
                disabled={loading || !otpFormik.isValid}
                className={`${button3d} mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4 font-semibold text-white disabled:opacity-50`}
              >
                {loading ? 'Verifying...' : 'Verify Email & Create Account'}
              </button>

              <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="font-semibold text-slate-500 hover:text-slate-700"
                >
                  Edit details
                </button>
                <button
                  type="button"
                  disabled={loading || resendSecondsLeft > 0}
                  onClick={handleResend}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  {resendSecondsLeft > 0 ? `Resend in ${resendSecondsLeft}s` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <form
        onSubmit={registerFormik.handleSubmit}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white p-7 shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">
              LocalFixr
            </p>
            <h2 className="mt-2 text-3xl font-black text-slate-900">Create Account</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className={`${button3dSubtle} rounded-full border border-slate-200 px-3 py-1 text-slate-500 hover:bg-slate-50`}
          >
            Close
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <button
            type="button"
            onClick={() => registrationPhotoInputRef.current?.click()}
            className="group relative h-16 w-16 shrink-0 rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-100"
            aria-label={registrationPhotoFile ? 'Change profile photo' : 'Add optional profile photo'}
          >
            <ProfileAvatar
              src={registrationPhotoPreview}
              name={registerFormik.values.name}
              email={registerFormik.values.email}
              size="md"
              className="h-16 w-16 border-2 border-white shadow-sm"
            />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100">
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">Profile photo</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                ref={registrationPhotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleRegistrationPhotoChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => registrationPhotoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Camera className="h-3.5 w-3.5" />
                {registrationPhotoFile ? 'Change Photo' : 'Add Photo'}
              </button>
              {registrationPhotoFile && (
                <button
                  type="button"
                  onClick={() => setRegistrationPhotoFile(null)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        <label className="mt-6 block">
          <RequiredLabel>Full Name</RequiredLabel>
          <input
            name="name"
            type="text"
            value={registerFormik.values.name}
            onChange={registerFormik.handleChange}
            onBlur={registerFormik.handleBlur}
            className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${inputStateClass(registerFormik.touched.name && registerFormik.errors.name)}`}
            placeholder="Enter your full name"
          />
          <FieldError>{registerFormik.touched.name && registerFormik.errors.name}</FieldError>
        </label>

        <label className="mt-4 block">
          <RequiredLabel>Email</RequiredLabel>
          <input
            name="email"
            type="email"
            value={registerFormik.values.email}
            onChange={registerFormik.handleChange}
            onBlur={registerFormik.handleBlur}
            className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${inputStateClass(registerFormik.touched.email && registerFormik.errors.email)}`}
            placeholder="you@example.com"
          />
          <FieldError>{registerFormik.touched.email && registerFormik.errors.email}</FieldError>
        </label>

        <div className="mt-4">
          <RequiredLabel>Phone Number</RequiredLabel>
          <div className="mt-2 grid grid-cols-[5.25rem_1fr] overflow-hidden rounded-2xl border border-slate-200 bg-white transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
            <label className="sr-only" htmlFor="register-phone-code">
              Country code
            </label>
            <select
              id="register-phone-code"
              name="phoneCountryCode"
              value={registerFormik.values.phoneCountryCode}
              onChange={registerFormik.handleChange}
              onBlur={registerFormik.handleBlur}
              className="cursor-pointer border-r border-slate-200 bg-slate-50 px-1.5 py-3 text-[0.7rem] font-bold text-slate-700 outline-none"
            >
              {PHONE_COUNTRY_CODES.map((item) => (
                <option key={`${item.label}-${item.code}`} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="register-phone">
              Phone number
            </label>
            <input
              id="register-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={formattedPhone}
              onChange={(event) => registerFormik.setFieldValue('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
              onBlur={() => registerFormik.setFieldTouched('phone', true)}
              maxLength="11"
              className="w-full px-4 py-3 text-sm text-slate-900 outline-none"
              placeholder="98765 43210"
            />
          </div>
          <FieldError>{registerFormik.touched.phone && registerFormik.errors.phone}</FieldError>
          <div className="mt-2 text-xs text-slate-500">
            <span>Use a 10-digit mobile number.</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="block">
            <RequiredLabel>Address</RequiredLabel>
            <textarea
              name="address"
              value={registerFormik.values.address}
              onChange={registerFormik.handleChange}
              onBlur={registerFormik.handleBlur}
              rows="2"
              className={`mt-2 w-full resize-none rounded-2xl border px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${inputStateClass(registerFormik.touched.address && registerFormik.errors.address)}`}
              placeholder="House no, street, area"
            />
            <FieldError>{registerFormik.touched.address && registerFormik.errors.address}</FieldError>
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <RequiredLabel>City</RequiredLabel>
              <input
                name="city"
                type="text"
                value={registerFormik.values.city}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${inputStateClass(registerFormik.touched.city && registerFormik.errors.city)}`}
                placeholder="Phagwara"
              />
              <FieldError>{registerFormik.touched.city && registerFormik.errors.city}</FieldError>
            </label>

            <label className="block">
              <RequiredLabel>State</RequiredLabel>
              <input
                name="state"
                type="text"
                value={registerFormik.values.state}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${inputStateClass(registerFormik.touched.state && registerFormik.errors.state)}`}
                placeholder="Punjab"
              />
              <FieldError>{registerFormik.touched.state && registerFormik.errors.state}</FieldError>
            </label>
          </div>
        </div>

        <label className="mt-4 block">
          <RequiredLabel>Account Type</RequiredLabel>
          <select
            name="role"
            value={registerFormik.values.role}
            onChange={(event) => {
              const nextRole = event.target.value
              registerFormik.setFieldValue('role', nextRole)
              if (nextRole !== 'service_provider') {
                registerFormik.setFieldValue('businessName', '')
                registerFormik.setFieldValue('serviceCategory', '')
              }
            }}
            onBlur={registerFormik.handleBlur}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 bg-white"
          >
            <option value="user">Customer - Book Services</option>
            <option value="service_provider">Service Provider - Offer Services</option>
          </select>
        </label>

        {registerFormik.values.role === 'service_provider' && (
          <>
            <label className="mt-4 block">
              <RequiredLabel>Business Name</RequiredLabel>
              <input
                type="text"
                name="businessName"
                value={registerFormik.values.businessName}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${inputStateClass(registerFormik.touched.businessName && registerFormik.errors.businessName)}`}
                placeholder="Enter your business name"
              />
              <FieldError>{registerFormik.touched.businessName && registerFormik.errors.businessName}</FieldError>
            </label>

            <label className="mt-4 block">
              <RequiredLabel>Service Work</RequiredLabel>
              <select
                name="serviceCategory"
                value={registerFormik.values.serviceCategory}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                className={`mt-2 w-full rounded-2xl border bg-white px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 ${inputStateClass(registerFormik.touched.serviceCategory && registerFormik.errors.serviceCategory)}`}
              >
                <option value="">Select your work type</option>
                {SERVICE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <FieldError>{registerFormik.touched.serviceCategory && registerFormik.errors.serviceCategory}</FieldError>
              <p className="mt-2 text-xs text-slate-500">Only approved LocalFixr service works can register.</p>
            </label>
          </>
        )}

        <div className="mt-4 grid gap-4">
          <label className="block">
            <RequiredLabel>Password</RequiredLabel>
            <div className="mt-2 flex rounded-2xl border border-slate-200 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={registerFormik.values.password}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                minLength="6"
                className="min-w-0 w-full rounded-l-2xl px-4 py-3 outline-none"
                placeholder="Create password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="grid w-12 shrink-0 place-items-center text-slate-500 transition hover:scale-110 hover:text-indigo-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5 transition-transform" /> : <Eye className="h-5 w-5 transition-transform" />}
              </button>
            </div>
            <FieldError>{registerFormik.touched.password && registerFormik.errors.password}</FieldError>
          </label>

          <label className="block">
            <RequiredLabel>Confirm Password</RequiredLabel>
            <div className="mt-2 flex rounded-2xl border border-slate-200 transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={registerFormik.values.confirmPassword}
                onChange={registerFormik.handleChange}
                onBlur={registerFormik.handleBlur}
                minLength="6"
                className="min-w-0 w-full rounded-l-2xl px-4 py-3 outline-none"
                placeholder="Confirm password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="grid w-12 shrink-0 place-items-center text-slate-500 transition hover:scale-110 hover:text-indigo-600"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5 transition-transform" /> : <Eye className="h-5 w-5 transition-transform" />}
              </button>
            </div>
            <FieldError>{registerFormik.touched.confirmPassword && registerFormik.errors.confirmPassword}</FieldError>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`${button3d} mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4 font-semibold text-white disabled:opacity-50`}
        >
          {loading ? 'Sending Email OTP...' : 'Send Email OTP'}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              resetRegisterForm()
              onSwitchToLogin()
            }}
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Login
          </button>
        </p>
      </form>
    </div>
  )
}

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, setToast] = useState('')
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const toastTimerRef = useRef(null)

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
  }, [])

  const showToast = (message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(message)
    toastTimerRef.current = setTimeout(() => {
      setToast('')
      toastTimerRef.current = null
    }, 4000)
  }

  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false)
    setIsLoginOpen(true)
  }

  const handleSwitchToRegister = () => {
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
    if (location.pathname === '/' && new URLSearchParams(location.search).get('login') === '1') {
      navigate('/', { replace: true })
    }
  }

  const isDashboardRoute = location.pathname.startsWith('/dashboard')
  const isLoginRequested = location.pathname === '/' && new URLSearchParams(location.search).get('login') === '1'

  const handleLoginClose = () => {
    setIsLoginOpen(false)
    if (isLoginRequested) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className={darkMode ? darkAppShell : lightAppShell}>
      <ScrollManager />
      {!isDashboardRoute && (
        <Navbar
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((current) => !current)}
          onLoginClick={() => setIsLoginOpen(true)}
          onRegisterClick={() => setIsRegisterOpen(true)}
          onToast={showToast}
        />
      )}
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home darkMode={darkMode} onToast={showToast} />} />
        <Route path="/services" element={<Services />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/provider/:id" element={<ProviderDetails />} />
        <Route path="/support/:slug" element={<SupportPage />} />
        <Route path="/login" element={<Navigate to="/?login=1" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Admin Dashboard Routes */}
        <Route
          path="/dashboard/admin/*"
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <Routes>
                  <Route index element={<AdminDashboardNew defaultTab="dashboard" />} />
                  <Route path="users" element={<AdminDashboardNew defaultTab="users" />} />
                  <Route path="providers" element={<AdminDashboardNew defaultTab="providers" />} />
                  <Route path="services" element={<AdminDashboardNew defaultTab="services" />} />
                  <Route path="categories" element={<AdminDashboardNew defaultTab="categories" />} />
                  <Route path="bookings" element={<AdminDashboardNew defaultTab="bookings" />} />
                  <Route path="reviews" element={<AdminDashboardNew defaultTab="reviews" />} />
                  <Route path="reports" element={<AdminDashboardNew defaultTab="reports" />} />
                  <Route path="notifications" element={<AdminDashboardNew defaultTab="notifications" />} />
                  <Route path="settings" element={<AdminDashboardNew defaultTab="settings" />} />
                  <Route path="profile" element={<UserProfile />} />
                </Routes>
              </DashboardLayout>
            </RoleProtectedRoute>
          }
        />

        {/* Provider Dashboard Routes */}
        <Route
          path="/dashboard/provider/*"
          element={
            <RoleProtectedRoute allowedRoles={['service_provider']}>
              <DashboardLayout>
                <Routes>
                  <Route index element={<ProviderDashboardNew defaultTab="bookings" />} />
                  <Route path="bookings" element={<ProviderDashboardNew defaultTab="bookings" />} />
                  <Route path="services" element={<ProviderDashboardNew defaultTab="services" />} />
                  <Route path="reviews" element={<ProviderDashboardNew defaultTab="reviews" />} />
                  <Route path="profile" element={<ProviderDashboardNew defaultTab="profile" />} />
                </Routes>
              </DashboardLayout>
            </RoleProtectedRoute>
          }
        />

        {/* User Dashboard Routes */}
        <Route
          path="/dashboard/user/*"
          element={
            <RoleProtectedRoute allowedRoles={['user']}>
              <DashboardLayout>
                <Routes>
                  <Route index element={<UserDashboardNew defaultTab="dashboard" />} />
                  <Route path="services" element={<UserDashboardNew defaultTab="services" />} />
                  <Route path="bookings" element={<UserDashboardNew defaultTab="bookings" />} />
                  <Route path="profile" element={<UserProfile />} />
                </Routes>
              </DashboardLayout>
            </RoleProtectedRoute>
          }
        />

        {/* 404 Catch-all */}
        <Route path="*" element={
          <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="text-center">
              <h1 className="text-6xl font-black text-slate-900">404</h1>
              <p className="mt-2 text-lg text-slate-600">Page not found.</p>
              <a href="/" className="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">Go Home</a>
            </div>
          </div>
        } />
      </Routes>
      </Suspense>
      {!isDashboardRoute && <Footer onToast={showToast} />}
      {!isDashboardRoute && <Chatbot />}
      <LoginModal
        isOpen={isLoginOpen || isLoginRequested}
        onClose={handleLoginClose}
        onToast={showToast}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onToast={showToast}
        onSwitchToLogin={handleSwitchToLogin}
      />
      {toast && (
        <div className="fixed bottom-5 right-5 z-[90] max-w-sm rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(15,23,42,0.25)]">
          {toast}
        </div>
      )}
    </div>
  )
}

export default App
