// ============================================================
// Auth Middleware — JWT verification + role authorization
// ============================================================

import jwt from 'jsonwebtoken';
import UserModel from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';

/**
 * Middleware: authenticate
 * Extracts and verifies JWT from Authorization header.
 * Populates req.user with the full user record (minus password).
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      ok: false,
      error: 'No autorizado. Token de acceso requerido.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = UserModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario no encontrado.',
      });
    }

    if (!user.activo) {
      return res.status(403).json({
        ok: false,
        error: 'Cuenta desactivada. Contacte al administrador.',
      });
    }

    // Attach user to request (without password)
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        error: 'Token expirado. Inicie sesión nuevamente.',
      });
    }
    return res.status(401).json({
      ok: false,
      error: 'Token inválido.',
    });
  }
}

/**
 * Middleware factory: authorize
 * Checks if the authenticated user has one of the allowed roles.
 * Must be used AFTER authenticate.
 *
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'USER')
 * @returns {import('express').RequestHandler}
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'No autenticado.',
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        ok: false,
        error: `Acceso denegado. Rol requerido: ${roles.join(' o ')}.`,
      });
    }

    next();
  };
}

/**
 * Generate a JWT for a given user.
 * @param {{ id: number, email: string, rol: string }} user
 * @returns {string}
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}
