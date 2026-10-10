# Production image for the Open Legend Character Sheet (Fastify API + static client).
# Build context is the repo root: docker build -t olchar-app .
FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

# Install production dependencies first so the layer is cached across code changes.
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev && npm cache clean --force

# Application code. server/src/config.js resolves the client as
# resolve(src, '..', '..', 'client') => /app/client, and the migrations as
# resolve(src, '..', 'migrations') => /app/server/migrations.
COPY server/ ./server/
COPY client/ ./client/

RUN chown -R node:node /app
USER node

WORKDIR /app/server

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "src/index.js"]
