# Stage: Prepare build environment
FROM node:22-alpine AS builder

# Install pnpm (match CI version)
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy source files and configuration
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile


# Build backend and frontend
RUN pnpm run build:backend && pnpm run build:frontend

# Production stage
ARG BACKEND_PORT=8079
ENV BACKEND_PORT=${BACKEND_PORT}

# OpenTelemetry Collector configuration (configurable via environment variables)
ARG OTEL_COLLECTOR_HOSTNAME=otel-collector
ARG OTEL_COLLECTOR_PORT=55678
ENV OTEL_COLLECTOR_HOSTNAME=${OTEL_COLLECTOR_HOSTNAME}
ENV OTEL_COLLECTOR_PORT=${OTEL_COLLECTOR_PORT}

# Stage: Build backend image
FROM node:22-alpine

# Install pnpm (match CI version)
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Skip lifecycle scripts (husky prepare hook is dev-only and .husky/ is not copied here)
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy built backend files from builder stage
COPY --from=builder /app/dist/backend ./dist/backend

# Copy built frontend files (backend serves frontend in production)
COPY --from=builder /app/dist/public ./dist/public

# Copy public resources directory (needed by backend)
COPY --from=builder /app/public ./public

# Expose backend port (configurable via BACKEND_PORT environment variable)
EXPOSE 8079

# Start the backend server
CMD ["node", "dist/backend/server.js"]
