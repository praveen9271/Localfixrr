import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import Icon from '../component/Icon'
import Hero from '../Sections/Hero'
import HowItWorks from '../Sections/HowItWorks'
import ServicesSection from '../Sections/ServicesSection'
import Stats from '../Sections/Stats'
import WhyChooseUs from '../Sections/WhyChooseUs'
import ServiceListingCard from '../components/services/ServiceListingCard'
import { getPublicServices } from '../services/dashboardService'
import { SERVICE_CATEGORIES } from '../constants/serviceCategories'
import { scrollToSection } from '../utils/scroll'
import { button3dSubtle } from '../utils/tailwindStyles'

const stats = [
  { icon: 'shield', value: 'Verified', label: 'Local Providers' },
  { icon: 'search', value: 'Easy', label: 'Find Services' },
  { icon: 'phone', value: 'Quick', label: 'Connect Faster' },
  { icon: 'check', value: 'Ready', label: 'Service Requests' },
]

const reasons = [
  {
    icon: 'shield',
    title: 'Trusted & Verified',
    description: 'All professionals are verified and background checked for your safety.',
    tint: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: 'location',
    title: 'Nearby & Fast',
    description: 'Find local experts near you and get quick response.',
    tint: 'bg-violet-100 text-violet-700',
  },
  {
    icon: 'phone',
    title: 'Easy Contact',
    description: 'Call or WhatsApp providers directly with just one tap.',
    tint: 'bg-amber-100 text-amber-700',
  },
  {
    icon: 'currency',
    title: 'Affordable Pricing',
    description: 'Compare and connect with the best service at fair prices.',
    tint: 'bg-blue-100 text-blue-700',
  },
]

const steps = [
  {
    icon: 'search',
    title: '1. Search Service',
    description: 'Search for the service you need in your area.',
    tint: 'bg-indigo-500 text-white',
  },
  {
    icon: 'users',
    title: '2. Choose Provider',
    description: 'Browse top providers and select the best one.',
    tint: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: 'phone',
    title: '3. Call / Connect',
    description: 'Call or chat directly with the provider.',
    tint: 'bg-amber-100 text-amber-700',
  },
  {
    icon: 'check',
    title: '4. Get Work Done',
    description: 'Get your work done easily and rate the service.',
    tint: 'bg-violet-100 text-violet-700',
  },
]

const normalizeIndianPhone = (value) => String(value || '').replace(/\D/g, '').slice(-10)

function Home({ darkMode, onToast }) {
  const navigate = useNavigate()
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

  const serviceCategories = useMemo(() => {
    const accents = [
      'from-indigo-100 to-blue-100',
      'from-emerald-100 to-teal-100',
      'from-amber-100 to-orange-100',
      'from-rose-100 to-pink-100',
      'from-sky-100 to-cyan-100',
      'from-violet-100 to-purple-100',
    ]
    const iconColors = [
      'text-indigo-700',
      'text-emerald-700',
      'text-amber-700',
      'text-rose-700',
      'text-sky-700',
      'text-violet-700',
    ]
    const icons = ['wrench', 'shield', 'phone', 'location', 'check', 'star']
    return SERVICE_CATEGORIES
      .slice(0, 5)
      .map((category, index) => ({
        title: category,
        description: `Browse ${category.toLowerCase()} services from active LocalFixr providers.`,
        icon: icons[index % icons.length],
        accent: accents[index % accents.length],
        iconColor: iconColors[index % iconColors.length],
      }))
  }, [])

  const topServices = services.slice(0, 4)

  const handleServiceMenuAction = (action, service) => {
    const title = service?.title || 'service'

    if (action === 'share') {
      const url = `${window.location.origin}/provider/${service?._id || ''}`
      navigator.clipboard?.writeText(url)
      onToast?.('Service link copied')
      return
    }

    if (action === 'save') {
      onToast?.(`${title} saved`)
      return
    }

    if (action === 'report') {
      onToast?.('Report option received')
      return
    }

    onToast?.('Open details to continue')
  }

  const handleServiceContact = (service) => {
    const phone = normalizeIndianPhone(service?.provider?.user?.phone)
    onToast?.(phone ? `Provider phone: +91 ${phone}` : 'Provider phone not available')
  }

  return (
    <main>
      <Hero darkMode={darkMode} onToast={onToast} />
      <Stats stats={stats} />
      <ServicesSection services={serviceCategories} />
      <WhyChooseUs reasons={reasons} />
      <div id="how-it-works">
        <HowItWorks steps={steps} />
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-4xl font-black tracking-tight text-slate-900 sm:text-left">
            Live <span className="text-indigo-500">Services</span> Near You
          </p>

          <button
            type="button"
            onClick={() => navigate('/services')}
            className={`${button3dSubtle} inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-5 text-sm font-black text-indigo-700 shadow-sm transition hover:bg-indigo-50`}
          >
            View all
            <Icon name="arrowRight" className="h-4 w-4" />
          </button>
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
          {topServices.map((service) => (
            <ServiceListingCard
              key={service._id}
              service={service}
              phone={normalizeIndianPhone(service?.provider?.user?.phone)}
              compact
              showMenuDetails
              showActionsMenu={false}
              primaryLabel="Book now"
              onDetails={(selected) => navigate(`/provider/${selected._id}`)}
              onBook={(selected) => navigate(`/provider/${selected._id}`)}
              onContact={handleServiceContact}
              onMenuAction={handleServiceMenuAction}
            />
          ))}
          {topServices.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-6 text-center text-slate-500 xl:col-span-4">
              No live services are available yet.
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-4 pb-8 pt-2 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 px-6 py-8 text-white shadow-[0_30px_70px_rgba(79,70,229,0.35)] sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="relative max-w-xl">
            <p className="text-3xl font-black tracking-tight sm:text-4xl">
              Need Help Right Now?
            </p>
            <p className="mt-3 text-base text-indigo-50 sm:text-lg">
              Find local experts in Phagwara, Punjab and send a service request quickly.
            </p>
          </div>

          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:mt-0">
            <button
              type="button"
              onClick={() => scrollToSection('search')}
              className={`${button3dSubtle} inline-flex h-13 min-w-40 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-indigo-600 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50`}
            >
              <Icon name="search" className="h-5 w-5" />
              Search Now
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/services')
              }}
              className={`${button3dSubtle} inline-flex h-13 min-w-40 items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20`}
            >
              <Icon name="phone" className="h-5 w-5" />
              Call Now
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Home
