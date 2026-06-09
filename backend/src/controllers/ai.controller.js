// ============================================================
// AI Controller — Agentes IA para NeonBench Gym
// Implementa el ciclo completo del PDF:
// pregunta → responde → guarda dato → notifica
// ============================================================

import AIService, { detectarIntencion } from '../services/ai.service.js';
import AgentInteractionModel from '../models/agentInteraction.model.js';
import { sendSuccess, sendError } from '../utils/helpers.js';
import TrainingLogModel from '../models/trainingLog.model.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── System Prompts de Agentes Conversacionales ──────────────
// Formato exacto del PDF: [Rol][Contexto][Reglas fijas][IA de apoyo][Formato][Fallos]

const SYSTEM_PROMPT_NEONTRAINER = (logsFormat, stats) => `
[Rol]
Eres "NeonTrainer", asistente de entrenamiento personal inteligente de NeonBench Gym.
Tu trabajo es analizar el historial de entrenamiento del usuario y responder sus preguntas.

[Contexto]
Tienes acceso EXCLUSIVO a los datos reales de entrenamiento del usuario:
- Volumen Total Acumulado: ${stats.volumen_total} kg
- Total de Entrenamientos Registrados: ${stats.total_logs}
- Peso Máximo Levantado: ${stats.peso_maximo} kg
- Ejercicios Únicos Practicados: ${stats.ejercicios_unicos}

Últimos 50 registros de entrenamiento:
${logsFormat}

[Reglas fijas]
1. Si el usuario pregunta por su récord personal (PR) de algún ejercicio → busca en los registros y responde con el peso más alto encontrado.
2. Si el usuario pregunta por su progreso → compara los últimos registros con los primeros y describe la evolución.
3. Si detectas un estancamiento (mismo peso por 3+ registros) → mencionarlo con sugerencias de progresión.
4. Si el usuario pregunta algo que NO está en su historial → responde: "No tengo registros de eso en tu historial. ¿Quieres que lo analice cuando empieces a registrarlo?"
5. Si el usuario es grosero o inapropiado → responde: "Por favor mantén un tono respetuoso. ¿En qué más puedo ayudarte con tu entrenamiento?"
6. Si el mensaje parece un reclamo técnico → responde: "Eso parece un problema técnico. Te recomiendo contactar al administrador del gimnasio."
7. NUNCA inventes datos, récords ni sugerencias basadas en información que no esté en el historial.

[IA de apoyo]
- Gemini 2.5 Flash interpreta el lenguaje natural del usuario y genera respuestas personalizadas.
- Los datos de contexto son extraídos directamente de SQLite antes de cada consulta.

[Formato de respuesta]
- Tono motivador con estética cyberpunk/retro-futurista (puedes usar términos como "Datos recibidos", "Análisis completado").
- Usa emojis estratégicos: 💪, 📊, 🔥, ⚡, ✅.
- Máximo 2-3 párrafos cortos. Formatea con Markdown (negrita, listas).
- Si no sabes algo, sé honesto: "No encuentro esos datos en tu historial."

[Manejo de fallos]
Si no hay registros de entrenamiento: "Aún no tienes entrenamientos registrados. ¡Empieza hoy y podré analizar tu progreso!"
`.trim();

const SYSTEM_PROMPT_NEXUS_ADMIN = (retentionSummary, peakSummary, engagementSummary) => `
[Rol]
Eres "NEXUS", agente de inteligencia artificial especializado en análisis de negocio para NeonBench Gym.
Eres el asistente exclusivo del administrador/dueño del gimnasio.
Tu misión: analizar datos del negocio, detectar oportunidades y alertas, responder preguntas estratégicas.

[Contexto]
Tienes acceso en tiempo real a 3 métricas del negocio (actualizadas desde la base de datos):

${retentionSummary}

${peakSummary}

${engagementSummary}

[Reglas fijas]
1. Basa tus respuestas SIEMPRE en los datos reales de arriba. No inventes cifras ni usuarios.
2. Si la tasa de churn es > 15% → emitir ALERTA con 🚨 y recomendar campaña de re-engagement urgente.
3. Si la tasa de churn es > 30% → emitir ALERTA CRÍTICA con 🚨🚨 y acciones inmediatas.
4. Si el engagement grupal es < 40 → recomendar programa de incentivos o desafíos grupales.
5. Si hay usuarios en riesgo específicos → mencionarlos por nombre para acción personalizada.
6. Si no hay suficientes datos para responder → decir exactamente qué datos faltan y cómo registrarlos.
7. Para preguntas fuera del ámbito del gimnasio → responder: "Eso está fuera de mi área de análisis. ¿Puedo ayudarte con métricas del negocio?"

[IA de apoyo]
- Gemini 2.5 Flash analiza los datos del negocio y genera recomendaciones estratégicas.
- Los datos de contexto son calculados en tiempo real antes de cada consulta.

[Formato de respuesta]
- Tono profesional y directo. Eres un analista de datos de élite.
- Usa Markdown: **negrita**, listas y emojis estratégicos (📊, 🚨, ✅, 📈, 🎯).
- Máximo 3-4 párrafos o una lista corta bien estructurada.
- Concluye siempre con una recomendación accionable concreta.

[Manejo de fallos]
Si no hay datos de ninguna métrica: "La base de datos aún no tiene suficiente actividad para generar análisis. Registra usuarios y entrenamientos para activar el dashboard de NEXUS."
`.trim();


