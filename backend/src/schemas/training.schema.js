// ============================================================
// Training Schema — Zod validation with setsxreps@peso regex
// ============================================================

import { z } from 'zod';

/**
 * Regex estricta para formato de entrenamiento: "SERIESxREPS@PESOunidad"
 * Ejemplos válidos: "3x12@80kg", "4x10@100lbs", "2x15@60.5kg"
 * Ejemplos inválidos: "3x12 80", "3-12@80", "3x12@80"
 */
const FORMATO_REGEX = /^\d+x\d+@\d+(\.\d+)?(kg|lbs)$/i;

/**
 * Parse the validated formato_raw string into its numeric components.
 * @param {string} raw — Already validated string (e.g., "3x12@80kg")
 * @returns {{ series: number, repeticiones: number, peso: number, unidad: string, volumen: number }}
 */
export function parseFormatoRaw(raw) {
  const match = raw.match(/^(\d+)x(\d+)@(\d+(?:\.\d+)?)(kg|lbs)$/i);
  if (!match) throw new Error(`Formato inválido: ${raw}`);

  const series = parseInt(match[1], 10);
  const repeticiones = parseInt(match[2], 10);
  const peso = parseFloat(match[3]);
  const unidad = match[4].toLowerCase();
  const volumen = parseFloat((series * repeticiones * peso).toFixed(2));

  return { series, repeticiones, peso, unidad, volumen };
}

export const trainingLogSchema = z.object({
  ejercicio: z
    .string({ required_error: 'El ejercicio es obligatorio' })
    .min(1, 'El ejercicio no puede estar vacío')
    .max(100, 'El ejercicio no puede exceder 100 caracteres')
    .trim(),
  formato_raw: z
    .string({ required_error: 'El formato de entrenamiento es obligatorio' })
    .regex(FORMATO_REGEX, {
      message: 'Formato inválido. Use estrictamente: SERIESxREPS@PESOkg (ej: 3x12@80kg, 4x10@100lbs)',
    }),
  semana: z
    .number()
    .int('La semana debe ser un número entero')
    .positive('La semana debe ser positiva')
    .optional(),
  dia: z
    .number()
    .int('El día debe ser un número entero')
    .positive('El día debe ser positivo')
    .optional(),
  nota: z
    .string()
    .max(200, 'La nota no puede exceder 200 caracteres')
    .optional(),
});
