function StatCard({ label, value, helper }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      {helper && <p className="mt-1 text-sm text-slate-500">{helper}</p>}
    </div>
  )
}

export default StatCard
