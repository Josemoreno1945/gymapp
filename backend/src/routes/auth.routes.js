// ============================================================
// Auth Routes
// ============================================================

import { Router } from 'express';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));

// Protected routes
router.post('/logout', authenticate, asyncHandler(logout));
router.get('/me', authenticate, me);

export default router;
