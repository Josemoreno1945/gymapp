// ============================================================
// Semanas Controller — CRUD for training weeks
// ============================================================

import SemanaModel from '../models/semana.model.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

/**
 * GET /api/semanas
 * Returns all weeks for the authenticated user.
 */
export function getSemanas(req, res) {
  const semanas = SemanaModel.findByUsuario(req.user.id);
  sendSuccess(res, { semanas });
}

/**
 * POST /api/semanas
 * Creates a new training week.
 */
export function createSemana(req, res) {
  const { nombre, fecha_inicio, fecha_fin } = req.validatedBody;

  const { id } = SemanaModel.create({
    usuario_id: req.user.id,
    nombre,
    fecha_inicio,
    fecha_fin,
  });

  const semana = SemanaModel.findById(id);

  sendSuccess(res, {
    mensaje: 'Semana creada exitosamente',
    semana,
  }, 201);
}

/**
 * PUT /api/semanas/:id
 * Updates a training week.
 */
export function updateSemana(req, res) {
  const semanaId = parseInt(req.params.id, 10);
  if (isNaN(semanaId)) return sendError(res, 'ID de semana inválido.', 400);

  const { nombre, fecha_inicio, fecha_fin } = req.validatedBody;

  const { changes } = SemanaModel.updateByOwner(semanaId, req.user.id, {
    nombre,
    fecha_inicio,
    fecha_fin,
  });

  if (changes === 0) {
    return sendError(res, 'Semana no encontrada o no tienes permisos.', 404);
  }

  const semana = SemanaModel.findById(semanaId);
  sendSuccess(res, { mensaje: 'Semana actualizada', semana });
}

/**
 * DELETE /api/semanas/:id
 * Deletes a training week and all its days/exercises.
 */
export function deleteSemana(req, res) {
  const semanaId = parseInt(req.params.id, 10);
  if (isNaN(semanaId)) return sendError(res, 'ID de semana inválido.', 400);

  const { changes } = SemanaModel.deleteByOwner(semanaId, req.user.id);

  if (changes === 0) {
    return sendError(res, 'Semana no encontrada o no tienes permisos.', 404);
  }

  sendSuccess(res, { mensaje: 'Semana eliminada exitosamente' });
}
