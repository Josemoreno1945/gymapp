// ============================================================
// AI Routes (Business Metrics & Client Agent)
// ============================================================

import { Router } from 'express';
import { getRetention, getPeakHours, getEngagement, getEngagementByUser, getPrompts, postChat, postAdminChat } from '../controllers/ai.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// Apply authentication to all AI routes
router.use(authenticate);

// ─── ADMIN Only Endpoints (Business Metrics) ───────────────────
router.get('/retention', authorize('ADMIN'), asyncHandler(getRetention));
router.get('/peak-hours', authorize('ADMIN'), asyncHandler(getPeakHours));
router.get('/engagement', authorize('ADMIN'), asyncHandler(getEngagement));
router.get('/engagement/:userId', authorize('ADMIN'), asyncHandler(getEngagementByUser));
router.get('/prompts', authorize('ADMIN'), getPrompts);

// ─── Admin Chat (NEXUS Agent) ──────────────────────────────────
router.post('/admin-chat', authorize('ADMIN'), asyncHandler(postAdminChat));

// ─── Client Endpoints ──────────────────────────────────────────
// Accessible by both USER and ADMIN
router.post('/chat', authorize('USER', 'ADMIN'), asyncHandler(postChat));

export default router;
