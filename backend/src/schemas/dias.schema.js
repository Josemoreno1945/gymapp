// ============================================================
// Dias Schema — Zod validation
// ============================================================

import { z } from 'zod';

export const createDiaSchema = z.object({
  nombre: z
    .string({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'El nombre debe ser texto',
    })
    .min(1, 'El nombre del día no puede estar vacío')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  orden: z
    .number({
      invalid_type_error: 'El orden debe ser un número',
    })
    .int('El orden debe ser un número entero (sin decimales)')
    .positive('El orden debe ser un número positivo (mayor que 0)')
    .optional(),
});

export const updateDiaSchema = createDiaSchema;

export const createDiaEjercicioSchema = z.object({
  ejercicio_id: z
    .number({
      required_error: 'Debes seleccionar un ejercicio',
      invalid_type_error: 'El ID del ejercicio debe ser un número',
    })
    .int('El ID del ejercicio debe ser un número entero')
    .positive('El ID del ejercicio debe ser un número positivo'),
  series: z
    .number({
      invalid_type_error: 'Las series deben ser un número',
    })
    .int('Las series deben ser un número entero (sin decimales)')
    .positive('Las series deben ser un número positivo')
    .optional()
    .default(3),
  repeticiones: z
    .number({
      invalid_type_error: 'Las repeticiones deben ser un número',
    })
    .int('Las repeticiones deben ser un número entero (sin decimales)')
    .positive('Las repeticiones deben ser un número positivo')
    .optional()
    .default(10),
  peso: z
    .number({
      invalid_type_error: 'El peso debe ser un número',
    })
    .min(0, 'El peso no puede ser negativo')
    .optional()
    .default(0),
  unidad: z
    .enum(['kg', 'lbs'], {
      errorMap: () => ({ message: 'La unidad debe ser \'kg\' o \'lbs\'' }),
    })
    .optional()
    .default('kg'),
  nota: z
    .string({
      invalid_type_error: 'La nota debe ser texto',
    })
    .max(200, 'La nota no puede exceder 200 caracteres')
    .optional(),
});

export const updateDiaEjercicioSchema = z.object({
  series: z
    .number({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'Las series deben ser un número',
    })
    .int('Las series deben ser un número entero (sin decimales)')
    .positive('Las series deben ser un número positivo'),
  repeticiones: z
    .number({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'Las repeticiones deben ser un número',
    })
    .int('Las repeticiones deben ser un número entero (sin decimales)')
    .positive('Las repeticiones deben ser un número positivo'),
  peso: z
    .number({
      required_error: 'Debes llenar este campo',
      invalid_type_error: 'El peso debe ser un número',
    })
    .min(0, 'El peso no puede ser negativo'),
  unidad: z
    .enum(['kg', 'lbs'], {
      errorMap: () => ({ message: 'La unidad debe ser \'kg\' o \'lbs\'' }),
    })
    .optional()
    .default('kg'),
  nota: z
    .string({
      invalid_type_error: 'La nota debe ser texto',
    })
    .max(200, 'La nota no puede exceder 200 caracteres')
    .optional(),
});
