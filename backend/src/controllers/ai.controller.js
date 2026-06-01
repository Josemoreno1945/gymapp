// ============================================================
// AI Controller — Business Metrics Endpoints
// ============================================================

import AIService from '../services/ai.service.js';
import { sendSuccess, sendError } from '../utils/helpers.js';
import TrainingLogModel from '../models/trainingLog.model.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  sendSuccess(res, {
    prompts: AIService.getSystemPrompts(),
  });
}

/**
 * POST /api/ai/chat
 * Client Agent: Chat with AI using SQLite data context.
 */
export async function postChat(req, res) {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message) {
    return sendError(res, 'El mensaje es requerido.', 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendError(res, 'La clave de API de Gemini no está configurada en el backend.', 500);
  }

  try {
    // 1. Extraer historial y contexto (últimos 50 logs)
    const logsRecientes = TrainingLogModel.findByUsuario(userId, { limit: 50 });
    const stats = TrainingLogModel.getStatsByUsuario(userId);

    // 2. Construir System Prompt Dinámico estructurado
    const logsFormat = logsRecientes.length > 0 
      ? logsRecientes.map(l => `- ${l.created_at || 'Fecha Desconocida'} | ${l.ejercicio}: ${l.formato_raw}`).join('\n')
      : "No hay registros de entrenamiento aún.";

    const systemPrompt = `
Eres un analista de datos deportivos y entrenador personal virtual experto en hipertrofia y fuerza.
Tu tarea es responder preguntas del usuario basadas ESTRICTAMENTE en su historial de entrenamiento provisto a continuación.

DATOS DE ENTRENAMIENTO DEL USUARIO:
Estadísticas Generales:
- Volumen Total: ${stats.volumen_total} kg
- Entrenamientos Totales: ${stats.total_logs}
- Peso Máximo Levantado: ${stats.peso_maximo} kg

Últimos Registros de Entrenamiento:
${logsFormat}

INSTRUCCIONES:
1. Responde de forma amigable, motivadora y con una estética que evoque un ambiente "cyberpunk" o "retro-futurista".
2. NO inventes datos. Si el usuario pregunta algo que no está en el registro provisto, indícale que no tienes registro de ello.
3. Detecta progresos (PRs, aumento de volumen) o estancamientos si la pregunta lo amerita.
4. Explica el formato (series x repeticiones @ peso).
5. Mantén tus respuestas concisas (máximo 2-3 párrafos cortos). Formatea usando Markdown.
    `.trim();

    // 3. Llamar a Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configurar systemInstruction correctamente en el modelo (no en startChat) y como objeto Content
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // <-- Regresado a gemini-2.5-flash
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }]
      }
    });

    // Iniciar chat para mantener el contexto
    const chat = model.startChat();

    const result = await chat.sendMessage(message);
    const text = result.response.text();

    sendSuccess(res, {
      reply: text
    });
  } catch (error) {
    console.error('[AI Chat Error]:', error);
    return sendError(res, 'Error al conectar con la inteligencia artificial. Intenta más tarde.', 500);
  }
}

/**
 * POST /api/ai/admin-chat
 * Admin Agent: Chat with AI using global gym business metrics as context.
 * Only accessible by ADMIN role.
 */
