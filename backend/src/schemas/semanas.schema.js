// ============================================================
// Semanas Schema — Zod validation
// ============================================================

import { z } from 'zod';

export const createSemanaSchema = z.object({
  nombre: z
    .string({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'El nombre debe ser texto',
    })
    .min(1, 'El nombre no puede estar vacío')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  fecha_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .optional(),
  fecha_fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .optional(),
});

export const updateSemanaSchema = createSemanaSchema;
