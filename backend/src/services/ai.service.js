// ============================================================
// AI Service — Business Metrics Agent
// System Prompts + Data queries + structured JSON responses
// ============================================================

import TrainingLogModel from '../models/trainingLog.model.js';
import UserModel from '../models/user.model.js';

// ─── System Prompts ──────────────────────────────────────────

const SYSTEM_PROMPT_RETENTION = `
Eres un analista de datos de fitness empresarial. Tu tarea es analizar patrones de 
retención y abandono (churn) de usuarios de un gimnasio.

DATOS DE ENTRADA: Recibirás datos JSON con:
- Lista de usuarios con su fecha de registro y último registro de entrenamiento
- Umbral de inactividad configurable (default: 14 días)

REGLAS DE CLASIFICACIÓN:
- ACTIVO: Tiene registro en los últimos {umbral} días
- EN RIESGO: No tiene registro en {umbral} a {umbral*2} días  
- ABANDONADO (CHURNED): Sin registro en más de {umbral*2} días
- NUEVO: Registrado en los últimos 7 días sin logs aún

SALIDA REQUERIDA (JSON estricto):
{
  "resumen": {
    "total_usuarios": number,
    "activos": number,
    "en_riesgo": number,
    "abandonados": number,
    "tasa_retencion_pct": number,
    "tasa_churn_pct": number
  },
  "usuarios_en_riesgo": [{ "id": number, "nombre": string, "dias_inactivo": number, "ultimo_log": string }],
  "usuarios_abandonados": [{ "id": number, "nombre": string, "dias_inactivo": number, "ultimo_log": string }],
  "tendencia_mensual": [{ "mes": string, "activos": number, "nuevos": number, "abandonados": number }],
  "recomendaciones": [string]
}

Responde ÚNICAMENTE con el JSON, sin texto adicional ni bloques de código markdown.
`.trim();

const SYSTEM_PROMPT_PEAK_HOURS = `
Eres un analista de operaciones de un gimnasio. Tu tarea es identificar los patrones 
horarios de uso basándote en los timestamps de registros de entrenamiento.

DATOS DE ENTRADA: Recibirás datos JSON con:
- Conteo de registros agrupados por hora del día (0-23)
- Conteo por día de la semana (Lunes-Domingo)

SALIDA REQUERIDA (JSON estricto):
{
  "hora_pico": { "hora": number, "registros": number, "pct_del_total": number },
  "top_3_horas": [{ "hora": number, "registros": number, "pct_del_total": number }],
  "distribucion_horaria": [{ "hora": number, "registros": number, "intensidad": "baja|media|alta|pico" }],
  "patron_semanal": [{ "dia": string, "registros": number, "es_pico": boolean }],
  "franjas": {
    "madrugada_0_6": number,
    "manana_6_12": number,
    "tarde_12_18": number,
    "noche_18_24": number
  },
  "recomendaciones": [string]
}

Responde ÚNICAMENTE con el JSON, sin texto adicional ni bloques de código markdown.
`.trim();

const SYSTEM_PROMPT_ENGAGEMENT = `
Eres un analista de engagement de un gimnasio. Tu tarea es calcular índices de 
enganche individuales y grupales.

DATOS DE ENTRADA: Recibirás datos JSON con:
- Frecuencia de entrenamientos por usuario (semanal/mensual)
- Variedad de ejercicios por usuario
- Consistencia (semanas consecutivas con al menos 1 log)
- Volumen total y progresión de peso

FÓRMULA DE ENGAGEMENT SCORE (0-100):
- Frecuencia semanal (peso: 35%): (logs_por_semana / target_semanal) * 35 (cap at 35)
- Consistencia (peso: 25%): (semanas_activas / semanas_totales) * 25
- Variedad (peso: 20%): (ejercicios_únicos / umbral_variedad) * 20 (cap at 20)
- Progresión (peso: 20%): tiene_progresion_positiva ? 20 : 10

Clasificación:
- 80-100: "excepcional"
- 60-79: "alto"
- 40-59: "medio"
- 0-39: "bajo"

SALIDA REQUERIDA (JSON estricto):
{
  "engagement_grupal": {
    "score_promedio": number,
    "clasificacion": "bajo|medio|alto|excepcional",
    "total_evaluados": number
  },
  "ranking_usuarios": [{ 
    "id": number, "nombre": string, "score": number, "clasificacion": string, 
    "frecuencia_semanal": number, "consistencia_pct": number, "ejercicios_unicos": number 
  }],
  "distribucion": {
    "excepcional_80_100": number,
    "alto_60_80": number,
    "medio_40_60": number,
    "bajo_0_40": number
  },
  "tendencia_engagement": [{ "semana": string, "score_promedio": number }],
  "recomendaciones": [string]
}

Responde ÚNICAMENTE con el JSON, sin texto adicional ni bloques de código markdown.
`.trim();

