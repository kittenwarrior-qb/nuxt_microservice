FROM node:20.19.0-alpine AS base

FROM base AS deps
WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --no-audit --no-fund

FROM base AS build-deps
WORKDIR /app
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

FROM build-deps AS builder
WORKDIR /app

COPY . .

ENV NODE_ENV=production
ENV NITRO_PRESET=node-server
ENV NUXT_TELEMETRY_DISABLED=1
RUN --mount=type=cache,target=/app/.nuxt \
    --mount=type=cache,target=/app/node_modules/.cache \
    npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000
ENV NITRO_PORT=3000

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxtjs -u 1001

COPY --from=deps --chown=nuxtjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nuxtjs:nodejs /app/.output ./.output
COPY --from=builder --chown=nuxtjs:nodejs /app/package.json ./package.json

USER nuxtjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", ".output/server/index.mjs"]
