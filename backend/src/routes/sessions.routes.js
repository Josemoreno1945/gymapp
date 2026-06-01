// ============================================================
// Sessions Routes
// ============================================================

import { Router } from 'express';
import { getAllSessions, getSessionStats, getUserSessions } from '../controllers/sessions.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// All session routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/', asyncHandler(getAllSessions));
router.get('/stats', asyncHandler(getSessionStats));
router.get('/user/:userId', asyncHandler(getUserSessions));

export default router;
