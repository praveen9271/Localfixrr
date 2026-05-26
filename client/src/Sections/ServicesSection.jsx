import { useNavigate } from 'react-router'
import ServiceCard from '../component/ServiceCard'
import { button3dSubtle } from '../utils/tailwindStyles'

function ServicesSection({ services = [] }) {
  const navigate = useNavigate()
  const visibleServices = Array.isArray(services) ? services : []

  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Our Popular <span className="text-indigo-500">Services</span>
        </h2>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {visibleServices.map((service) => (
          <ServiceCard
            key={service.title}
            {...service}
            onClick={() => navigate(`/services?service=${encodeURIComponent(service.title)}`)}
          />
        ))}
      </div>

      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={() => navigate('/services')}
          className={`${button3dSubtle} rounded-2xl border border-indigo-200 bg-white px-8 py-4 font-semibold text-indigo-600 hover:bg-indigo-50`}
        >
          View All Services
        </button>
      </div>
    </section>
  )
}

export default ServicesSection