// ─── Data Collectors ─────────────────────────────────────────

/**
 * Collects and structures retention data from the database.
 * Can be sent directly to an LLM or processed locally.
 */
function collectRetentionData(umbralDias = 14) {
  const rawData = TrainingLogModel.getRetentionData();
  const totalUsuarios = UserModel.count();

  // Classify users locally (works without LLM too)
  const now = new Date();
  const clasificados = rawData.map((user) => {
    let estado;
    if (!user.ultimo_log) {
      const diasDesdeRegistro = Math.floor(
        (now - new Date(user.registro)) / (1000 * 60 * 60 * 24)
      );
      estado = diasDesdeRegistro <= 7 ? 'NUEVO' : 'ABANDONADO';
    } else if (user.dias_inactivo <= umbralDias) {
      estado = 'ACTIVO';
    } else if (user.dias_inactivo <= umbralDias * 2) {
      estado = 'EN_RIESGO';
    } else {
      estado = 'ABANDONADO';
    }
    return { ...user, estado };
  });

  const activos = clasificados.filter((u) => u.estado === 'ACTIVO').length;
  const enRiesgo = clasificados.filter((u) => u.estado === 'EN_RIESGO');
  const abandonados = clasificados.filter((u) => u.estado === 'ABANDONADO');

  return {
    resumen: {
      total_usuarios: totalUsuarios,
      activos,
      en_riesgo: enRiesgo.length,
      abandonados: abandonados.length,
      tasa_retencion_pct: totalUsuarios > 0
        ? parseFloat(((activos / totalUsuarios) * 100).toFixed(1))
        : 0,
      tasa_churn_pct: totalUsuarios > 0
        ? parseFloat(((abandonados.length / totalUsuarios) * 100).toFixed(1))
        : 0,
    },
    usuarios_en_riesgo: enRiesgo.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      dias_inactivo: u.dias_inactivo,
      ultimo_log: u.ultimo_log,
    })),
    usuarios_abandonados: abandonados.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      dias_inactivo: u.dias_inactivo,
      ultimo_log: u.ultimo_log,
    })),
    recomendaciones: generateRetentionRecommendations(activos, enRiesgo.length, abandonados.length, totalUsuarios),
  };
}

/**
 * Collects and structures peak hours data.
 */
