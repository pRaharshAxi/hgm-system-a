# Stage 1: Builder
FROM node:20.11.1-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source files and assets needed for build
COPY . .

# Build the application
RUN npm run build


# Stage 2: Runner
FROM node:20.11.1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy dependency definitions
COPY package*.json ./

# Install production-only dependencies
RUN npm ci --only=production

# Copy built application and migrations from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

EXPOSE 3001

CMD ["node", "dist/main.js"]