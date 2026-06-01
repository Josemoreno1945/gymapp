// ============================================================
// Sessions Controller — Usage session management (Admin)
// ============================================================

import SessionModel from '../models/session.model.js';
import { sendSuccess, parsePagination } from '../utils/helpers.js';

/**
 * GET /api/sessions
 * Returns all sessions (admin view).
 */
export function getAllSessions(req, res) {
  const { limit, offset, page } = parsePagination(req.query);
  const sessions = SessionModel.findAll({ limit, offset });
  const stats = SessionModel.getStats();

  sendSuccess(res, {
    sesiones: sessions,
    estadisticas: stats,
    paginacion: {
      pagina: page,
      por_pagina: limit,
    },
  });
}

/**
 * GET /api/sessions/stats
 * Returns session statistics (admin view).
 */
export function getSessionStats(req, res) {
  const stats = SessionModel.getStats();
  sendSuccess(res, { estadisticas: stats });
}

/**
 * GET /api/sessions/user/:userId
 * Returns sessions for a specific user (admin view).
 */
export function getUserSessions(req, res) {
  const userId = parseInt(req.params.userId, 10);
  const { limit, offset, page } = parsePagination(req.query);
  const sessions = SessionModel.findByUsuario(userId, { limit, offset });

  sendSuccess(res, {
    sesiones: sessions,
    paginacion: {
      pagina: page,
      por_pagina: limit,
    },
  });
}
