const pageSizes = [5, 10, 20, 50]

const getPageNumbers = (currentPage, totalPages) => {
  const pages = new Set([1, totalPages])

  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page >= 1 && page <= totalPages) pages.add(page)
  }

  return Array.from(pages).sort((a, b) => a - b)
}

function Pagination({ pagination, onPageChange, onLimitChange, disabled = false }) {
  const currentPage = pagination?.currentPage || pagination?.page || 1
  const totalPages = pagination?.totalPages || pagination?.pages || 1
  const totalItems = pagination?.totalItems || pagination?.total || 0
  const limit = pagination?.limit || 5
  const pages = getPageNumbers(currentPage, totalPages)

  if (totalItems === 0) return null

  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-slate-500">
        Page {currentPage} of {totalPages} - {totalItems} total
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={limit}
          disabled={disabled}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-bold text-slate-600 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 disabled:opacity-60"
          aria-label="Rows per page"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>{size} / page</option>
          ))}
        </select>

        <button
          type="button"
          disabled={disabled || currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {pages.map((page, index) => {
          const previous = pages[index - 1]
          const showGap = previous && page - previous > 1

          return (
            <span key={page} className="inline-flex items-center gap-2">
              {showGap && <span className="text-sm font-bold text-slate-400">...</span>}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(page)}
                className={`grid h-9 min-w-9 place-items-center rounded-lg border px-2 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  currentPage === page
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            </span>
          )
        })}

        <button
          type="button"
          disabled={disabled || currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Pagination
