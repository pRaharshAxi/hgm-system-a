# Stage 1: Builder
FROM node:20.19.0-alpine AS builder

# Install build tools required for native C++ modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

# Configure robust network settings to prevent ECONNRESET
RUN npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 180000 && \
    npm config set fetch-timeout 300000 && \
    npm ci

COPY . .

RUN npm run build

# Clean up devDependencies before copying to runner
RUN npm prune --omit=dev


# Stage 2: Runner
FROM node:20.19.0-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/src/camunda/bpmn ./src/camunda/bpmn

EXPOSE 3001

CMD ["node", "dist/src/main.js"]