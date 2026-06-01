// ============================================================
// Users Controller — User management (Admin)
// ============================================================

import UserModel from '../models/user.model.js';
import { sendSuccess, sendError, parsePagination } from '../utils/helpers.js';

/**
 * GET /api/users
 * Returns all users (admin view). Excludes password hashes.
 */
export function getAllUsers(req, res) {
  const { limit, offset, page } = parsePagination(req.query);
  const rol = req.query.rol || undefined;

  const users = UserModel.findAll({ limit, offset, rol });
  const total = UserModel.count({ rol });

  sendSuccess(res, {
    usuarios: users,
    paginacion: {
      pagina: page,
      por_pagina: limit,
      total,
      total_paginas: Math.ceil(total / limit),
    },
  });
}

/**
 * GET /api/users/:id
 * Returns a single user by ID.
 */
export function getUserById(req, res) {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return sendError(res, 'ID de usuario inválido.', 400);
  }

  const user = UserModel.findById(userId);
  if (!user) {
    return sendError(res, 'Usuario no encontrado.', 404);
  }

  // Exclude password from response
  const { password, ...safeUser } = user;
  sendSuccess(res, { usuario: safeUser });
}

/**
 * PATCH /api/users/:id
 * Updates a user's fields (admin only).
 */
export function updateUser(req, res) {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return sendError(res, 'ID de usuario inválido.', 400);
  }

  const user = UserModel.findById(userId);
  if (!user) {
    return sendError(res, 'Usuario no encontrado.', 404);
  }

  const { changes } = UserModel.update(userId, req.validatedBody);

  if (changes === 0) {
    return sendError(res, 'No se realizaron cambios.', 400);
  }

  const updatedUser = UserModel.findById(userId);
  const { password, ...safeUser } = updatedUser;

  sendSuccess(res, {
    mensaje: 'Usuario actualizado exitosamente',
    usuario: safeUser,
  });
}

/**
 * DELETE /api/users/:id
 * Deactivates a user (soft delete).
 */
export function deleteUser(req, res) {
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    return sendError(res, 'ID de usuario inválido.', 400);
  }

  // Prevent self-deletion
  if (userId === req.user.id) {
    return sendError(res, 'No puede desactivar su propia cuenta.', 400);
  }

  const user = UserModel.findById(userId);
  if (!user) {
    return sendError(res, 'Usuario no encontrado.', 404);
  }

  UserModel.deactivate(userId);

  sendSuccess(res, { mensaje: 'Usuario desactivado exitosamente' });
}
