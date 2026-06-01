// ============================================================
// TrainingLog Model — Data access layer for 'logs_entrenamiento'
// ============================================================

import { getDatabase } from '../config/database.js';

const TrainingLogModel = {
  /**
   * Find a log by ID.
   * @param {number} id
   * @returns {object|undefined}
   */
  findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM logs_entrenamiento WHERE id = ?').get(id);
  },

  /**
   * Get logs for a specific user.
   * @param {number} usuarioId
   * @param {{ limit?: number, offset?: number, ejercicio?: string }} options
   * @returns {object[]}
   */
  findByUsuario(usuarioId, { limit = 100, offset = 0, ejercicio } = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM logs_entrenamiento WHERE usuario_id = ?';
    const params = [usuarioId];

    if (ejercicio) {
      query += ' AND LOWER(ejercicio) = LOWER(?)';
      params.push(ejercicio);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  /**
   * Get all logs (admin view, for AI agent).
   * @param {{ limit?: number, offset?: number }} options
   * @returns {object[]}
   */
  findAll({ limit = 1000, offset = 0 } = {}) {
    const db = getDatabase();
    return db.prepare(`
      SELECT l.*, u.nombre as usuario_nombre
      FROM logs_entrenamiento l
      JOIN usuarios u ON l.usuario_id = u.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  /**
   * Count logs for a user.
   * @param {number} usuarioId
   * @returns {number}
   */
  countByUsuario(usuarioId) {
    const db = getDatabase();
    return db.prepare(
      'SELECT COUNT(*) as total FROM logs_entrenamiento WHERE usuario_id = ?'
    ).get(usuarioId).total;
  },

  /**
   * Create a new training log.
   * @param {object} data
   * @returns {{ id: number }}
   */
  create({ usuario_id, ejercicio, formato_raw, series, repeticiones, peso, unidad, volumen, semana, dia, nota }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO logs_entrenamiento
        (usuario_id, ejercicio, formato_raw, series, repeticiones, peso, unidad, volumen, semana, dia, nota)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      usuario_id, ejercicio, formato_raw, series, repeticiones,
      peso, unidad, volumen, semana ?? null, dia ?? null, nota ?? null
    );
    return { id: result.lastInsertRowid };
  },

  /**
   * Delete a log (only if owned by the user).
   * @param {number} id
   * @param {number} usuarioId
   * @returns {{ changes: number }}
   */
  deleteByOwner(id, usuarioId) {
    const db = getDatabase();
    const stmt = db.prepare(
      'DELETE FROM logs_entrenamiento WHERE id = ? AND usuario_id = ?'
    );
    return { changes: stmt.run(id, usuarioId).changes };
  },

  /**
   * Get user stats (total volume, exercises, etc.).
   * @param {number} usuarioId
   * @returns {object}
   */
  getStatsByUsuario(usuarioId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        COUNT(*)                          as total_logs,
        COUNT(DISTINCT ejercicio)         as ejercicios_unicos,
        COALESCE(SUM(volumen), 0)         as volumen_total,
        COALESCE(MAX(peso), 0)            as peso_maximo,
        COALESCE(AVG(volumen), 0)         as volumen_promedio,
        MIN(created_at)                   as primer_log,
        MAX(created_at)                   as ultimo_log
      FROM logs_entrenamiento
      WHERE usuario_id = ?
    `).get(usuarioId);
  },

  /**
   * Get unique exercise names for a user.
   * @param {number} usuarioId
   * @returns {string[]}
   */
  getExerciseNames(usuarioId) {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT DISTINCT ejercicio
      FROM logs_entrenamiento
      WHERE usuario_id = ?
      ORDER BY ejercicio ASC
    `).all(usuarioId);
    return rows.map(r => r.ejercicio);
  },

  // ─── Queries for AI Agent ───────────────────────────────────

  /**
   * Retention data: last log per user.
   */
  getRetentionData() {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        u.id, u.nombre, u.email, u.created_at as registro,
        MAX(l.created_at) as ultimo_log,
        CAST(julianday('now') - julianday(MAX(l.created_at)) AS INTEGER) as dias_inactivo
      FROM usuarios u
      LEFT JOIN logs_entrenamiento l ON u.id = l.usuario_id
      WHERE u.activo = 1
      GROUP BY u.id
      ORDER BY dias_inactivo DESC
    `).all();
  },

  /**
   * Hourly distribution of logs.
   */
  getHourlyDistribution() {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        CAST(strftime('%H', created_at) AS INTEGER) as hora,
        COUNT(*) as registros
      FROM logs_entrenamiento
      GROUP BY hora
      ORDER BY hora
    `).all();
  },

  /**
   * Day-of-week distribution.
   */
  getWeekdayDistribution() {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        CASE CAST(strftime('%w', created_at) AS INTEGER)
          WHEN 0 THEN 'Domingo'
          WHEN 1 THEN 'Lunes'
          WHEN 2 THEN 'Martes'
          WHEN 3 THEN 'Miércoles'
          WHEN 4 THEN 'Jueves'
          WHEN 5 THEN 'Viernes'
          WHEN 6 THEN 'Sábado'
        END as dia,
        CAST(strftime('%w', created_at) AS INTEGER) as dia_num,
        COUNT(*) as registros
      FROM logs_entrenamiento
      GROUP BY dia_num
      ORDER BY dia_num
    `).all();
  },

  /**
   * Engagement metrics per user.
   */
  getEngagementData() {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        u.id, u.nombre,
        COUNT(DISTINCT strftime('%W-%Y', l.created_at)) as semanas_activas,
        COUNT(l.id)                                     as total_logs,
        COUNT(DISTINCT l.ejercicio)                     as ejercicios_unicos,
        COALESCE(AVG(l.volumen), 0)                     as volumen_promedio,
        COALESCE(SUM(l.volumen), 0)                     as volumen_total,
        MIN(l.created_at)                               as primer_log,
        MAX(l.created_at)                               as ultimo_log,
        CAST(
          (julianday(MAX(l.created_at)) - julianday(MIN(l.created_at))) / 7
          AS INTEGER
        ) + 1                                           as semanas_totales
      FROM usuarios u
      JOIN logs_entrenamiento l ON u.id = l.usuario_id
      WHERE u.activo = 1
      GROUP BY u.id
      ORDER BY total_logs DESC
    `).all();
  },

  /**
   * Engagement for a single user.
   */
  getEngagementByUsuario(usuarioId) {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        u.id, u.nombre,
        COUNT(DISTINCT strftime('%W-%Y', l.created_at)) as semanas_activas,
        COUNT(l.id)                                     as total_logs,
        COUNT(DISTINCT l.ejercicio)                     as ejercicios_unicos,
        COALESCE(AVG(l.volumen), 0)                     as volumen_promedio,
        COALESCE(SUM(l.volumen), 0)                     as volumen_total,
        MIN(l.created_at)                               as primer_log,
        MAX(l.created_at)                               as ultimo_log,
        CAST(
          (julianday(MAX(l.created_at)) - julianday(MIN(l.created_at))) / 7
          AS INTEGER
        ) + 1                                           as semanas_totales
      FROM usuarios u
      JOIN logs_entrenamiento l ON u.id = l.usuario_id
      WHERE u.id = ? AND u.activo = 1
      GROUP BY u.id
    `).get(usuarioId);
  },
};

export default TrainingLogModel;
