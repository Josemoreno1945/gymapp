// ============================================================
// Ejercicios Controller — CRUD for exercise catalog
// ============================================================

import EjercicioModel from '../models/ejercicio.model.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

/**
 * GET /api/ejercicios
 * Returns all exercises for the authenticated user.
 */
export function getEjercicios(req, res) {
  const ejercicios = EjercicioModel.findByUsuario(req.user.id);
  sendSuccess(res, { ejercicios });
}

/**
 * POST /api/ejercicios
 * Creates a new exercise.
 */
export function createEjercicio(req, res) {
  const { nombre, grupo_muscular, notas } = req.validatedBody;

  const { id } = EjercicioModel.create({
    usuario_id: req.user.id,
    nombre,
    grupo_muscular,
    notas,
  });

  const ejercicio = EjercicioModel.findById(id);
  sendSuccess(res, { mensaje: 'Ejercicio creado exitosamente', ejercicio }, 201);
}

/**
 * PUT /api/ejercicios/:id
 * Updates an exercise.
 */
export function updateEjercicio(req, res) {
  const ejercicioId = parseInt(req.params.id, 10);
  if (isNaN(ejercicioId)) return sendError(res, 'ID de ejercicio inválido.', 400);

  const { nombre, grupo_muscular, notas } = req.validatedBody;

  const { changes } = EjercicioModel.updateByOwner(ejercicioId, req.user.id, {
    nombre,
    grupo_muscular,
    notas,
  });

  if (changes === 0) {
    return sendError(res, 'Ejercicio no encontrado o no tienes permisos.', 404);
  }

  const ejercicio = EjercicioModel.findById(ejercicioId);
  sendSuccess(res, { mensaje: 'Ejercicio actualizado', ejercicio });
}

/**
 * DELETE /api/ejercicios/:id
 * Deletes an exercise.
 */
export function deleteEjercicio(req, res) {
  const ejercicioId = parseInt(req.params.id, 10);
  if (isNaN(ejercicioId)) return sendError(res, 'ID de ejercicio inválido.', 400);

  const { changes } = EjercicioModel.deleteByOwner(ejercicioId, req.user.id);

  if (changes === 0) {
    return sendError(res, 'Ejercicio no encontrado o no tienes permisos.', 404);
  }

  sendSuccess(res, { mensaje: 'Ejercicio eliminado exitosamente' });
}

/**
 * GET /api/ejercicios/:id/progreso
 * Returns max weight grouped by week for a specific exercise.
 */
export function getProgreso(req, res) {
  const ejercicioId = parseInt(req.params.id, 10);
  if (isNaN(ejercicioId)) return sendError(res, 'ID de ejercicio inválido.', 400);

  const progreso = EjercicioModel.getProgress(ejercicioId, req.user.id);
  sendSuccess(res, { progreso });
}
