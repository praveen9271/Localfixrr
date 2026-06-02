import { useCallback, useState } from 'react'

const defaultPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 5,
  hasNextPage: false,
  hasPrevPage: false,
}

const normalizePagination = (pagination, fallbackLimit = 5) => ({
  currentPage: pagination?.currentPage || pagination?.page || 1,
  totalPages: pagination?.totalPages || pagination?.pages || 1,
  totalItems: pagination?.totalItems || pagination?.total || 0,
  limit: pagination?.limit || fallbackLimit,
  hasNextPage: Boolean(pagination?.hasNextPage),
  hasPrevPage: Boolean(pagination?.hasPrevPage),
})

function usePagination(initialLimit = 5) {
  const [pagination, setPaginationState] = useState({
    ...defaultPagination,
    limit: initialLimit,
  })

  const setPagination = useCallback((nextPagination) => {
    setPaginationState((current) => normalizePagination(nextPagination, current.limit))
  }, [])

  const setPage = useCallback((page) => {
    setPaginationState((current) => ({ ...current, currentPage: page }))
  }, [])

  const setLimit = useCallback((limit) => {
    setPaginationState((current) => ({
      ...current,
      currentPage: 1,
      limit,
    }))
  }, [])

  const resetPage = useCallback(() => {
    setPaginationState((current) => ({ ...current, currentPage: 1 }))
  }, [])

  return {
    pagination,
    resetPage,
    setLimit,
    setPage,
    setPagination,
  }
}

export default usePagination
export { normalizePagination }
