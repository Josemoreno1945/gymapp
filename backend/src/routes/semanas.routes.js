// ============================================================
// Semanas Routes
// ============================================================

import { Router } from 'express';
import { getSemanas, createSemana, updateSemana, deleteSemana } from '../controllers/semanas.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createSemanaSchema, updateSemanaSchema } from '../schemas/semanas.schema.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// All semana routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(getSemanas));
router.post('/', validate(createSemanaSchema), asyncHandler(createSemana));
router.put('/:id', validate(updateSemanaSchema), asyncHandler(updateSemana));
router.delete('/:id', asyncHandler(deleteSemana));

export default router;
