# ==============================================================================
# DOC SEARCH API GATEWAY — HIGH-THROUGHPUT PRODUCTION DOCKERFILE
# Multi-stage build with minimal attack surface, tuned for 10,000,000 tx/day
# ==============================================================================

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g pnpm@9.15.4

# Stage 1: Dependencies & Build
FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api-gateway/ ./apps/api-gateway/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @docsearch/api-gateway... build

# Stage 2: Minimal Production Runtime
FROM node:24-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV UV_THREADPOOL_SIZE=64
ENV PORT=4000
ENV HOST=0.0.0.0

# Security: Non-root user
USER node

COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages ./packages
COPY --chown=node:node --from=builder /app/apps/api-gateway ./apps/api-gateway

EXPOSE 4000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:4000/health || exit 1

CMD ["node", "apps/api-gateway/dist/server.js"]