function collectPeakHoursData() {
  const hourlyData = TrainingLogModel.getHourlyDistribution();
  const weekdayData = TrainingLogModel.getWeekdayDistribution();

  const totalRegistros = hourlyData.reduce((sum, h) => sum + h.registros, 0);

  // Find peak hour
  const sorted = [...hourlyData].sort((a, b) => b.registros - a.registros);
  const peakHour = sorted[0] || { hora: 0, registros: 0 };

  // Classify intensity
  const maxRegistros = peakHour.registros || 1;
  const distribucion = Array.from({ length: 24 }, (_, hora) => {
    const found = hourlyData.find((h) => h.hora === hora);
    const registros = found?.registros || 0;
    const ratio = registros / maxRegistros;
    let intensidad;
    if (ratio >= 0.8) intensidad = 'pico';
    else if (ratio >= 0.5) intensidad = 'alta';
    else if (ratio >= 0.2) intensidad = 'media';
    else intensidad = 'baja';

    return {
      hora,
      registros,
      intensidad,
      pct_del_total: totalRegistros > 0
        ? parseFloat(((registros / totalRegistros) * 100).toFixed(1))
        : 0,
    };
  });

  // Calculate time slots
  const franjas = {
    madrugada_0_6: distribucion.slice(0, 6).reduce((s, h) => s + h.registros, 0),
    manana_6_12: distribucion.slice(6, 12).reduce((s, h) => s + h.registros, 0),
    tarde_12_18: distribucion.slice(12, 18).reduce((s, h) => s + h.registros, 0),
    noche_18_24: distribucion.slice(18, 24).reduce((s, h) => s + h.registros, 0),
  };

  // Weekly pattern
  const maxDia = Math.max(...weekdayData.map((d) => d.registros), 1);
  const patronSemanal = weekdayData.map((d) => ({
    dia: d.dia,
    registros: d.registros,
    es_pico: d.registros / maxDia >= 0.8,
  }));

  return {
    hora_pico: {
      hora: peakHour.hora,
      registros: peakHour.registros,
      pct_del_total: totalRegistros > 0
        ? parseFloat(((peakHour.registros / totalRegistros) * 100).toFixed(1))
        : 0,
    },
    top_3_horas: sorted.slice(0, 3).map((h) => ({
      hora: h.hora,
      registros: h.registros,
      pct_del_total: totalRegistros > 0
        ? parseFloat(((h.registros / totalRegistros) * 100).toFixed(1))
        : 0,
    })),
    distribucion_horaria: distribucion,
    patron_semanal: patronSemanal,
    franjas,
    recomendaciones: generatePeakHoursRecommendations(peakHour, franjas, patronSemanal),
  };
}

/**
 * Collects and structures engagement data.
 */
function collectEngagementData(targetSemanal = 4, umbralVariedad = 8) {
  const rawData = TrainingLogModel.getEngagementData();

  const ranking = rawData.map((user) => {
    const logsPorSemana = user.semanas_totales > 0
      ? user.total_logs / user.semanas_totales
      : 0;

    // Frequency score (35%)
    const freqScore = Math.min(35, (logsPorSemana / targetSemanal) * 35);

    // Consistency score (25%)
    const consistencia = user.semanas_totales > 0
      ? user.semanas_activas / user.semanas_totales
      : 0;
    const consScore = consistencia * 25;

    // Variety score (20%)
    const varScore = Math.min(20, (user.ejercicios_unicos / umbralVariedad) * 20);

    // Progression score (20%) — simplified: more volume over time = positive
    const progScore = user.volumen_total > 0 ? 15 : 5;

    const score = parseFloat((freqScore + consScore + varScore + progScore).toFixed(1));

    let clasificacion;
    if (score >= 80) clasificacion = 'excepcional';
    else if (score >= 60) clasificacion = 'alto';
    else if (score >= 40) clasificacion = 'medio';
    else clasificacion = 'bajo';

    return {
      id: user.id,
      nombre: user.nombre,
      score,
      clasificacion,
      frecuencia_semanal: parseFloat(logsPorSemana.toFixed(1)),
      consistencia_pct: parseFloat((consistencia * 100).toFixed(1)),
      ejercicios_unicos: user.ejercicios_unicos,
    };
  });

  // Sort by score descending
  ranking.sort((a, b) => b.score - a.score);

  const scores = ranking.map((r) => r.score);
  const avgScore = scores.length > 0
    ? parseFloat((scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1))
    : 0;

  let clasificacionGrupal;
  if (avgScore >= 80) clasificacionGrupal = 'excepcional';
  else if (avgScore >= 60) clasificacionGrupal = 'alto';
  else if (avgScore >= 40) clasificacionGrupal = 'medio';
  else clasificacionGrupal = 'bajo';

  return {
    engagement_grupal: {
      score_promedio: avgScore,
      clasificacion: clasificacionGrupal,
      total_evaluados: ranking.length,
    },
    ranking_usuarios: ranking,
    distribucion: {
      excepcional_80_100: ranking.filter((r) => r.score >= 80).length,
      alto_60_80: ranking.filter((r) => r.score >= 60 && r.score < 80).length,
      medio_40_60: ranking.filter((r) => r.score >= 40 && r.score < 60).length,
      bajo_0_40: ranking.filter((r) => r.score < 40).length,
    },
    recomendaciones: generateEngagementRecommendations(avgScore, ranking),
  };
}

