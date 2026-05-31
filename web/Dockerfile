# syntax=docker/dockerfile:1

# ──────────────────────────────────────────────────────────────
# Web — TanStack Start + Prisma + Bun (multi-stage)
# ──────────────────────────────────────────────────────────────

FROM oven/bun:1.2-slim AS builder
WORKDIR /app
COPY package.json bun.lock ./
# Warm cache: copy host node_modules so bun install only verifies
COPY node_modules ./node_modules
RUN bun install --frozen-lockfile
COPY . .
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN bunx prisma generate
RUN bun run build

FROM oven/bun:1.2-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src/generated/prisma /app/src/generated/prisma
RUN printf '%s\n' 'import server from "./dist/server/server.js"' 'export default {' '  async fetch(req) {' '    const url = new URL(req.url)' '    const path = url.pathname' '    if (path.startsWith("/assets/") || path === "/hero.png" || path === "/favicon.ico" || path === "/manifest.json") {' '      const file = Bun.file(`./dist/client${path}`)' '      if (await file.exists()) return new Response(file)' '    }' '    return server.fetch(req)' '  }' '}' > server-wrapper.mjs
EXPOSE 3000
CMD ["bunx", "srvx", "serve", "--entry", "server-wrapper.mjs", "--prod"]
