import mysql from 'mysql2/promise';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';

const here = dirname(fileURLToPath(import.meta.url));

export const pool = mysql.createPool({
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  charset: 'utf8mb4_unicode_ci',
  timezone: 'Z',
  dateStrings: false,
  multipleStatements: false,
  // mysql2 returns JSON columns already parsed; keep that but make sure
  // BIGINTs do not become strings unexpectedly.
  supportBigNumbers: true,
});

/** Run a query and return rows. */
export async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** Run a query and return the first row or null. */
export async function one(sql, params) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/** Run fn inside a transaction with a dedicated connection. */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn({
      query: async (sql, params) => (await conn.query(sql, params))[0],
      one: async (sql, params) => ((await conn.query(sql, params))[0])[0] ?? null,
    });
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Apply pending SQL files from ../migrations in name order. */
export async function migrate(log = console) {
  await query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name VARCHAR(255) NOT NULL PRIMARY KEY,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  const applied = new Set((await query('SELECT name FROM schema_migrations')).map((r) => r.name));
  const dir = resolve(here, '..', 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(resolve(dir, file), 'utf8');
    const withoutComments = sql.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
    const statements = withoutComments.split(/;\s*(?:\n|$)/).map((s) => s.trim()).filter(Boolean);
    const conn = await pool.getConnection();
    try {
      for (const stmt of statements) await conn.query(stmt);
      await conn.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      (typeof log.info === 'function' ? log.info : console.log).call(log, `migration applied: ${file}`);
    } finally {
      conn.release();
    }
  }
}

export async function closeDb() {
  await pool.end();
}
