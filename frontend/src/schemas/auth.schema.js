// ============================================================
// Auth Schemas (Frontend) — Zod validation para Login y Registro
// Usados con react-hook-form + zodResolver
// ============================================================

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Debes llenar este campo',
    })
    .min(1, 'Debes llenar este campo')
    .email('Ingresa un correo electrónico válido (ej. usuario@dominio.com)')
    .toLowerCase()
    .trim(),
  password: z
    .string({
      required_error: 'Debes llenar este campo',
    })
    .min(1, 'Debes llenar este campo'),
});

export const registerSchema = z
  .object({
    nombre: z
      .string({
        required_error: 'Debes llenar este campo',
      })
      .min(1, 'Debes llenar este campo')
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede exceder 100 caracteres')
      .trim(),
    email: z
      .string({
        required_error: 'Debes llenar este campo',
      })
      .min(1, 'Debes llenar este campo')
      .email('Ingresa un correo electrónico válido (ej. usuario@dominio.com)')
      .max(255, 'El email no puede exceder 255 caracteres')
      .toLowerCase()
      .trim(),
    password: z
      .string({
        required_error: 'Debes llenar este campo',
      })
      .min(1, 'Debes llenar este campo')
      .min(8, 'La clave debe tener al menos 8 caracteres')
      .max(128, 'La clave no puede exceder 128 caracteres')
      .regex(/[0-9]/, 'La clave debe contener al menos 1 número')
      .regex(/[A-Z]/, 'La clave debe contener al menos 1 letra mayúscula'),
    confirmPassword: z
      .string({
        required_error: 'Debes confirmar tu contraseña',
      })
      .min(1, 'Debes confirmar tu contraseña'),
    rol: z.enum(['USER', 'ADMIN'], {
      required_error: 'Debes seleccionar un tipo de cuenta',
      invalid_type_error: 'Rol inválido',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

/** @typedef {import('zod').infer<typeof loginSchema>} LoginFormValues */
/** @typedef {import('zod').infer<typeof registerSchema>} RegisterFormValues */
