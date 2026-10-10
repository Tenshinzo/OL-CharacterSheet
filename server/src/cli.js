// Admin CLI: node src/cli.js <promote|invite|reset-password> [args]
import { query, one, closeDb, migrate } from './db.js';
import { shortCode, hashPassword } from './lib/crypto.js';
import { uuid } from './lib/crypto.js';

const [cmd, ...args] = process.argv.slice(2);

async function main() {
  await migrate({ info() {}, log() {} });
  switch (cmd) {
    case 'promote': {
      const email = (args[0] || '').toLowerCase();
      if (!email) throw new Error('usage: promote <email>');
      const u = await one('SELECT id FROM users WHERE email = ?', [email]);
      if (!u) {
        await query("INSERT INTO users (id, email, email_verified_at, display_name, role) VALUES (?, ?, NOW(), ?, 'admin')", [uuid(), email, email.split('@')[0]]);
        console.log(`created admin ${email}`);
      } else {
        await query("UPDATE users SET role = 'admin' WHERE id = ?", [u.id]);
        console.log(`promoted ${email}`);
      }
      break;
    }
    case 'invite': {
      const n = Number(args[0] || 1);
      for (let i = 0; i < n; i++) {
        const code = shortCode(10);
        await query('INSERT INTO invites (code, note) VALUES (?, ?)', [code, 'cli']);
        console.log(code);
      }
      break;
    }
    case 'reset-password': {
      const [email, password] = args;
      if (!email || !password) throw new Error('usage: reset-password <email> <newPassword>');
      const u = await one('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
      if (!u) throw new Error('no such user');
      await query('UPDATE users SET password_hash = ?, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?', [await hashPassword(password), u.id]);
      await query('DELETE FROM sessions WHERE user_id = ?', [u.id]);
      console.log('password updated');
      break;
    }
    default:
      console.log('commands: promote <email> | invite [count] | reset-password <email> <password>');
  }
}

try { await main(); } finally { await closeDb(); }
