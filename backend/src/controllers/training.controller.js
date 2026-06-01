// ============================================================
// Training Controller — CRUD for training logs
// ============================================================

import TrainingLogModel from '../models/trainingLog.model.js';
import { parseFormatoRaw } from '../schemas/training.schema.js';
import { sendSuccess, sendError, parsePagination } from '../utils/helpers.js';

/**
 * GET /api/training/logs
 * Returns logs for the authenticated user.
 */
export function getLogs(req, res) {
  const { limit, offset, page } = parsePagination(req.query);
  const ejercicio = req.query.ejercicio || null;

  const logs = TrainingLogModel.findByUsuario(req.user.id, { limit, offset, ejercicio });
  const total = TrainingLogModel.countByUsuario(req.user.id);

  sendSuccess(res, {
    logs,
    paginacion: {
      pagina: page,
      por_pagina: limit,
      total,
      total_paginas: Math.ceil(total / limit),
    },
  });
}

/**
 * POST /api/training/logs
 * Creates a new training log. Validates formato_raw via Zod middleware.
 */
export function createLog(req, res) {
  const { ejercicio, formato_raw, semana, dia, nota } = req.validatedBody;

  // Parse the validated format into numeric components
  const { series, repeticiones, peso, unidad, volumen } = parseFormatoRaw(formato_raw);

  const { id } = TrainingLogModel.create({
    usuario_id: req.user.id,
    ejercicio,
    formato_raw,
    series,
    repeticiones,
    peso,
    unidad,
    volumen,
    semana,
    dia,
    nota,
  });

  const log = TrainingLogModel.findById(id);

  sendSuccess(res, {
    mensaje: 'Log de entrenamiento creado',
    log,
  }, 201);
}

/**
 * DELETE /api/training/logs/:id
 * Deletes a log owned by the authenticated user.
 */
export function deleteLog(req, res) {
  const logId = parseInt(req.params.id, 10);

  if (isNaN(logId)) {
    return sendError(res, 'ID de log inválido.', 400);
  }

  const { changes } = TrainingLogModel.deleteByOwner(logId, req.user.id);

  if (changes === 0) {
    return sendError(res, 'Log no encontrado o no tienes permisos para eliminarlo.', 404);
  }

  sendSuccess(res, { mensaje: 'Log eliminado exitosamente' });
}

/**
 * GET /api/training/stats
 * Returns statistics for the authenticated user.
 */
export function getStats(req, res) {
  const stats = TrainingLogModel.getStatsByUsuario(req.user.id);
  const exerciseNames = TrainingLogModel.getExerciseNames(req.user.id);

  sendSuccess(res, {
    estadisticas: stats,
    ejercicios: exerciseNames,
  });
}
