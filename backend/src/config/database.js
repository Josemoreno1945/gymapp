// ============================================================
// Database Configuration — better-sqlite3 (ES Modules)
// Initializes SQLite, enables WAL mode, runs schema
// ============================================================

import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH || './neonbench.db';

let db = null;

/**
 * Returns the singleton database instance.
 * Initializes connection and schema on first call.
 */
export function getDatabase() {
  if (db) return db;

  db = new DatabaseSync(DB_PATH);

  // ─── Performance pragmas ──────────────────────────────────
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA cache_size = -20000'); // 20MB cache

  // ─── Run schema ───────────────────────────────────────────
  const schemaPath = resolve(__dirname, '..', 'db', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  console.log('[DB] SQLite initialized successfully');
  console.log(`[DB] Path: ${DB_PATH}`);

  return db;
}

/**
 * Gracefully close the database connection.
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Connection closed');
  }
}

export default getDatabase;