/**
 * Collects engagement data for a single user.
 */
function collectEngagementByUser(usuarioId, targetSemanal = 4, umbralVariedad = 8) {
  const user = TrainingLogModel.getEngagementByUsuario(usuarioId);
  if (!user) return null;

  const logsPorSemana = user.semanas_totales > 0
    ? user.total_logs / user.semanas_totales
    : 0;

  const freqScore = Math.min(35, (logsPorSemana / targetSemanal) * 35);
  const consistencia = user.semanas_totales > 0
    ? user.semanas_activas / user.semanas_totales
    : 0;
  const consScore = consistencia * 25;
  const varScore = Math.min(20, (user.ejercicios_unicos / umbralVariedad) * 20);
  const progScore = user.volumen_total > 0 ? 15 : 5;
  const score = parseFloat((freqScore + consScore + varScore + progScore).toFixed(1));

  let clasificacion;
  if (score >= 80) clasificacion = 'excepcional';
  else if (score >= 60) clasificacion = 'alto';
  else if (score >= 40) clasificacion = 'medio';
  else clasificacion = 'bajo';

  return {
    id: user.id,
    nombre: user.nombre,
    score,
    clasificacion,
    detalle: {
      frecuencia_semanal: parseFloat(logsPorSemana.toFixed(1)),
      consistencia_pct: parseFloat((consistencia * 100).toFixed(1)),
      ejercicios_unicos: user.ejercicios_unicos,
      volumen_total: parseFloat(user.volumen_total.toFixed(1)),
      semanas_activas: user.semanas_activas,
      semanas_totales: user.semanas_totales,
      total_logs: user.total_logs,
    },
    desglose_score: {
      frecuencia: parseFloat(freqScore.toFixed(1)),
      consistencia: parseFloat(consScore.toFixed(1)),
      variedad: parseFloat(varScore.toFixed(1)),
      progresion: progScore,
    },
  };
}

// ─── Recommendation Generators (Deterministic Fallback) ──────

function generateRetentionRecommendations(activos, enRiesgo, abandonados, total) {
  const recs = [];
  if (total === 0) return ['No hay usuarios registrados aún.'];

  const churnRate = (abandonados / total) * 100;
  if (churnRate > 30) {
    recs.push('⚠️ Tasa de abandono crítica (>30%). Implementar campaña de re-engagement urgente.');
  }
  if (enRiesgo > 0) {
    recs.push(`📧 ${enRiesgo} usuario(s) en riesgo. Enviar recordatorios personalizados esta semana.`);
  }
  if (activos / total > 0.7) {
    recs.push('✅ Buena retención (>70%). Mantener engagement actual con desafíos semanales.');
  }
  if (recs.length === 0) {
    recs.push('📊 Métricas estables. Continuar monitoreando semanalmente.');
  }
  return recs;
}

function generatePeakHoursRecommendations(peakHour, franjas, patronSemanal) {
  const recs = [];
  if (peakHour.registros === 0) return ['No hay datos de uso suficientes para generar recomendaciones.'];

  recs.push(`🕐 Hora pico: ${peakHour.hora}:00. Considerar personal adicional o clases en ese horario.`);

  const maxFranja = Object.entries(franjas).sort(([, a], [, b]) => b - a)[0];
  recs.push(`📈 Franja más activa: ${maxFranja[0].replace(/_/g, ' ')} con ${maxFranja[1]} registros.`);

  const diasPico = patronSemanal.filter((d) => d.es_pico);
  if (diasPico.length > 0) {
    recs.push(`📅 Días pico: ${diasPico.map((d) => d.dia).join(', ')}. Optimizar horarios de limpieza/mantenimiento fuera de estos días.`);
  }

  return recs;
}

