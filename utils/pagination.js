const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const parsePagination = (query = {}) => {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const requested = Number.parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE;
    const pageSize = Math.min(Math.max(1, requested), MAX_PAGE_SIZE);
    return { page, pageSize, offset: (page - 1) * pageSize };
};

module.exports = { parsePagination, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE };
