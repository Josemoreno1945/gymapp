// ============================================================
// Auth Controller — Register, Login, Logout
// ============================================================

import bcrypt from 'bcryptjs';
import UserModel from '../models/user.model.js';
import SessionModel from '../models/session.model.js';
import { generateToken } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/helpers.js';

const SALT_ROUNDS = 12;

/**
 * POST /api/auth/register
 */
export async function register(req, res) {
  const { nombre, email, password, rol } = req.validatedBody;

  // Check if email already exists
  const existing = UserModel.findByEmail(email);
  if (existing) {
    return sendError(res, 'El email ya está registrado.', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const { id } = UserModel.create({
    nombre,
    email,
    password: hashedPassword,
    rol,
  });

  const user = UserModel.findById(id);
  const token = generateToken(user);

  // Create session
  const session = SessionModel.create({
    usuario_id: id,
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
  });

  sendSuccess(res, {
    mensaje: 'Usuario registrado exitosamente',
    token,
    session_id: session.id,
    usuario: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
  }, 201);
}

/**
 * POST /api/auth/login
 */
export async function login(req, res) {
  const { email, password } = req.validatedBody;

  // Find user
  const user = UserModel.findByEmail(email);
  if (!user) {
    return sendError(res, 'Credenciales inválidas.', 401);
  }

  if (!user.activo) {
    return sendError(res, 'Cuenta desactivada. Contacte al administrador.', 403);
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return sendError(res, 'Credenciales inválidas.', 401);
  }

  // Generate JWT
  const token = generateToken(user);

  // Close any existing open sessions and create a new one
  SessionModel.closeAllForUser(user.id);
  const session = SessionModel.create({
    usuario_id: user.id,
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
  });

  sendSuccess(res, {
    mensaje: 'Login exitoso',
    token,
    session_id: session.id,
    usuario: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
    },
  });
}

/**
 * POST /api/auth/logout
 */
export function logout(req, res) {
  const sessionId = req.body.session_id;

  if (sessionId) {
    SessionModel.close(sessionId);
  } else {
    // Close all open sessions for this user
    SessionModel.closeAllForUser(req.user.id);
  }

  sendSuccess(res, { mensaje: 'Sesión cerrada exitosamente' });
}

/**
 * GET /api/auth/me — Get current user info
 */
export function me(req, res) {
  sendSuccess(res, { usuario: req.user });
}
