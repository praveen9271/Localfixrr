const getPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const buildPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    page,
    total,
    pages: totalPages,
  };
};

export { getPagination, buildPagination };
