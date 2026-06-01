// ============================================================
// User Model — Data access layer for 'usuarios' table
// ============================================================

import { getDatabase } from '../config/database.js';

const UserModel = {
  /**
   * Find a user by ID.
   * @param {number} id
   * @returns {object|undefined}
   */
  findById(id) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
  },

  /**
   * Find a user by email.
   * @param {string} email
   * @returns {object|undefined}
   */
  findByEmail(email) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  },

  /**
   * Get all users (admin view). Excludes password hash.
   * @param {{ limit?: number, offset?: number, rol?: string }} options
   * @returns {object[]}
   */
  findAll({ limit = 50, offset = 0, rol } = {}) {
    const db = getDatabase();
    let query = 'SELECT id, nombre, email, rol, activo, created_at, updated_at FROM usuarios';
    const params = [];

    if (rol) {
      query += ' WHERE rol = ?';
      params.push(rol);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  },

  /**
   * Count total users, optionally filtered by rol.
   * @param {{ rol?: string }} options
   * @returns {number}
   */
  count({ rol } = {}) {
    const db = getDatabase();
    if (rol) {
      return db.prepare('SELECT COUNT(*) as total FROM usuarios WHERE rol = ?').get(rol).total;
    }
    return db.prepare('SELECT COUNT(*) as total FROM usuarios').get().total;
  },

  /**
   * Create a new user.
   * @param {{ nombre: string, email: string, password: string, rol?: string }} data
   * @returns {{ id: number }}
   */
  create({ nombre, email, password, rol = 'USER' }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO usuarios (nombre, email, password, rol)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(nombre, email, password, rol);
    return { id: result.lastInsertRowid };
  },

  /**
   * Update a user's fields.
   * @param {number} id
   * @param {object} fields - Partial fields to update
   * @returns {{ changes: number }}
   */
  update(id, fields) {
    const db = getDatabase();
    const allowed = ['nombre', 'email', 'rol', 'activo'];
    const entries = Object.entries(fields).filter(([key]) => allowed.includes(key));

    if (entries.length === 0) return { changes: 0 };

    const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([, val]) => val);

    const stmt = db.prepare(`
      UPDATE usuarios SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    const result = stmt.run(...values, id);
    return { changes: result.changes };
  },

  /**
   * Soft-delete (deactivate) a user.
   * @param {number} id
   * @returns {{ changes: number }}
   */
  deactivate(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE usuarios SET activo = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    return { changes: stmt.run(id).changes };
  },

  /**
   * Hard-delete a user (cascade deletes logs and sessions).
   * @param {number} id
   * @returns {{ changes: number }}
   */
  delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?');
    return { changes: stmt.run(id).changes };
  },
};

export default UserModel;
