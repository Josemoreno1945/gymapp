// ============================================================
// Global Error Handler — Catches all unhandled errors
// ============================================================

/**
 * Express global error handler middleware.
 * Must be registered AFTER all routes.
 */
export function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${req.method} ${req.path}`, err);

  // Zod validation errors (if thrown manually)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      ok: false,
      error: 'Error de validación',
      detalles: err.issues.map((i) => ({
        campo: i.path.join('.'),
        mensaje: i.message,
      })),
    });
  }

  // SQLite constraint violations
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      ok: false,
      error: 'El registro ya existe (violación de unicidad).',
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return res.status(400).json({
      ok: false,
      error: 'Referencia inválida (clave foránea).',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ok: false,
      error: 'Token inválido.',
    });
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message;

  res.status(statusCode).json({
    ok: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

export default errorHandler;
