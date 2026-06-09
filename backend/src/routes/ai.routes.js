// ============================================================
// AI Routes — Agentes IA NeonBench Gym
// Implementa el ciclo completo del PDF:
// pregunta → responde → guarda dato → notifica
// ============================================================

import { Router } from 'express';
import {
  getRetention,
  getPeakHours,
  getEngagement,
  getEngagementByUser,
  getPrompts,
  getInteractions,
  postChat,
  postAdminChat,
} from '../controllers/ai.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// Apply authentication to all AI routes
router.use(authenticate);

// ─── ADMIN Only: Métricas de negocio (Agente NEXUS) ───────────────────────────
router.get('/retention',            authorize('ADMIN'), asyncHandler(getRetention));
router.get('/peak-hours',           authorize('ADMIN'), asyncHandler(getPeakHours));
router.get('/engagement',           authorize('ADMIN'), asyncHandler(getEngagement));
router.get('/engagement/:userId',   authorize('ADMIN'), asyncHandler(getEngagementByUser));
router.get('/prompts',              authorize('ADMIN'), getPrompts);

// ─── ADMIN Only: Historial de interacciones guardadas ─────────────────────────
// Demuestra el ciclo completo: el agente GUARDÓ el dato
router.get('/interactions',         authorize('ADMIN'), asyncHandler(getInteractions));

// ─── ADMIN Only: Chat con NEXUS (Agente analítico de negocio) ────────────────
router.post('/admin-chat',          authorize('ADMIN'), asyncHandler(postAdminChat));

// ─── USER + ADMIN: Chat con NeonTrainer (Agente de entrenamiento) ────────────
router.post('/chat',                authorize('USER', 'ADMIN'), asyncHandler(postChat));

export default router;
