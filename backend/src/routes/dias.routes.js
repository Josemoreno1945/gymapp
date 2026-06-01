// ============================================================
// Dias Routes
// ============================================================

import { Router } from 'express';
import {
  getDias, createDia, updateDia, deleteDia,
  getDiaEjercicios, createDiaEjercicio, updateDiaEjercicio, deleteDiaEjercicio
} from '../controllers/dias.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { createDiaSchema, updateDiaSchema, createDiaEjercicioSchema, updateDiaEjercicioSchema } from '../schemas/dias.schema.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// All dia routes require authentication
router.use(authenticate);

// Days within a week
router.get('/semanas/:semanaId/dias', asyncHandler(getDias));
router.post('/semanas/:semanaId/dias', validate(createDiaSchema), asyncHandler(createDia));

// Day CRUD
router.put('/dias/:id', validate(updateDiaSchema), asyncHandler(updateDia));
router.delete('/dias/:id', asyncHandler(deleteDia));

// Day-Exercise assignments
router.get('/dias/:id/ejercicios', asyncHandler(getDiaEjercicios));
router.post('/dias/:id/ejercicios', validate(createDiaEjercicioSchema), asyncHandler(createDiaEjercicio));
router.put('/dia-ejercicios/:id', validate(updateDiaEjercicioSchema), asyncHandler(updateDiaEjercicio));
router.delete('/dia-ejercicios/:id', asyncHandler(deleteDiaEjercicio));

export default router;
