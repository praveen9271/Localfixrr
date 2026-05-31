import { useEffect, useMemo, useState } from 'react'
import { useFormik } from 'formik'
import { useNavigate } from 'react-router'
import * as Yup from 'yup'
import { getPublicServices } from '../services/dashboardService'
import { subscribeNewsletter } from '../services/newsletterService'
import { scrollToSection } from '../utils/scroll'
import { button3d } from '../utils/tailwindStyles'
import logo from '../assets/logo.png'

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Reviews', to: '/#reviews' },
  { label: 'Contact Us', to: '/#contact' },
]

const supportLinks = [
  { label: 'Help Center', to: '/support/help-center' },
  { label: 'Terms & Conditions', to: '/support/terms' },
  { label: 'Privacy Policy', to: '/support/privacy' },
  { label: 'Refund Policy', to: '/support/refund-policy' },
]

const newsletterSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Enter a valid email address.')
    .required('Email is required.'),
})

function Footer({ onToast }) {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [services, setServices] = useState([])

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = await getPublicServices()
        setServices(data.services || [])
      } catch {
        setServices([])
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const serviceLinks = useMemo(
    () => Array.from(new Set(services.map((service) => service.category).filter(Boolean))).slice(0, 5),
    [services],
  )

  const navigateTo = (to) => {
    const [path, hash] = to.split('#')
    navigate(hash ? `${path || '/'}#${hash}` : path || '/')
    if (hash) {
      setTimeout(() => scrollToSection(hash), 0)
    }
  }

  const newsletterFormik = useFormik({
    initialValues: { email: '' },
    validationSchema: newsletterSchema,
    onSubmit: async (values, { resetForm }) => {
      const cleanEmail = values.email.trim().toLowerCase()
    setSubscribing(true)
    setMessage('')

    try {
      const response = await subscribeNewsletter({ email: cleanEmail })
      setMessage(response.message || 'Subscription email sent successfully.')
      onToast?.(response.message || 'Subscription email sent successfully.')
      resetForm()
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Unable to send subscription email.'
      setMessage(errorMessage)
      onToast?.(errorMessage)
    } finally {
      setSubscribing(false)
    }
    },
  })

  return (
    <footer className="mt-8 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_repeat(3,0.8fr)_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="LocalFixr logo"
              className="h-11 w-11 object-contain"
            />
            <div>
              <span className="text-3xl font-black text-white">Local</span>
              <span className="text-3xl font-black text-indigo-400">Fixr</span>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-7 text-slate-400">
            Your local partner for home repair and maintenance services in
            Phagwara, Punjab.
          </p>

          <div className="mt-6 space-y-2 text-sm text-slate-400">
            <a href="tel:+916280008301" className="block cursor-pointer hover:text-indigo-300">
              +91 62800 08301
            </a>
            <a href="mailto:localfixr@gmail.com" className="block cursor-pointer hover:text-indigo-300">
              localfixr@gmail.com
            </a>
            <p>Phagwara, Punjab, India</p>
          </div>
        </div>

        <div>
          <p className="text-lg font-bold text-white">Quick Links</p>
          <div className="mt-5 space-y-3 text-sm text-slate-400">
            {quickLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => navigateTo(link.to)}
                className="block cursor-pointer transition duration-300 hover:-translate-y-0.5 hover:text-indigo-300"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-lg font-bold text-white">Services</p>
          <div className="mt-5 space-y-3 text-sm text-slate-400">
            {serviceLinks.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() =>
                  navigate(`/services?service=${encodeURIComponent(service)}`)
                }
                className="block cursor-pointer transition duration-300 hover:-translate-y-0.5 hover:text-indigo-300"
              >
                {service}
              </button>
            ))}
            {serviceLinks.length === 0 && <span>No live services yet</span>}
          </div>
        </div>

        <div>
          <p className="text-lg font-bold text-white">Support</p>
          <div className="mt-5 space-y-3 text-sm text-slate-400">
            {supportLinks.map((link) => (
              <button
                key={link.to}
                type="button"
                onClick={() => navigate(link.to)}
                className="block cursor-pointer transition duration-300 hover:-translate-y-0.5 hover:text-indigo-300"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={newsletterFormik.handleSubmit}>
          <p className="text-lg font-bold text-white">Newsletter</p>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            Subscribe to get updates and offers in your inbox.
          </p>
          <label className="mt-5 block text-xs font-bold text-slate-300">
            Email <span className="text-rose-400">*</span>
          </label>
          <input
            name="email"
            type="email"
            value={newsletterFormik.values.email}
            onChange={newsletterFormik.handleChange}
            onBlur={newsletterFormik.handleBlur}
            placeholder="Enter your email"
            disabled={subscribing}
            className={`mt-2 w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400 ${
              newsletterFormik.touched.email && newsletterFormik.errors.email
                ? 'border-rose-400/70'
                : 'border-white/10'
            }`}
          />
          {newsletterFormik.touched.email && newsletterFormik.errors.email && (
            <p className="mt-2 text-sm font-semibold text-rose-300">{newsletterFormik.errors.email}</p>
          )}
          <button
            type="submit"
            disabled={subscribing}
            className={`${button3d} mt-4 w-full cursor-pointer rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {subscribing ? 'Sending...' : 'Subscribe'}
          </button>
          {message && <p className={`mt-3 text-sm ${message.toLowerCase().includes('unable') ? 'text-rose-300' : 'text-indigo-200'}`}>{message}</p>}
        </form>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>(c) 2026 LocalFixr. All rights reserved.</p>
          <p>Made with care for your convenience.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
