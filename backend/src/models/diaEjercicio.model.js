// ============================================================
// DiaEjercicio Model — Data access layer for 'dia_ejercicios'
// Pivot table between dias and ejercicios with performance data
// ============================================================

import { getDatabase } from '../config/database.js';

const DiaEjercicioModel = {
  /**
   * Find all exercises assigned to a specific day (with exercise details).
   * @param {number} diaId
   * @returns {object[]}
   */
  findByDia(diaId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        de.*,
        e.nombre as ejercicio_nombre,
        e.grupo_muscular,
        (de.series * de.repeticiones * de.peso) as volumen
      FROM dia_ejercicios de
      JOIN ejercicios e ON de.ejercicio_id = e.id
      WHERE de.dia_id = ?
      ORDER BY de.created_at ASC
    `).all(diaId);
  },

  /**
   * Find a specific assignment by ID.
   * @param {number} id
   * @returns {object|undefined}
   */
  findById(id) {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        de.*,
        e.nombre as ejercicio_nombre,
        e.grupo_muscular
      FROM dia_ejercicios de
      JOIN ejercicios e ON de.ejercicio_id = e.id
      WHERE de.id = ?
    `).get(id);
  },

  /**
   * Assign an exercise to a day.
   * @param {object} data
   * @returns {{ id: number }}
   */
  create({ dia_id, ejercicio_id, series, repeticiones, peso, unidad, nota }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO dia_ejercicios (dia_id, ejercicio_id, series, repeticiones, peso, unidad, nota)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      dia_id, ejercicio_id,
      series ?? 3, repeticiones ?? 10,
      peso ?? 0, unidad ?? 'kg',
      nota ?? null
    );
    return { id: result.lastInsertRowid };
  },

  /**
   * Update an exercise assignment.
   * @param {number} id
   * @param {object} data
   * @returns {{ changes: number }}
   */
  update(id, { series, repeticiones, peso, unidad, nota }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE dia_ejercicios
      SET series = ?, repeticiones = ?, peso = ?, unidad = ?, nota = ?
      WHERE id = ?
    `);
    return { changes: stmt.run(series, repeticiones, peso, unidad ?? 'kg', nota ?? null, id).changes };
  },

  /**
   * Delete an exercise assignment.
   * @param {number} id
   * @returns {{ changes: number }}
   */
  deleteById(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM dia_ejercicios WHERE id = ?');
    return { changes: stmt.run(id).changes };
  },
};

export default DiaEjercicioModel;
