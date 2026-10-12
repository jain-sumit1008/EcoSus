export function success(res, { message = "Operation completed", data = {}, status = 200 } = {}) {
  return res.status(status).json({ success: true, message, data });
}

export function paginated(res, { message = "Operation completed", items, pagination }) {
  return res.status(200).json({
    success: true,
    message,
    data: { items, pagination },
  });
}

export function buildPagination({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 0,
  };
}
