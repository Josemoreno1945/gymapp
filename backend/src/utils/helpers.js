// ============================================================
// Helpers — Shared utility functions
// ============================================================

/**
 * Wraps an async Express route handler to forward errors to next().
 * Eliminates the need for try/catch in every controller.
 *
 * @param {Function} fn - Async route handler
 * @returns {import('express').RequestHandler}
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Standard JSON success response.
 * @param {import('express').Response} res
 * @param {object} data
 * @param {number} statusCode
 */
export function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    ok: true,
    ...data,
  });
}

/**
 * Standard JSON error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} statusCode
 */
export function sendError(res, message, statusCode = 400) {
  res.status(statusCode).json({
    ok: false,
    error: message,
  });
}

/**
 * Extract pagination params from query string.
 * @param {object} query - req.query
 * @param {{ defaultLimit?: number, maxLimit?: number }} options
 * @returns {{ limit: number, offset: number, page: number }}
 */
export function parsePagination(query, { defaultLimit = 50, maxLimit = 200 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}
