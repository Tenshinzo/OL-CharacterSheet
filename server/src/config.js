import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// Minimal .env loader (no dependency). Real env vars win over the file.
function loadDotEnv() {
  const candidates = [resolve(here, '..', '.env'), resolve(here, '..', '..', '.env')];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    for (const raw of readFileSync(file, 'utf8').split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
    break;
  }
}
loadDotEnv();

const env = process.env;
const bool = (v, d = false) => (v === undefined || v === '' ? d : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));

export const config = {
  env: env.NODE_ENV || 'development',
  isProd: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  port: Number(env.PORT || 3000),
  host: env.HOST || '0.0.0.0',
  appUrl: (env.APP_URL || 'http://localhost:3000').replace(/\/$/, ''),
  trustProxy: bool(env.TRUST_PROXY),
  db: {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'olchar',
    password: env.DB_PASSWORD || 'olchar',
    database: env.DB_NAME || 'olchar',
  },
  secretKey: env.SECRET_KEY || 'dev-insecure-secret-key',
  mail: {
    resendApiKey: env.RESEND_API_KEY || '',
    from: env.MAIL_FROM || 'noreply@localhost',
  },
  discord: {
    clientId: env.DISCORD_CLIENT_ID || '',
    clientSecret: env.DISCORD_CLIENT_SECRET || '',
  },
  adminEmail: (env.ADMIN_EMAIL || '').trim().toLowerCase(),
  github: {
    // Fine-grained PAT with "Issues: write" on the repo; enables the in-app bug report form.
    token: env.GITHUB_ISSUES_TOKEN || '',
    repo: env.GITHUB_REPO || 'Tenshinzo/OL-CharacterSheet',
  },
  session: {
    cookieName: 'olsid',
    ttlDays: 30,
  },
  clientDir: resolve(here, '..', '..', 'client'),
};

if (config.isProd && config.secretKey === 'dev-insecure-secret-key') {
  throw new Error('SECRET_KEY must be set in production');
}