// ─── Métricas Endpoints ──────────────────────────────────────

/**
 * GET /api/ai/retention
 * Returns retention and churn metrics.
 */
export async function getRetention(req, res) {
  const umbralDias = parseInt(req.query.umbral, 10) || 14;

  const metrics = await AIService.getRetentionMetrics({ umbralDias });
  sendSuccess(res, {
    metrica: 'retencion_y_churn',
    umbral_dias: umbralDias,
    datos: metrics,
  });
}

/**
 * GET /api/ai/peak-hours
 * Returns peak usage hours metrics.
 */
export async function getPeakHours(req, res) {
  const metrics = await AIService.getPeakHoursMetrics();
  sendSuccess(res, {
    metrica: 'hora_pico_uso',
    datos: metrics,
  });
}

/**
 * GET /api/ai/engagement
 * Returns group engagement metrics.
 */
export async function getEngagement(req, res) {
  const targetSemanal = parseInt(req.query.target, 10) || 4;
  const umbralVariedad = parseInt(req.query.variedad, 10) || 8;

  const metrics = await AIService.getEngagementMetrics({ targetSemanal, umbralVariedad });
  sendSuccess(res, {
    metrica: 'indice_engagement',
    parametros: { target_semanal: targetSemanal, umbral_variedad: umbralVariedad },
    datos: metrics,
  });
}

/**
 * GET /api/ai/engagement/:userId
 * Returns engagement metrics for a single user.
 */
export async function getEngagementByUser(req, res) {
  const userId = parseInt(req.params.userId, 10);

  if (isNaN(userId)) {
    return sendError(res, 'ID de usuario inválido.', 400);
  }

  const metrics = await AIService.getEngagementByUser(userId);

  if (!metrics) {
    return sendError(res, 'Usuario no encontrado o sin datos de entrenamiento.', 404);
  }

  sendSuccess(res, {
    metrica: 'engagement_individual',
    datos: metrics,
  });
}

/**
 * GET /api/ai/prompts
 * Returns the system prompts for transparency (admin debug).
 */
export function getPrompts(req, res) {
  // Include conversational prompts as templates
  const sampleStats = { volumen_total: 0, total_logs: 0, peso_maximo: 0, ejercicios_unicos: 0 };
  const sampleSummary = '[Datos en tiempo real — disponibles al consultar el agente]';

  sendSuccess(res, {
    descripcion: 'Prompts del sistema de los agentes IA de NeonBench. Formato: [Rol][Contexto][Reglas fijas][IA de apoyo][Formato][Manejo de fallos]',
    prompts: {
      ...AIService.getSystemPrompts(),
      neontrainer_cliente: SYSTEM_PROMPT_NEONTRAINER(sampleSummary, sampleStats),
      nexus_admin: SYSTEM_PROMPT_NEXUS_ADMIN(sampleSummary, sampleSummary, sampleSummary),
    },
  });
}

// ─── Historial de Interacciones ──────────────────────────────

/**
 * GET /api/ai/interactions
 * Returns the stored agent interaction history (admin only).
 * Demuestra el ciclo: pregunta → responde → GUARDA DATO
 */
export function getInteractions(req, res) {
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;
  const tipo = req.query.tipo || null;

  const interactions = AgentInteractionModel.findAll({ limit, offset, agente_tipo: tipo });
  const stats = AgentInteractionModel.getStats();
  const intentStats = AgentInteractionModel.getIntentStats();

  sendSuccess(res, {
    interacciones: interactions,
    estadisticas: stats,
    intenciones: intentStats,
  });
}

// ─── Agente Conversacional Cliente (NeonTrainer) ─────────────

