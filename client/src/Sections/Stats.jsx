import Icon from '../component/Icon'

function Stats({ stats }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-[0_28px_65px_rgba(15,23,42,0.22)] md:grid-cols-4">
        {stats.map((item, index) => (
          <div
            key={item.label}
            className={`px-6 py-8 text-center ${
              index < stats.length - 1 ? 'border-b border-white/10 md:border-b-0 md:border-r' : ''
            }`}
          >
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white/10 text-indigo-300">
              <Icon name={item.icon} className="h-6 w-6" />
            </div>
            <p className="mt-4 text-4xl font-black tracking-tight">{item.value}</p>
            <p className="mt-2 text-base text-slate-300">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Stats
