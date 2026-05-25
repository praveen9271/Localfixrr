import Icon from '../component/Icon'

function HowItWorks({ steps }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          How It <span className="text-indigo-500">Works?</span>
        </h2>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-4">
        {steps.map((step, index) => (
          <div key={step.title} className="relative text-center">
            <div
              className={`mx-auto grid h-20 w-20 place-items-center rounded-full shadow-lg ${step.tint}`}
            >
              <Icon name={step.icon} className="h-8 w-8" />
            </div>
            {index < steps.length - 1 && (
              <div className="absolute left-[58%] top-10 hidden h-px w-[84%] border-t border-dashed border-indigo-200 lg:block" />
            )}
            <h3 className="mt-6 text-xl font-bold text-slate-900">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HowItWorks
