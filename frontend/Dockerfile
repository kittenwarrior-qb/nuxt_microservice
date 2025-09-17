# Multi-stage build for Nuxt 4 frontend
FROM node:20.19.0-bookworm-slim AS base

# Install dependencies only when needed
FROM base AS deps
# On Debian-based images, glibc is available by default; no extra packages required
WORKDIR /app

# Copy package files
COPY package*.json ./
# Avoid running postinstall (nuxt prepare) before source is copied
ENV NPM_CONFIG_IGNORE_SCRIPTS=true
RUN npm ci && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
# Build runs scripts as needed (including nuxt prepare)
RUN npm run build

# Production image, copy all the files and run nuxt
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nuxtjs

# Copy built application
COPY --from=builder --chown=nuxtjs:nodejs /app/.output /app/.output

USER nuxtjs

EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]
