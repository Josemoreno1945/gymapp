// ============================================================
// Dias Controller — CRUD for training days + day-exercise assignments
// ============================================================

import DiaModel from '../models/dia.model.js';
import DiaEjercicioModel from '../models/diaEjercicio.model.js';
import SemanaModel from '../models/semana.model.js';
import EjercicioModel from '../models/ejercicio.model.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

// ─── Day CRUD ────────────────────────────────────────────────

/**
 * GET /api/semanas/:semanaId/dias
 * Returns all days for a specific week.
 */
export function getDias(req, res) {
  const semanaId = parseInt(req.params.semanaId, 10);
  if (isNaN(semanaId)) return sendError(res, 'ID de semana inválido.', 400);

  // Verify the week belongs to the user
  const semana = SemanaModel.findById(semanaId);
  if (!semana || semana.usuario_id !== req.user.id) {
    return sendError(res, 'Semana no encontrada.', 404);
  }

  const dias = DiaModel.findBySemana(semanaId, req.user.id);
  sendSuccess(res, { dias, semana });
}

/**
 * POST /api/semanas/:semanaId/dias
 * Creates a new day within a week.
 */
export function createDia(req, res) {
  const semanaId = parseInt(req.params.semanaId, 10);
  if (isNaN(semanaId)) return sendError(res, 'ID de semana inválido.', 400);

  // Verify ownership
  const semana = SemanaModel.findById(semanaId);
  if (!semana || semana.usuario_id !== req.user.id) {
    return sendError(res, 'Semana no encontrada.', 404);
  }

  const { nombre, orden } = req.validatedBody;

  const { id } = DiaModel.create({
    semana_id: semanaId,
    usuario_id: req.user.id,
    nombre,
    orden,
  });

  const dia = DiaModel.findById(id);
  sendSuccess(res, { mensaje: 'Día creado exitosamente', dia }, 201);
}

/**
 * PUT /api/dias/:id
 * Updates a day.
 */
export function updateDia(req, res) {
  const diaId = parseInt(req.params.id, 10);
  if (isNaN(diaId)) return sendError(res, 'ID de día inválido.', 400);

  const { nombre, orden } = req.validatedBody;

  const { changes } = DiaModel.updateByOwner(diaId, req.user.id, { nombre, orden });

  if (changes === 0) {
    return sendError(res, 'Día no encontrado o no tienes permisos.', 404);
  }

  const dia = DiaModel.findById(diaId);
  sendSuccess(res, { mensaje: 'Día actualizado', dia });
}

/**
 * DELETE /api/dias/:id
 * Deletes a day and all its exercise assignments.
 */
export function deleteDia(req, res) {
  const diaId = parseInt(req.params.id, 10);
  if (isNaN(diaId)) return sendError(res, 'ID de día inválido.', 400);

  const { changes } = DiaModel.deleteByOwner(diaId, req.user.id);

  if (changes === 0) {
    return sendError(res, 'Día no encontrado o no tienes permisos.', 404);
  }

  sendSuccess(res, { mensaje: 'Día eliminado exitosamente' });
}

// ─── Day-Exercise Assignments ────────────────────────────────

/**
 * GET /api/dias/:id/ejercicios
 * Returns all exercises assigned to a day.
 */
export function getDiaEjercicios(req, res) {
  const diaId = parseInt(req.params.id, 10);
  if (isNaN(diaId)) return sendError(res, 'ID de día inválido.', 400);

  // Verify ownership
  const dia = DiaModel.findById(diaId);
  if (!dia || dia.usuario_id !== req.user.id) {
    return sendError(res, 'Día no encontrado.', 404);
  }

  const ejercicios = DiaEjercicioModel.findByDia(diaId);
  sendSuccess(res, { ejercicios, dia });
}

/**
 * POST /api/dias/:id/ejercicios
 * Assign an exercise to a day.
 */
export function createDiaEjercicio(req, res) {
  const diaId = parseInt(req.params.id, 10);
  if (isNaN(diaId)) return sendError(res, 'ID de día inválido.', 400);

  // Verify day ownership
  const dia = DiaModel.findById(diaId);
  if (!dia || dia.usuario_id !== req.user.id) {
    return sendError(res, 'Día no encontrado.', 404);
  }

  const { ejercicio_id, series, repeticiones, peso, unidad, nota } = req.validatedBody;

  // Verify exercise ownership
  const ejercicio = EjercicioModel.findById(ejercicio_id);
  if (!ejercicio || ejercicio.usuario_id !== req.user.id) {
    return sendError(res, 'Ejercicio no encontrado.', 404);
  }

  const { id } = DiaEjercicioModel.create({
    dia_id: diaId,
    ejercicio_id,
    series,
    repeticiones,
    peso,
    unidad,
    nota,
  });

  const diaEjercicio = DiaEjercicioModel.findById(id);
  sendSuccess(res, { mensaje: 'Ejercicio asignado al día', dia_ejercicio: diaEjercicio }, 201);
}

/**
 * PUT /api/dia-ejercicios/:id
 * Update an exercise assignment.
 */
export function updateDiaEjercicio(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return sendError(res, 'ID inválido.', 400);

  // Verify ownership through the day
  const existing = DiaEjercicioModel.findById(id);
  if (!existing) return sendError(res, 'Asignación no encontrada.', 404);

  const dia = DiaModel.findById(existing.dia_id);
  if (!dia || dia.usuario_id !== req.user.id) {
    return sendError(res, 'No tienes permisos.', 403);
  }

  const { series, repeticiones, peso, unidad, nota } = req.validatedBody;

  DiaEjercicioModel.update(id, { series, repeticiones, peso, unidad, nota });

  const updated = DiaEjercicioModel.findById(id);
  sendSuccess(res, { mensaje: 'Asignación actualizada', dia_ejercicio: updated });
}

/**
 * DELETE /api/dia-ejercicios/:id
 * Remove an exercise assignment.
 */
export function deleteDiaEjercicio(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return sendError(res, 'ID inválido.', 400);

  // Verify ownership through the day
  const existing = DiaEjercicioModel.findById(id);
  if (!existing) return sendError(res, 'Asignación no encontrada.', 404);

  const dia = DiaModel.findById(existing.dia_id);
  if (!dia || dia.usuario_id !== req.user.id) {
    return sendError(res, 'No tienes permisos.', 403);
  }

  DiaEjercicioModel.deleteById(id);
  sendSuccess(res, { mensaje: 'Asignación eliminada' });
}
