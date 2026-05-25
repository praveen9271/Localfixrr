import Icon from '../component/Icon'

function WhyChooseUs({ reasons }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Why Choose <span className="text-indigo-500">LocalFixr?</span>
        </h2>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {reasons.map((reason) => (
          <article
            key={reason.title}
            className="rounded-[1.75rem] border border-white bg-white p-7 shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
          >
            <div
              className={`grid h-16 w-16 place-items-center rounded-full ${reason.tint}`}
            >
              <Icon name={reason.icon} className="h-7 w-7" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-slate-900">{reason.title}</h3>
            <p className="mt-4 text-sm leading-7 text-slate-500">{reason.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default WhyChooseUs
