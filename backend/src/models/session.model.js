// ============================================================
// Session Model — Data access layer for 'sesiones_uso'
// ============================================================

import { getDatabase } from '../config/database.js';

const SessionModel = {
  /**
   * Create a new session (on login).
   * @param {{ usuario_id: number, ip_address?: string, user_agent?: string }} data
   * @returns {{ id: number }}
   */
  create({ usuario_id, ip_address, user_agent }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sesiones_uso (usuario_id, ip_address, user_agent)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(usuario_id, ip_address ?? null, user_agent ?? null);
    return { id: result.lastInsertRowid };
  },

  /**
   * Close a session (on logout). Calculates duration.
   * @param {number} id
   * @returns {{ changes: number }}
   */
  close(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE sesiones_uso
      SET fin = CURRENT_TIMESTAMP,
          duracion_min = ROUND(
            (julianday(CURRENT_TIMESTAMP) - julianday(inicio)) * 24 * 60,
            2
          )
      WHERE id = ? AND fin IS NULL
    `);
    return { changes: stmt.run(id).changes };
  },

  /**
   * Close all open sessions for a user.
   * @param {number} usuarioId
   * @returns {{ changes: number }}
   */
  closeAllForUser(usuarioId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE sesiones_uso
      SET fin = CURRENT_TIMESTAMP,
          duracion_min = ROUND(
            (julianday(CURRENT_TIMESTAMP) - julianday(inicio)) * 24 * 60,
            2
          )
      WHERE usuario_id = ? AND fin IS NULL
    `);
    return { changes: stmt.run(usuarioId).changes };
  },

  /**
   * Get the latest open session for a user.
   * @param {number} usuarioId
   * @returns {object|undefined}
   */
  findOpenSession(usuarioId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM sesiones_uso
      WHERE usuario_id = ? AND fin IS NULL
      ORDER BY inicio DESC
      LIMIT 1
    `).get(usuarioId);
  },

  /**
   * Get all sessions (admin view).
   * @param {{ limit?: number, offset?: number }} options
   * @returns {object[]}
   */
  findAll({ limit = 100, offset = 0 } = {}) {
    const db = getDatabase();
    return db.prepare(`
      SELECT s.*, u.nombre as usuario_nombre, u.email as usuario_email
      FROM sesiones_uso s
      JOIN usuarios u ON s.usuario_id = u.id
      ORDER BY s.inicio DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  /**
   * Get sessions for a specific user.
   * @param {number} usuarioId
   * @param {{ limit?: number, offset?: number }} options
   * @returns {object[]}
   */
  findByUsuario(usuarioId, { limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM sesiones_uso
      WHERE usuario_id = ?
      ORDER BY inicio DESC
      LIMIT ? OFFSET ?
    `).all(usuarioId, limit, offset);
  },

  /**
   * Get session stats for admin dashboard.
   * @returns {object}
   */
  getStats() {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        COUNT(*)                                as total_sesiones,
        COUNT(DISTINCT usuario_id)              as usuarios_unicos,
        COALESCE(AVG(duracion_min), 0)          as duracion_promedio_min,
        COALESCE(MAX(duracion_min), 0)          as sesion_mas_larga_min,
        COUNT(CASE WHEN fin IS NULL THEN 1 END) as sesiones_activas
      FROM sesiones_uso
    `).get();
  },
};

export default SessionModel;
