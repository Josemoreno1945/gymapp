// ============================================================
// Ejercicios Routes
// ============================================================

import { Router } from 'express';
import { getEjercicios, createEjercicio, updateEjercicio, deleteEjercicio, getProgreso } from '../controllers/ejercicios.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createEjercicioSchema, updateEjercicioSchema } from '../schemas/ejercicios.schema.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// All ejercicio routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(getEjercicios));
router.get('/:id/progreso', asyncHandler(getProgreso));
router.post('/', validate(createEjercicioSchema), asyncHandler(createEjercicio));
router.put('/:id', validate(updateEjercicioSchema), asyncHandler(updateEjercicio));
router.delete('/:id', asyncHandler(deleteEjercicio));

export default router;