export async function postAdminChat(req, res) {
  const { message } = req.body;

  if (!message) {
    return sendError(res, 'El mensaje es requerido.', 400);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendError(res, 'La clave de API de Gemini no está configurada en el backend.', 500);
  }

  try {
    // 1. Recopilar datos globales del negocio en paralelo
    const [retentionData, peakHoursData, engagementData] = await Promise.all([
      AIService.getRetentionMetrics({ umbralDias: 10 }),
      AIService.getPeakHoursMetrics(),
      AIService.getEngagementMetrics(),
    ]);

    // 2. Formatear contexto de negocio en texto plano estructurado
    const retentionSummary = `RETENCIÓN Y CHURN (umbral: 10 días sin actividad):
- Total usuarios: ${retentionData.resumen?.total_usuarios ?? 'N/A'}
- Activos: ${retentionData.resumen?.activos ?? 'N/A'}
- En riesgo: ${retentionData.resumen?.en_riesgo ?? 'N/A'}
- Abandonados: ${retentionData.resumen?.abandonados ?? 'N/A'}
- Tasa de retención: ${retentionData.resumen?.tasa_retencion_pct ?? 'N/A'}%
- Tasa de churn: ${retentionData.resumen?.tasa_churn_pct ?? 'N/A'}%
- Usuarios en riesgo: ${(retentionData.usuarios_en_riesgo ?? []).map(u => `${u.nombre} (${u.dias_inactivo} días inactivo)`).join(', ') || 'Ninguno'}
- Recomendaciones: ${(retentionData.recomendaciones ?? []).join(' | ')}`;

    const peakSummary = `HORAS PICO DE USO:
- Hora pico absoluta: ${peakHoursData.hora_pico?.hora ?? 'N/A'}:00 (${peakHoursData.hora_pico?.pct_del_total ?? 0}% del uso)
- Top 3 horas: ${(peakHoursData.top_3_horas ?? []).map(h => `${h.hora}:00 (${h.registros} registros)`).join(', ')}
- Madrugada 0-6h: ${peakHoursData.franjas?.madrugada_0_6 ?? 0} registros
- Mañana 6-12h: ${peakHoursData.franjas?.manana_6_12 ?? 0} registros
- Tarde 12-18h: ${peakHoursData.franjas?.tarde_12_18 ?? 0} registros
- Noche 18-24h: ${peakHoursData.franjas?.noche_18_24 ?? 0} registros
- Días pico: ${(peakHoursData.patron_semanal ?? []).filter(d => d.es_pico).map(d => d.dia).join(', ') || 'Sin datos suficientes'}
- Recomendaciones: ${(peakHoursData.recomendaciones ?? []).join(' | ')}`;

    const engagementSummary = `ÍNDICE DE ENGAGEMENT:
- Score promedio grupal: ${engagementData.engagement_grupal?.score_promedio ?? 0}/100
- Clasificación: ${engagementData.engagement_grupal?.clasificacion ?? 'N/A'}
- Total evaluados: ${engagementData.engagement_grupal?.total_evaluados ?? 0}
- Excepcionales (80-100): ${engagementData.distribucion?.excepcional_80_100 ?? 0} usuarios
- Alto (60-79): ${engagementData.distribucion?.alto_60_80 ?? 0} usuarios
- Medio (40-59): ${engagementData.distribucion?.medio_40_60 ?? 0} usuarios
- Bajo (0-39): ${engagementData.distribucion?.bajo_0_40 ?? 0} usuarios
- Top usuarios: ${(engagementData.ranking_usuarios ?? []).slice(0, 5).map(u => `${u.nombre} (score: ${u.score})`).join(', ') || 'Sin datos'}
- Recomendaciones: ${(engagementData.recomendaciones ?? []).join(' | ')}`;

    // 3. Construir System Prompt de Administrador
    const systemPrompt = `Eres NEXUS, un agente de inteligencia artificial especializado en análisis de negocio para gimnasios. Eres el asistente exclusivo del administrador/dueño del gimnasio NeonBench.
Tu misión: analizar los datos del negocio, identificar oportunidades y alertas, y responder preguntas estratégicas.

DATOS ACTUALES DEL NEGOCIO (en tiempo real desde la base de datos):

${retentionSummary}

${peakSummary}

${engagementSummary}

REGLAS DE COMPORTAMIENTO:
1. Basa tus respuestas SIEMPRE en los datos reales de arriba. No inventes cifras.
2. Tono profesional y directo. Eres un analista de datos de élite.
3. Formatea con Markdown: **negrita**, listas y emojis estratégicamente.
4. Respuestas concisas: máximo 3-4 párrafos o una lista corta.
5. Si detectas riesgo de churn > 15%, ALERTA con 🚨 urgencia.
6. Si no hay suficientes datos para una respuesta, dilo y sugiere qué registrar.`;

    // 4. Llamar a Gemini
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
    const text = result.response.text();

    sendSuccess(res, { reply: text });
  } catch (error) {
    console.error('[Admin AI Chat Error]:', error);
    return sendError(res, 'Error al conectar con el agente NEXUS. Intenta más tarde.', 500);
  }
}