function generateEngagementRecommendations(avgScore, ranking) {
  const recs = [];
  if (ranking.length === 0) return ['No hay datos de engagement suficientes.'];

  if (avgScore < 40) {
    recs.push('⚠️ Engagement grupal bajo. Considerar programa de incentivos o desafíos grupales.');
  } else if (avgScore >= 70) {
    recs.push('🎯 Excelente engagement grupal. Los usuarios están comprometidos.');
  }

  const lowEngagement = ranking.filter((r) => r.score < 40);
  if (lowEngagement.length > 0) {
    recs.push(`📋 ${lowEngagement.length} usuario(s) con engagement bajo. Contactar para feedback.`);
  }

  const topUsers = ranking.slice(0, 3);
  if (topUsers.length > 0) {
    recs.push(`🏆 Top performers: ${topUsers.map((u) => u.nombre).join(', ')}. Considerar programa de embajadores.`);
  }

  return recs;
}

// ─── LLM Integration (Prepared for API key) ──────────────────

/**
 * Sends data to an LLM provider for enhanced analysis.
 * Falls back to local analysis if no API key is configured.
 *
 * @param {string} systemPrompt
 * @param {object} data
 * @returns {Promise<object>}
 */
async function queryLLM(systemPrompt, data) {
  const apiKey = process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER || 'openai';
  const model = process.env.AI_MODEL || 'gpt-4';

  // If no API key, return data as-is (local analysis already computed)
  if (!apiKey || apiKey === 'your-api-key-here') {
    return null; // Signal to use local fallback
  }

  try {
    let response;

    if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(data) },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });
    } else if (provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: JSON.stringify(data) },
          ],
        }),
      });
    }

    if (response && response.ok) {
      const json = await response.json();
      const content = provider === 'openai'
        ? json.choices[0].message.content
        : json.content[0].text;
      return JSON.parse(content);
    }

    return null; // Fallback to local
  } catch (error) {
    console.error('[AI Service] LLM query failed, using local fallback:', error.message);
    return null;
  }
}

// ─── Exported Service Methods ────────────────────────────────

export const AIService = {
  /**
   * Get retention and churn metrics.
   * @param {{ umbralDias?: number }} options
   */
  async getRetentionMetrics({ umbralDias = 14 } = {}) {
    const localData = collectRetentionData(umbralDias);
    const llmResult = await queryLLM(SYSTEM_PROMPT_RETENTION, localData);
    return llmResult || localData;
  },

  /**
   * Get peak hours metrics.
   */
  async getPeakHoursMetrics() {
    const localData = collectPeakHoursData();
    const llmResult = await queryLLM(SYSTEM_PROMPT_PEAK_HOURS, localData);
    return llmResult || localData;
  },

  /**
   * Get engagement metrics (group).
   * @param {{ targetSemanal?: number, umbralVariedad?: number }} options
   */
  async getEngagementMetrics({ targetSemanal = 4, umbralVariedad = 8 } = {}) {
    const localData = collectEngagementData(targetSemanal, umbralVariedad);
    const llmResult = await queryLLM(SYSTEM_PROMPT_ENGAGEMENT, localData);
    return llmResult || localData;
  },

  /**
   * Get engagement metrics for a single user.
   * @param {number} usuarioId
   */
  async getEngagementByUser(usuarioId) {
    return collectEngagementByUser(usuarioId);
  },

  /**
   * Expose system prompts for transparency/debugging.
   */
  getSystemPrompts() {
    return {
      retention: SYSTEM_PROMPT_RETENTION,
      peak_hours: SYSTEM_PROMPT_PEAK_HOURS,
      engagement: SYSTEM_PROMPT_ENGAGEMENT,
    };
  },
};

export default AIService;
