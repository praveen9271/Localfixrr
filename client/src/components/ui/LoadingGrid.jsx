function LoadingGrid({ count = 4, columns = 'md:grid-cols-4' }) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-lg bg-slate-200" />
      ))}
    </div>
  )
}

export default LoadingGrid
