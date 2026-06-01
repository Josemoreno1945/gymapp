// ============================================================
// Dia Model — Data access layer for 'dias'
// ============================================================

import { getDatabase } from '../config/database.js';

const DiaModel = {
  /**
   * Find all days for a specific week, owned by the user.
   * @param {number} semanaId
   * @param {number} usuarioId
   * @returns {object[]}
   */
  findBySemana(semanaId, usuarioId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT d.*,
        (SELECT COUNT(*) FROM dia_ejercicios de WHERE de.dia_id = d.id) as total_ejercicios
      FROM dias d
      WHERE d.semana_id = ? AND d.usuario_id = ?
      ORDER BY d.orden ASC, d.created_at ASC
    `).all(semanaId, usuarioId);
  },

  /**
   * Find a day by ID.
   * @param {number} id
   * @returns {object|undefined}
   */
  findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM dias WHERE id = ?').get(id);
  },

  /**
   * Create a new day.
   * @param {object} data
   * @returns {{ id: number }}
   */
  create({ semana_id, usuario_id, nombre, orden }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO dias (semana_id, usuario_id, nombre, orden)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(semana_id, usuario_id, nombre, orden ?? 1);
    return { id: result.lastInsertRowid };
  },

  /**
   * Update a day (only if owned by the user).
   * @param {number} id
   * @param {number} usuarioId
   * @param {object} data
   * @returns {{ changes: number }}
   */
  updateByOwner(id, usuarioId, { nombre, orden }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE dias SET nombre = ?, orden = ?
      WHERE id = ? AND usuario_id = ?
    `);
    return { changes: stmt.run(nombre, orden ?? 1, id, usuarioId).changes };
  },

  /**
   * Delete a day (only if owned by the user).
   * @param {number} id
   * @param {number} usuarioId
   * @returns {{ changes: number }}
   */
  deleteByOwner(id, usuarioId) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM dias WHERE id = ? AND usuario_id = ?');
    return { changes: stmt.run(id, usuarioId).changes };
  },
};

export default DiaModel;
