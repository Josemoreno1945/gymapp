// ============================================================
// Auth Schemas — Zod validation for register/login
// ============================================================

import { z } from 'zod';

export const registerSchema = z.object({
  nombre: z
    .string({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'El nombre debe ser texto',
    })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  email: z
    .string({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'El email debe ser texto',
    })
    .email('Ingresa un correo electrónico válido (ej. usuario@dominio.com)')
    .max(255, 'El email no puede exceder 255 caracteres')
    .toLowerCase()
    .trim(),
  password: z
    .string({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'La contraseña debe ser texto',
    })
    .min(8, 'La clave debe tener al menos 8 caracteres')
    .max(128, 'La clave no puede exceder 128 caracteres')
    .regex(/[0-9]/, 'La clave debe contener al menos 1 número')
    .regex(/[A-Z]/, 'La clave debe contener al menos 1 letra mayúscula'),
  rol: z
    .enum(['ADMIN', 'USER'], {
      errorMap: () => ({ message: 'Rol inválido. Las opciones son: ADMIN o USER' }),
    })
    .default('USER'),
});

export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'El email debe ser texto',
    })
    .email('Ingresa un correo electrónico válido')
    .toLowerCase()
    .trim(),
  password: z
    .string({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'La contraseña debe ser texto',
    })
    .min(1, 'La contraseña no puede estar vacía'),
});
