// ============================================================
// User Schema — Zod validation for user management (admin)
// ============================================================

import { z } from 'zod';

export const updateUserSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim()
    .optional(),
  email: z
    .string()
    .email('Formato de email inválido')
    .max(255)
    .toLowerCase()
    .trim()
    .optional(),
  rol: z
    .enum(['ADMIN', 'USER'], { message: 'Rol inválido. Opciones: ADMIN, USER' })
    .optional(),
  activo: z
    .number()
    .int()
    .min(0)
    .max(1)
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Debe proporcionar al menos un campo para actualizar' }
);
