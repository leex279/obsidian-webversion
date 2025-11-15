FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

FROM node:20-alpine

# Install Docker CLI (needed to run docker compose from within container)
RUN apk add --no-cache docker-cli docker-cli-compose

# Create non-root user (use existing group if present)
RUN addgroup -g 1001 setupuser || true && \
    adduser -D -u 1001 -G setupuser setupuser || adduser -D -u 1001 setupuser

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder --chown=setupuser:setupuser /app/node_modules ./node_modules

# Copy application files
COPY --chown=setupuser:setupuser src ./src
COPY --chown=setupuser:setupuser public ./public
COPY --chown=setupuser:setupuser package.json ./

# Switch to non-root user
USER setupuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --spider --quiet http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]
