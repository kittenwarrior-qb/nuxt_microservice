FROM node:20.19.0-bookworm-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 moleculer

# Change ownership of the app directory
RUN chown -R moleculer:nodejs /app
USER moleculer

# Expose port
EXPOSE 3001

# Health check
# Install curl for healthcheck
USER root
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
USER moleculer
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost:3001/api/v1/health || exit 1

# Start the application
CMD ["node", "index.js"]
