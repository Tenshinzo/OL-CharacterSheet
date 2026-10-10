import { buildApp } from './app.js';
import { migrate, query, one, closeDb } from './db.js';
import { config } from './config.js';
import { uuid } from './lib/crypto.js';

const app = await buildApp();

async function ensureAdmin() {
  if (!config.adminEmail) return;
  const u = await one('SELECT id, role FROM users WHERE email = ?', [config.adminEmail]);
  if (u) {
    if (u.role !== 'admin') { await query("UPDATE users SET role = 'admin' WHERE id = ?", [u.id]); app.log.info(`promoted ${config.adminEmail} to admin`); }
    return;
  }
  // Create a passwordless, pre-verified admin. They set a password via the
  // "forgot password" flow (or `npm run admin:reset-password`).
  await query(
    "INSERT INTO users (id, email, email_verified_at, display_name, role) VALUES (?, ?, NOW(), ?, 'admin')",
    [uuid(), config.adminEmail, config.adminEmail.split('@')[0]],
  );
  app.log.info(`created admin account ${config.adminEmail} (no password yet: use password reset)`);
}

async function cleanupExpired() {
  await query('DELETE FROM sessions WHERE expires_at < NOW()').catch(() => {});
  await query('DELETE FROM email_tokens WHERE expires_at < NOW() - INTERVAL 1 DAY').catch(() => {});
}

try {
  await migrate(app.log);
  await ensureAdmin();
  await cleanupExpired();
  setInterval(cleanupExpired, 6 * 3600 * 1000).unref();
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  await closeDb();
  process.exit(1);
}

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    app.log.info(`${sig} received, shutting down`);
    await app.close();
    await closeDb();
    process.exit(0);
  });
}
