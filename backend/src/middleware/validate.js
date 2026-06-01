// ============================================================
// Zod Validation Middleware — Factory pattern
// Validates req.body against any Zod schema
// ============================================================

/**
 * Creates a middleware that validates req.body against a Zod schema.
 * On success: populates req.validatedBody and calls next().
 * On failure: responds with 400 and detailed error messages.
 *
 * @param {import('zod').ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        campo: issue.path.join('.') || 'general',
        mensaje: issue.message,
        codigo: issue.code,
      }));

      return res.status(400).json({
        ok: false,
        error: 'Error de validación',
        detalles: errors,
      });
    }

    req.validatedBody = result.data;
    next();
  };
}

export default validate;
