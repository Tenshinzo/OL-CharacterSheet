import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import { existsSync } from 'node:fs';
import { config } from './config.js';
import { HttpError } from './lib/errors.js';
import { buildIndexHtml } from './lib/assets.js';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import characterRoutes from './routes/characters.js';
import userDataRoutes from './routes/userdata.js';
import groupRoutes from './routes/groups.js';
import adminRoutes from './routes/admin.js';
import wsRoutes from './routes/ws.js';
import feedbackRoutes from './routes/feedback.js';

export async function buildApp(opts = {}) {
  const routeOpts = opts.routeOpts || {};
  const app = Fastify({
    logger: opts.logger ?? (config.isTest ? false : { level: config.isProd ? 'info' : 'debug' }),
    trustProxy: config.trustProxy,
    bodyLimit: 4 * 1024 * 1024,
  });

  await app.register(cookie);
  await app.register(rateLimit, {
    global: true,
    max: 600,
    timeWindow: '1 minute',
    allowList: config.isTest ? () => true : undefined,
  });
  await app.register(websocket, { options: { maxPayload: 64 * 1024 } });
  await app.register(authPlugin);

  app.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'same-origin');
    reply.header('X-Frame-Options', 'DENY');
  });

  // Same-origin check for state-changing requests (CSRF defence in depth).
  app.addHook('preHandler', async (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const origin = request.headers.origin || (request.headers.referer ? new URL(request.headers.referer).origin : null);
      if (origin && origin !== config.appUrl && !config.isTest) {
        const host = request.headers.host;
        if (!host || new URL(origin).host !== host) throw new HttpError(403, 'Cross-origin request blocked', 'CSRF');
      }
    }
  });

  app.setErrorHandler((err, request, reply) => {
    if (err instanceof HttpError) {
      return reply.code(err.statusCode).send({ error: err.message, code: err.code });
    }
    if (err.validation || err.statusCode === 400) {
      return reply.code(400).send({ error: err.message, code: 'BAD_REQUEST' });
    }
    if (err.statusCode === 429) {
      return reply.code(429).send({ error: 'Too many requests, please slow down', code: 'RATE_LIMITED' });
    }
    if (err.statusCode === 413) {
      return reply.code(413).send({ error: 'Payload too large', code: 'TOO_LARGE' });
    }
    request.log.error(err);
    return reply.code(500).send({ error: 'Internal server error', code: 'INTERNAL' });
  });

  app.get('/api/health', async () => ({ ok: true, env: config.env }));

  await app.register(async (api) => {
    await api.register(authRoutes);
    await api.register(characterRoutes);
    await api.register(userDataRoutes);
    await api.register(groupRoutes);
    await api.register(adminRoutes);
    await api.register(wsRoutes);
    await api.register(feedbackRoutes, routeOpts.feedback || {});
  }, { prefix: '/api' });

  if (existsSync(config.clientDir)) {
    // index.html is rendered once with content-hashed asset URLs (see lib/assets.js)
    // and never cached; the assets themselves may be cached for a long time.
    const index = buildIndexHtml(config.clientDir);
    app.log.info({ version: index.version, files: index.files.length }, 'client assets versioned');
    const sendIndex = (reply) => reply
      .header('cache-control', 'no-cache')
      .type('text/html; charset=utf-8')
      .send(index.html);
    app.get('/', (request, reply) => sendIndex(reply));
    app.get('/index.html', (request, reply) => sendIndex(reply));
    await app.register(fastifyStatic, {
      root: config.clientDir,
      prefix: '/',
      index: false,
      cacheControl: true,
      maxAge: config.isProd ? '7d' : 0,
      etag: true,
    });
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) return reply.code(404).send({ error: 'Not found', code: 'NOT_FOUND' });
      return sendIndex(reply);
    });
  }

  return app;
}
