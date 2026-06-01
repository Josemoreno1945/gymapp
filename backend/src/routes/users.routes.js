// ============================================================
// Users Routes
// ============================================================

import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/users.controller.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { updateUserSchema } from '../schemas/user.schema.js';
import { asyncHandler } from '../utils/helpers.js';

const router = Router();

// All users management routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

router.get('/', asyncHandler(getAllUsers));
router.get('/:id', asyncHandler(getUserById));
router.patch('/:id', validate(updateUserSchema), asyncHandler(updateUser));
router.delete('/:id', asyncHandler(deleteUser));

export default router;