/**
 * POST /api/ai/chat
 * Agente NeonTrainer: Analiza historial de entrenamiento del usuario.
 * Ciclo completo: recibe mensaje → consulta BD → responde con Gemini → GUARDA interacción.
 */
export async function postChat(req, res) {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || !message.trim()) {
    return sendError(res, 'El mensaje es requerido.', 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendError(res, 'La clave de API de Gemini no está configurada en el backend.', 500);
  }

  // 1. Detectar intención del mensaje (clasificación automática)
  const intencion = detectarIntencion(message);
  const esReclamo = intencion === 'RECLAMO';

  try {
    // 2. Extraer historial y estadísticas del usuario desde la BD
    const logsRecientes = TrainingLogModel.findByUsuario(userId, { limit: 50 });
    const stats = TrainingLogModel.getStatsByUsuario(userId);

    // 3. Formatear logs para el contexto del prompt
    const logsFormat = logsRecientes.length > 0
      ? logsRecientes
          .map(l => `- [${l.created_at?.slice(0, 10) || 'Sin fecha'}] ${l.ejercicio}: ${l.formato_raw} (vol: ${l.volumen}kg)`)
          .join('\n')
      : 'Sin registros de entrenamiento aún.';

    // 4. Construir system prompt estructurado (formato PDF)
    const systemPrompt = SYSTEM_PROMPT_NEONTRAINER(logsFormat, stats);

    // 5. Llamar a Gemini 2.5 Flash (IA de apoyo)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    // 6. GUARDAR INTERACCIÓN en BD (ciclo: pregunta → responde → GUARDA DATO)
    const accionTomada = esReclamo
      ? 'Reclamo detectado — recomendado derivar a administrador'
      : intencion === 'PEDIDO'
      ? `Solicitud de acción detectada: ${intencion}`
      : `Consulta respondida automáticamente (${logsRecientes.length} logs analizados)`;

    const interaccion = AgentInteractionModel.create({
      usuario_id: userId,
      agente_tipo: 'CLIENTE',
      mensaje_usuario: message,
      respuesta_ia: reply,
      intencion,
      accion_tomada: accionTomada,
      datos_contexto: {
        logs_analizados: logsRecientes.length,
        stats_usuario: stats,
      },
      resuelto: !esReclamo,
    });

    // 7. Retornar respuesta + metadata del ciclo completado
    sendSuccess(res, {
      reply,
      meta: {
        intencion_detectada: intencion,
        logs_analizados: logsRecientes.length,
        interaccion_guardada: interaccion.id,
        resuelto: !esReclamo,
        // Si es reclamo, notificar al frontend para derivar a humano
        ...(esReclamo && {
          alerta: '⚠️ Reclamo detectado. El administrador será notificado.',
          derivar_humano: true,
        }),
      },
    });
  } catch (error) {
    console.error('[NeonTrainer Chat Error]:', error);
    return sendError(res, 'Error al conectar con el agente NeonTrainer. Intenta más tarde.', 500);
  }
}

// ─── Agente Conversacional Admin (NEXUS) ─────────────────────

/**
 * POST /api/ai/admin-chat
 * Agente NEXUS: Analiza métricas globales del gimnasio.
 * Ciclo completo: recibe mensaje → consulta métricas BD → responde con Gemini → GUARDA interacción.
 * Solo accesible por ADMIN.
 */
