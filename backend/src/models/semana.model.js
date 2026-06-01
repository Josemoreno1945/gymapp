// ============================================================
// Semana Model — Data access layer for 'semanas'
// ============================================================

import { getDatabase } from '../config/database.js';

const SemanaModel = {
  /**
   * Find all weeks for a specific user.
   * @param {number} usuarioId
   * @returns {object[]}
   */
  findByUsuario(usuarioId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM dias d WHERE d.semana_id = s.id) as total_dias
      FROM semanas s
      WHERE s.usuario_id = ?
      ORDER BY s.created_at DESC
    `).all(usuarioId);
  },

  /**
   * Find a week by ID.
   * @param {number} id
   * @returns {object|undefined}
   */
  findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM semanas WHERE id = ?').get(id);
  },

  /**
   * Create a new week.
   * @param {object} data
   * @returns {{ id: number }}
   */
  create({ usuario_id, nombre, fecha_inicio, fecha_fin }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO semanas (usuario_id, nombre, fecha_inicio, fecha_fin)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(usuario_id, nombre, fecha_inicio ?? null, fecha_fin ?? null);
    return { id: result.lastInsertRowid };
  },

  /**
   * Update a week (only if owned by the user).
   * @param {number} id
   * @param {number} usuarioId
   * @param {object} data
   * @returns {{ changes: number }}
   */
  updateByOwner(id, usuarioId, { nombre, fecha_inicio, fecha_fin }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE semanas SET nombre = ?, fecha_inicio = ?, fecha_fin = ?
      WHERE id = ? AND usuario_id = ?
    `);
    return { changes: stmt.run(nombre, fecha_inicio ?? null, fecha_fin ?? null, id, usuarioId).changes };
  },

  /**
   * Delete a week (only if owned by the user).
   * @param {number} id
   * @param {number} usuarioId
   * @returns {{ changes: number }}
   */
  deleteByOwner(id, usuarioId) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM semanas WHERE id = ? AND usuario_id = ?');
    return { changes: stmt.run(id, usuarioId).changes };
  },
};

export default SemanaModel;
