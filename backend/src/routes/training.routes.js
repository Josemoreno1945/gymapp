// ============================================================
// Training Routes
// ============================================================

import { Router } from 'express';
import { getLogs, createLog, deleteLog, getStats } from '../controllers/training.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { trainingLogSchema } from '../schemas/training.schema.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// All training routes require authentication
router.use(authenticate);

router.get('/logs', asyncHandler(getLogs));
router.post('/logs', validate(trainingLogSchema), asyncHandler(createLog));
router.delete('/logs/:id', asyncHandler(deleteLog));

router.get('/stats', asyncHandler(getStats));

export default router;
