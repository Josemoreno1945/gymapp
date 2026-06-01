// ============================================================
// Ejercicio Model — Data access layer for 'ejercicios'
// ============================================================

import { getDatabase } from '../config/database.js';

const EjercicioModel = {
  /**
   * Find all exercises for a specific user.
   * @param {number} usuarioId
   * @returns {object[]}
   */
  findByUsuario(usuarioId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM ejercicios
      WHERE usuario_id = ?
      ORDER BY nombre ASC
    `).all(usuarioId);
  },

  /**
   * Find an exercise by ID.
   * @param {number} id
   * @returns {object|undefined}
   */
  findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM ejercicios WHERE id = ?').get(id);
  },

  /**
   * Create a new exercise.
   * @param {object} data
   * @returns {{ id: number }}
   */
  create({ usuario_id, nombre, grupo_muscular, notas }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO ejercicios (usuario_id, nombre, grupo_muscular, notas)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(usuario_id, nombre, grupo_muscular ?? null, notas ?? null);
    return { id: result.lastInsertRowid };
  },

  /**
   * Update an exercise (only if owned by the user).
   * @param {number} id
   * @param {number} usuarioId
   * @param {object} data
   * @returns {{ changes: number }}
   */
  updateByOwner(id, usuarioId, { nombre, grupo_muscular, notas }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE ejercicios SET nombre = ?, grupo_muscular = ?, notas = ?
      WHERE id = ? AND usuario_id = ?
    `);
    return { changes: stmt.run(nombre, grupo_muscular ?? null, notas ?? null, id, usuarioId).changes };
  },

  /**
   * Delete an exercise (only if owned by the user).
   * @param {number} id
   * @param {number} usuarioId
   * @returns {{ changes: number }}
   */
  deleteByOwner(id, usuarioId) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM ejercicios WHERE id = ? AND usuario_id = ?');
    return { changes: stmt.run(id, usuarioId).changes };
  },

  /**
   * Obtiene el progreso (peso máximo) por semana para un ejercicio
   */
  getProgress(ejercicioId, usuarioId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        s.id as semana_id,
        s.nombre as semana_nombre,
        s.created_at as semana_created_at,
        MAX(de.peso) as max_peso,
        MAX(de.unidad) as unidad
      FROM semanas s
      JOIN dias d ON d.semana_id = s.id
      JOIN dia_ejercicios de ON de.dia_id = d.id
      WHERE s.usuario_id = ? AND de.ejercicio_id = ?
      GROUP BY s.id
      ORDER BY s.created_at ASC
    `).all(usuarioId, ejercicioId);
  }
};

export default EjercicioModel;
