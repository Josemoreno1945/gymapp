// ============================================================
// DB Seeder — Populates SQLite with sample data for dev/testing
// ============================================================

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { getDatabase, closeDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { parseFormatoRaw } from '../schemas/training.schema.js';

async function seed() {
  const db = getDatabase();
  logger.info('Starting database seed...');

  try {
    // 1. Clear existing data
    db.exec('DELETE FROM logs_entrenamiento');
    db.exec('DELETE FROM sesiones_uso');
    db.exec('DELETE FROM usuarios');
    logger.info('Cleared existing data.');

    // 2. Insert Users
    const hashedAdminPw = await bcrypt.hash('admin123', 10);
    const hashedUserPw = await bcrypt.hash('user123', 10);

    const insertUser = db.prepare(`
      INSERT INTO usuarios (nombre, email, password, rol, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Creates an ADMIN and 2 USERs with different registration dates
    const adminId = insertUser.run('Admin', 'admin@neonbench.local', hashedAdminPw, 'ADMIN', dateOffset(-30)).lastInsertRowid;
    const user1Id = insertUser.run('Usuario Activo', 'activo@neonbench.local', hashedUserPw, 'USER', dateOffset(-60)).lastInsertRowid;
    const user2Id = insertUser.run('Usuario Churn', 'churn@neonbench.local', hashedUserPw, 'USER', dateOffset(-90)).lastInsertRowid;

    logger.success(`Inserted users: Admin(${adminId}), Activo(${user1Id}), Churn(${user2Id})`);

    // 3. Insert Logs for 'Usuario Activo' (Engagement & Peak Hours data)
    const insertLog = db.prepare(`
      INSERT INTO logs_entrenamiento 
        (usuario_id, ejercicio, formato_raw, series, repeticiones, peso, unidad, volumen, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const logsActivo = [
      { ej: 'Press Banca', raw: '4x10@80kg', date: dateOffset(-14, 18) }, // 14 days ago, 18:00
      { ej: 'Sentadilla', raw: '3x12@100kg', date: dateOffset(-14, 18) },
      { ej: 'Dominadas', raw: '4x8@0kg', date: dateOffset(-12, 19) },     // 12 days ago, 19:00
      { ej: 'Press Militar', raw: '3x10@40kg', date: dateOffset(-10, 7) },  // 10 days ago, 07:00 (Morning)
      { ej: 'Peso Muerto', raw: '3x5@120kg', date: dateOffset(-7, 18) },    // 7 days ago, 18:00
      { ej: 'Press Banca', raw: '4x10@85kg', date: dateOffset(-3, 19) },    // 3 days ago, 19:00 (Progression)
      { ej: 'Remo', raw: '4x10@60kg', date: dateOffset(-1, 18) },         // 1 day ago, 18:00
    ];

    for (const log of logsActivo) {
      const { series, repeticiones, peso, unidad, volumen } = parseFormatoRaw(log.raw);
      insertLog.run(user1Id, log.ej, log.raw, series, repeticiones, peso, unidad, volumen, log.date);
    }

    // 4. Insert Logs for 'Usuario Churn' (Stopped 45 days ago)
    const logsChurn = [
      { ej: 'Press Banca', raw: '3x10@60kg', date: dateOffset(-60, 17) },
      { ej: 'Sentadilla', raw: '3x10@80kg', date: dateOffset(-55, 17) },
      { ej: 'Press Banca', raw: '3x10@60kg', date: dateOffset(-45, 17) }, // Last log 45 days ago
    ];

    for (const log of logsChurn) {
      const { series, repeticiones, peso, unidad, volumen } = parseFormatoRaw(log.raw);
      insertLog.run(user2Id, log.ej, log.raw, series, repeticiones, peso, unidad, volumen, log.date);
    }
    
    logger.success(`Inserted ${logsActivo.length + logsChurn.length} training logs.`);

    // 5. Insert Sessions
    const insertSession = db.prepare(`
      INSERT INTO sesiones_uso (usuario_id, inicio, fin, duracion_min, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    insertSession.run(user1Id, dateOffset(-1, 18), dateOffset(-1, 19), 60, '127.0.0.1', 'Mozilla/5.0');
    insertSession.run(user2Id, dateOffset(-45, 17), dateOffset(-45, 17, 45), 45, '192.168.1.10', 'Mozilla/5.0');

    logger.success('Inserted sample sessions.');
    logger.success('Seed completed successfully!');

  } catch (error) {
    logger.error('Seed failed:', error);
  } finally {
    closeDatabase();
  }
}

/**
 * Utility to generate a SQLite datetime string offset by days and specific hour.
 */
function dateOffset(days, hour = 12, minutes = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minutes, 0, 0);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

seed();
