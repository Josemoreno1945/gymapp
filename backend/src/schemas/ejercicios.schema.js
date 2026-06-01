// ============================================================
// Ejercicios Schema — Zod validation
// ============================================================

import { z } from 'zod';

export const createEjercicioSchema = z.object({
  nombre: z
    .string({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'El nombre debe ser texto',
    })
    .min(1, 'El nombre del ejercicio no puede estar vacío')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  grupo_muscular: z
    .string({
      invalid_type_error: 'El grupo muscular debe ser texto',
    })
    .max(50, 'El grupo muscular no puede exceder 50 caracteres')
    .trim()
    .optional(),
  notas: z
    .string({
      invalid_type_error: 'Las notas deben ser texto',
    })
    .max(200, 'Las notas no pueden exceder 200 caracteres')
    .optional(),
});

export const updateEjercicioSchema = createEjercicioSchema;
