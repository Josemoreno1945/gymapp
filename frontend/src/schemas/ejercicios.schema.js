// ============================================================
// Ejercicios Schema (Frontend) — Zod validation
// ============================================================

import { z } from 'zod';

export const ejercicioSchema = z.object({
  nombre: z
    .string({
      required_error: 'Debes llenar este campo',
    })
    .min(1, 'Debes llenar este campo')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  grupo_muscular: z
    .string()
    .max(50, 'El grupo muscular no puede exceder 50 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),
  notas: z
    .string()
    .max(200, 'Las notas no pueden exceder 200 caracteres')
    .optional()
    .or(z.literal('')),
});