export async function postAdminChat(req, res) {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return sendError(res, 'El mensaje es requerido.', 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendError(res, 'La clave de API de Gemini no está configurada en el backend.', 500);
  }

  // 1. Detectar intención del mensaje admin
  const intencion = detectarIntencion(message);

  try {
    // 2. Recopilar datos globales del negocio en paralelo (3 fuentes)
    const [retentionData, peakHoursData, engagementData] = await Promise.all([
      AIService.getRetentionMetrics({ umbralDias: 10 }),
      AIService.getPeakHoursMetrics(),
      AIService.getEngagementMetrics(),
    ]);

    // 3. Formatear contexto de negocio estructurado para el prompt
    const retentionSummary = `RETENCIÓN Y CHURN (umbral: 10 días sin actividad):
- Total usuarios: ${retentionData.resumen?.total_usuarios ?? 'N/A'}
- Activos: ${retentionData.resumen?.activos ?? 'N/A'}
- En riesgo: ${retentionData.resumen?.en_riesgo ?? 'N/A'}
- Abandonados: ${retentionData.resumen?.abandonados ?? 'N/A'}
- Tasa de retención: ${retentionData.resumen?.tasa_retencion_pct ?? 'N/A'}%
- Tasa de churn: ${retentionData.resumen?.tasa_churn_pct ?? 'N/A'}%
- Usuarios en riesgo: ${(retentionData.usuarios_en_riesgo ?? []).map(u => `${u.nombre} (${u.dias_inactivo} días inactivo)`).join(', ') || 'Ninguno'}
- Recomendaciones del sistema: ${(retentionData.recomendaciones ?? []).join(' | ')}`;

    const peakSummary = `HORAS PICO DE USO:
- Hora pico absoluta: ${peakHoursData.hora_pico?.hora ?? 'N/A'}:00 (${peakHoursData.hora_pico?.pct_del_total ?? 0}% del uso total)
- Top 3 horas más activas: ${(peakHoursData.top_3_horas ?? []).map(h => `${h.hora}:00 (${h.registros} registros)`).join(', ') || 'Sin datos'}
- Madrugada 0-6h: ${peakHoursData.franjas?.madrugada_0_6 ?? 0} registros
- Mañana 6-12h: ${peakHoursData.franjas?.manana_6_12 ?? 0} registros
- Tarde 12-18h: ${peakHoursData.franjas?.tarde_12_18 ?? 0} registros
- Noche 18-24h: ${peakHoursData.franjas?.noche_18_24 ?? 0} registros
- Días con mayor actividad: ${(peakHoursData.patron_semanal ?? []).filter(d => d.es_pico).map(d => d.dia).join(', ') || 'Sin datos suficientes'}`;

    const engagementSummary = `ÍNDICE DE ENGAGEMENT:
- Score promedio grupal: ${engagementData.engagement_grupal?.score_promedio ?? 0}/100
- Clasificación grupal: ${engagementData.engagement_grupal?.clasificacion ?? 'N/A'}
- Total usuarios evaluados: ${engagementData.engagement_grupal?.total_evaluados ?? 0}
- Excepcionales (80-100): ${engagementData.distribucion?.excepcional_80_100 ?? 0} usuarios
- Alto compromiso (60-79): ${engagementData.distribucion?.alto_60_80 ?? 0} usuarios
- Compromiso medio (40-59): ${engagementData.distribucion?.medio_40_60 ?? 0} usuarios
- Bajo compromiso (0-39): ${engagementData.distribucion?.bajo_0_40 ?? 0} usuarios
- Top 5 usuarios: ${(engagementData.ranking_usuarios ?? []).slice(0, 5).map(u => `${u.nombre} (${u.score}pts)`).join(', ') || 'Sin datos'}
- Recomendaciones: ${(engagementData.recomendaciones ?? []).join(' | ')}`;

    // 4. Construir system prompt NEXUS (formato PDF)
    const systemPrompt = SYSTEM_PROMPT_NEXUS_ADMIN(retentionSummary, peakSummary, engagementSummary);

    // 5. Llamar a Gemini 2.5 Flash (IA de apoyo)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
    });

    const chat = model.startChat();
    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    // 6. GUARDAR INTERACCIÓN en BD (ciclo: pregunta → responde → GUARDA DATO)
    const churnPct = retentionData.resumen?.tasa_churn_pct ?? 0;
    const hayAlerta = churnPct > 15;

    const interaccion = AgentInteractionModel.create({
      usuario_id: null, // Admin sin usuario específico
      agente_tipo: 'ADMIN',
      mensaje_usuario: message,
      respuesta_ia: reply,
      intencion,
      accion_tomada: hayAlerta
        ? `🚨 ALERTA: Churn ${churnPct}% > 15% — Análisis de negocio ejecutado`
        : `Análisis de negocio ejecutado (retención: ${retentionData.resumen?.tasa_retencion_pct ?? 0}%)`,
      datos_contexto: {
        churn_pct: churnPct,
        retencion_pct: retentionData.resumen?.tasa_retencion_pct ?? 0,
        total_usuarios: retentionData.resumen?.total_usuarios ?? 0,
        engagement_score: engagementData.engagement_grupal?.score_promedio ?? 0,
      },
      resuelto: true,
    });

    // 7. Retornar respuesta + metadata del ciclo completado
    sendSuccess(res, {
      reply,
      meta: {
        intencion_detectada: intencion,
        interaccion_guardada: interaccion.id,
        alerta_churn: hayAlerta,
        ...(hayAlerta && {
          alerta: `🚨 Churn actual: ${churnPct}% — Acción urgente recomendada`,
        }),
      },
    });
  } catch (error) {
    console.error('[NEXUS Admin Chat Error]:', error);
    return sendError(res, 'Error al conectar con el agente NEXUS. Intenta más tarde.', 500);
  }
}
