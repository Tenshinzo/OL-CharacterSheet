import { badRequest } from './errors.js';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normEmail(email) {
  if (typeof email !== 'string') throw badRequest('Email is required', 'EMAIL_INVALID');
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e) || e.length > 255) throw badRequest('Email address is invalid', 'EMAIL_INVALID');
  return e;
}

export function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length < 8) throw badRequest('Password must be at least 8 characters', 'PASSWORD_WEAK');
  if (pw.length > 200) throw badRequest('Password is too long', 'PASSWORD_WEAK');
  return pw;
}

export function checkDisplayName(name) {
  if (typeof name !== 'string') throw badRequest('Display name is required', 'NAME_INVALID');
  const n = name.trim();
  if (n.length < 2 || n.length > 100) throw badRequest('Display name must be 2-100 characters', 'NAME_INVALID');
  return n;
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
export function checkId(id, what = 'id') {
  if (typeof id !== 'string' || !ID_RE.test(id)) throw badRequest(`Invalid ${what}`, 'ID_INVALID');
  return id;
}

/**
 * Validate a character object coming from the client. We accept the full
 * client shape (it is the client's domain) but enforce the invariants the
 * server relies on and a size cap.
 */
export const MAX_CHARACTER_BYTES = 1_000_000;
export function checkCharacter(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw badRequest('Character must be an object', 'CHARACTER_INVALID');
  checkId(data.id, 'character id');
  if (typeof data.name !== 'string' || !data.name.trim()) throw badRequest('Character name is required', 'CHARACTER_INVALID');
  if (data.name.length > 200) throw badRequest('Character name is too long', 'CHARACTER_INVALID');
  const size = Buffer.byteLength(JSON.stringify(data));
  if (size > MAX_CHARACTER_BYTES) throw badRequest('Character data is too large', 'CHARACTER_TOO_LARGE');
  return data;
}

export function characterKind(data) {
  if (data.isAlternateForm) return 'alternate_form';
  if (data.isCompanion) return 'companion';
  return 'primary';
}

/** The primary character this one hangs off, or null. */
export function characterPrimaryId(data) {
  if (data.isAlternateForm && data.primaryCharacterId) return String(data.primaryCharacterId);
  if (data.isCompanion && data.parentCharacterId) return String(data.parentCharacterId);
  return null;
}
