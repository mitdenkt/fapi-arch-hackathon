FROM node:22-alpine AS deps
WORKDIR /app

# Nur die Files kopieren, die für npm ci nötig sind (Cache-freundlich)
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app

# Dev-Dependencies aus Stage deps nutzen (tsc, etc.)
COPY --from=deps /app/node_modules ./node_modules
# Projektquellen kopieren
COPY tsconfig.json ./
COPY src ./src
# Falls ihr z. B. Zod-Schemas, Drizzle-Schemas o. ä. außerhalb /src habt, hier ergänzen:
# COPY drizzle ./drizzle

# Build (setzt "npm run build" mit tsc voraus)
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Produktions-Dependencies installieren
COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && apk add --no-cache curl

# Gebautes Artefakt übernehmen
COPY --from=builder /app/dist ./dist

# Optional: falls ihr zur Laufzeit Drizzle-Migrationen/Artefakte braucht:
# COPY drizzle ./drizzle

# Non-Root User
RUN addgroup -S app && adduser -S -G app app
USER app

# Env-Variablen (bei Bedarf überschreiben)
ENV PORT=3000
ENV DATABASE_URL=postgres://app:app@postgres:5432/app
ENV VALKEY_HOST=valkey
ENV VALKEY_PORT=6379

EXPOSE 3000

# Healthcheck: erwartet einen /health Endpoint (Fastify-Route)
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -sf http://localhost:${PORT}/health || exit 1

# Start: passt den Pfad an euren Build-Ausgabepunkt an (z. B. dist/server.js)
CMD ["node", "dist/index.js"]
