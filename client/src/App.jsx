import { Suspense, lazy, useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'
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
  persistSession,
  resendRegistrationOtp,
  startRegistration,
  verifyEmailOtp,
} from './services/authService'
import { validateRegisterForm } from './utils/validation'
import { button3d, button3dSubtle, darkAppShell, lightAppShell } from './utils/tailwindStyles'

const Home = lazy(() => import('./Pages/Home'))
const Login = lazy(() => import('./Pages/Login'))
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
      setTimeout(() => scrollToSection(id), 0)
      return
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    
    try {
      const response = await login({ email: email.trim().toLowerCase(), password })
      onToast(response.message)
      persistSession(response)
      setEmail('')
      setPassword('')
      onClose()

      navigate(getDashboardRouteForRole(response.user?.role), { replace: true })
    } catch (error) {
      onToast(getLoginErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
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
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            placeholder="you@example.com"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            placeholder="Enter password"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className={`${button3d} mt-6 w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-6 py-4 font-semibold text-white disabled:opacity-50`}
        >
          {loading ? 'Logging in...' : 'Continue'}
        </button>

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
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('user')
  const [businessName, setBusinessName] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')
  const [step, setStep] = useState('details')
  const [emailOtp, setEmailOtp] = useState('')
  const [registrationSession, setRegistrationSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (!isOpen) return null

  const phoneDigits = phone.replace(/\D/g, '').slice(0, 10)
  const formattedPhone = phoneDigits.replace(/(\d{5})(\d{0,5})/, (_, first, second) =>
    second ? `${first} ${second}` : first,
  )
  const handleSubmit = async (event) => {
    event.preventDefault()
    
    const validationMessage = validateRegisterForm({ name, email, phone: phoneDigits, address, password, confirmPassword })
    if (validationMessage) {
      onToast(validationMessage)
      return
    }

    if (role === 'service_provider' && !serviceCategory) {
      onToast('Please select the service work you provide')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await startRegistration({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phoneDigits,
        address: address.trim(),
        password,
        confirmPassword,
        role,
        businessName: role === 'service_provider' ? businessName.trim() : undefined,
        serviceCategory: role === 'service_provider' ? serviceCategory : undefined,
      })
      onToast(response.message)
      setRegistrationSession({ email: response.email, phone: response.phone })
      setStep('email')
    } catch (error) {
      onToast(error.response?.data?.message || 'Unable to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const resetRegisterForm = () => {
    setName('')
    setEmail('')
    setPhoneCountryCode('+91')
    setPhone('')
    setAddress('')
    setPassword('')
    setConfirmPassword('')
    setRole('user')
    setBusinessName('')
    setServiceCategory('')
    setEmailOtp('')
    setRegistrationSession(null)
    setStep('details')
  }

  const handleClose = () => {
    resetRegisterForm()
    onClose()
  }

  const handleVerifyEmail = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      const verifyResponse = await verifyEmailOtp({ ...registrationSession, otp: emailOtp })
      onToast(verifyResponse.message)
      const response = await completeRegistration(registrationSession)
      persistSession(response)
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
  }

  const handleResend = async () => {
    setLoading(true)
    try {
      const response = await resendRegistrationOtp(registrationSession)
      onToast(response.message)
    } catch (error) {
      onToast(error.response?.data?.message || 'Unable to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  if (step !== 'details') {
    return (
      <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
        <form
          onSubmit={handleVerifyEmail}
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
                <span className="text-sm font-semibold text-slate-700">Verification code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={emailOtp}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, '').slice(0, 6)
                    setEmailOtp(value)
                  }}
                  required
                  minLength="6"
                  maxLength="6"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-[0.45em] outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                  placeholder="000000"
                />
              </label>

              <button
                type="submit"
                disabled={loading || emailOtp.length !== 6}
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
                  disabled={loading}
                  onClick={handleResend}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                >
                  Resend OTP
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
        onSubmit={handleSubmit}
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

        <label className="mt-6 block">
          <span className="text-sm font-semibold text-slate-700">Full Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            placeholder="Enter your full name"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            placeholder="you@example.com"
          />
        </label>

        <div className="mt-4">
          <span className="text-sm font-semibold text-slate-700">Phone Number</span>
          <div className="mt-2 grid grid-cols-[7.5rem_1fr] overflow-hidden rounded-2xl border border-slate-200 bg-white transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50">
            <label className="sr-only" htmlFor="register-phone-code">
              Country code
            </label>
            <select
              id="register-phone-code"
              value={phoneCountryCode}
              onChange={(event) => setPhoneCountryCode(event.target.value)}
              className="border-r border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="+91">IN +91</option>
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
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
              required
              maxLength="11"
              className="w-full px-4 py-3 text-sm text-slate-900 outline-none"
              placeholder="98765 43210"
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            <span>Use a 10-digit mobile number.</span>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Address</span>
          <textarea
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
            rows="2"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 resize-none"
            placeholder="Street, City, Area"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Account Type</span>
          <select
            value={role}
            onChange={(event) => {
              const nextRole = event.target.value
              setRole(nextRole)
              if (nextRole !== 'service_provider') {
                setBusinessName('')
                setServiceCategory('')
              }
            }}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 bg-white"
          >
            <option value="user">Customer - Book Services</option>
            <option value="service_provider">Service Provider - Offer Services</option>
          </select>
        </label>

        {role === 'service_provider' && (
          <>
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">Business Name</span>
              <input
                type="text"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                placeholder="e.g., Ravi Plumbing Services"
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">Service Work</span>
              <select
                value={serviceCategory}
                onChange={(event) => setServiceCategory(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="">Select your work type</option>
                {SERVICE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">Only approved LocalFixr service works can register.</p>
            </label>
          </>
        )}

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength="6"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            placeholder="Create password"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-slate-700">Confirm Password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength="6"
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            placeholder="Confirm password"
          />
        </label>

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
  const [toast, setToast] = useState('')
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => {
      setToast('')
    }, 4000)
  }

  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false)
    setIsLoginOpen(true)
  }

  const handleSwitchToRegister = () => {
    setIsLoginOpen(false)
    setIsRegisterOpen(true)
  }

  const isDashboardRoute = location.pathname.startsWith('/dashboard')

  return (
    <div className={darkMode ? darkAppShell : lightAppShell}>
      <ScrollManager />
      {!isDashboardRoute && (
        <Navbar
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((current) => !current)}
          onLoginClick={() => setIsLoginOpen(true)}
          onRegisterClick={() => setIsRegisterOpen(true)}
        />
      )}
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home darkMode={darkMode} onToast={showToast} />} />
        <Route path="/services" element={<Services />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/provider/:id" element={<ProviderDetails />} />
        <Route path="/support/:slug" element={<SupportPage />} />
        <Route path="/login" element={<Login />} />
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
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
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
