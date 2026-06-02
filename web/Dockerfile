# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────
# Web — TanStack Start + Prisma + Bun (multi-stage)
# ──────────────────────────────────────────────────────────────

FROM oven/bun:1.3-slim AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# Prisma generate needs DATABASE_URL set, but it doesn't need a real connection
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN bunx prisma generate
RUN bun run build

FROM oven/bun:1.3-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd -r app && useradd -r -g app app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/generated/prisma /app/src/generated/prisma
COPY server-wrapper.mjs ./server-wrapper.mjs
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
CMD ["bunx", "srvx", "serve", "--entry", "server-wrapper.mjs", "--prod"]
