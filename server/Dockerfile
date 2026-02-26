# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit

COPY . .

# Initialize database with CSV data
RUN node init-db.js

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/*.js ./
COPY --from=builder /app/*.db ./
COPY --from=builder /app/public ./public

EXPOSE 5004

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]