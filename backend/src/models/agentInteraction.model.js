// ============================================================
// AgentInteraction Model — Registro de interacciones del agente IA
// Implementa el ciclo completo del PDF: pregunta → responde → guarda dato
// ============================================================

import { getDatabase } from '../config/database.js';

const AgentInteractionModel = {
  /**
   * Crea un registro de interacción con el agente.
   * Llamado automáticamente después de cada respuesta del agente.
   *
   * @param {object} data
   * @param {number|null} data.usuario_id      - ID del usuario (null para agente ADMIN)
   * @param {'CLIENTE'|'ADMIN'} data.agente_tipo
   * @param {string} data.mensaje_usuario      - Mensaje original del usuario
   * @param {string} data.respuesta_ia         - Respuesta generada por el agente
   * @param {string} data.intencion            - Intención detectada: CONSULTA | PEDIDO | RECLAMO | ALERTA | ANALISIS
   * @param {string|null} data.accion_tomada   - Descripción de acción ejecutada (guardar log, generar reporte, etc.)
   * @param {object|null} data.datos_contexto  - Datos de contexto enviados al LLM (métricas, logs, etc.)
   * @param {boolean} data.resuelto            - true = resuelto, false = derivado a humano
   * @returns {{ id: number }}
   */
  create({
    usuario_id = null,
    agente_tipo,
    mensaje_usuario,
    respuesta_ia,
    intencion = 'CONSULTA',
    accion_tomada = null,
    datos_contexto = null,
    resuelto = true,
  }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO agent_interactions
        (usuario_id, agente_tipo, mensaje_usuario, respuesta_ia, intencion, accion_tomada, datos_contexto, resuelto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      usuario_id,
      agente_tipo,
      mensaje_usuario,
      respuesta_ia,
      intencion,
      accion_tomada,
      datos_contexto ? JSON.stringify(datos_contexto) : null,
      resuelto ? 1 : 0
    );
    return { id: result.lastInsertRowid };
  },

  /**
   * Obtiene el historial de interacciones (para el admin).
   * @param {{ limit?: number, offset?: number, agente_tipo?: string }} options
   * @returns {object[]}
   */
  findAll({ limit = 100, offset = 0, agente_tipo } = {}) {
    const db = getDatabase();
    let query = `
      SELECT
        ai.*,
        u.nombre as usuario_nombre,
        u.email  as usuario_email
      FROM agent_interactions ai
      LEFT JOIN usuarios u ON ai.usuario_id = u.id
    `;
    const params = [];

    if (agente_tipo) {
      query += ' WHERE ai.agente_tipo = ?';
      params.push(agente_tipo);
    }

    query += ' ORDER BY ai.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  /**
   * Obtiene el historial de interacciones de un usuario específico.
   * @param {number} usuarioId
   * @param {{ limit?: number }} options
   * @returns {object[]}
   */
  findByUsuario(usuarioId, { limit = 50 } = {}) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM agent_interactions
      WHERE usuario_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(usuarioId, limit);
  },

  /**
   * Cuenta el total de interacciones por tipo.
   * @returns {{ CLIENTE: number, ADMIN: number, total: number }}
   */
  getStats() {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT
        agente_tipo,
        COUNT(*) as total,
        SUM(CASE WHEN resuelto = 1 THEN 1 ELSE 0 END) as resueltos,
        SUM(CASE WHEN resuelto = 0 THEN 1 ELSE 0 END) as derivados
      FROM agent_interactions
      GROUP BY agente_tipo
    `).all();

    const totalGeneral = db.prepare('SELECT COUNT(*) as c FROM agent_interactions').get();

    return {
      total: totalGeneral.c,
      por_agente: rows,
    };
  },

  /**
   * Obtiene las intenciones más frecuentes detectadas por el agente.
   * @returns {object[]}
   */
  getIntentStats() {
    const db = getDatabase();
    return db.prepare(`
      SELECT
        intencion,
        COUNT(*) as total,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM agent_interactions), 1) as porcentaje
      FROM agent_interactions
      GROUP BY intencion
      ORDER BY total DESC
    `).all();
  },
};

export default AgentInteractionModel;
