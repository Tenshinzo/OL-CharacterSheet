import fp from 'fastify-plugin';
import { resolveSession } from '../lib/session.js';
import { unauthorized, forbidden } from '../lib/errors.js';
import { config } from '../config.js';

/**
 * Decorates every request with `request.user` (or null) based on the session
 * cookie, and provides `app.requireAuth` / `app.requireAdmin` preHandlers.
 */
export default fp(async function authPlugin(app) {
  app.decorateRequest('user', null);
  app.decorateRequest('sessionToken', null);

  app.addHook('preHandler', async (request) => {
    const token = request.cookies?.[config.session.cookieName];
    if (!token) return;
    request.sessionToken = token;
    request.user = await resolveSession(token);
  });

  app.decorate('requireAuth', async (request) => {
    if (!request.user) throw unauthorized();
    if (!request.user.emailVerified && request.user.hasPassword && !request.user.discordId) {
      throw forbidden('Please confirm your email address first', 'EMAIL_UNVERIFIED');
    }
  });

  app.decorate('requireAdmin', async (request) => {
    if (!request.user) throw unauthorized();
    if (request.user.role !== 'admin') throw forbidden('Admin only');
  });
});
