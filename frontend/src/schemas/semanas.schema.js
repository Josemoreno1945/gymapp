// ============================================================
// Semanas Schema (Frontend) — Zod validation
// ============================================================

import { z } from 'zod';

export const semanaSchema = z.object({
  nombre: z
    .string({
      required_error: 'Debes llenar este campo',
    })
    .min(1, 'Debes llenar este campo')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  fecha_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  fecha_fin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
});
