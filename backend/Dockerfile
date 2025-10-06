FROM node:20.19.0-alpine

WORKDIR /app

RUN apk add --no-cache curl ca-certificates

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --no-audit --no-fund

COPY . .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S moleculer -u 1001 -G nodejs

RUN chown -R moleculer:nodejs /app

USER moleculer

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD curl -fsS http://localhost:3001/api/v1/health || exit 1

CMD ["node", "index.js"]
