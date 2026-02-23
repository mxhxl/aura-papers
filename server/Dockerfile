# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit

COPY . .

# Copy the CSV data file before running init-db
# REMOVED: COPY ../public/retraction_watch.csv ./public/retraction_watch.csv  (COPY cannot access ../)

RUN node init-db.js || echo "Database initialization skipped - will run at startup"

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/*.js ./
COPY --from=builder /app/database.db ./database.db
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=5004

EXPOSE 5004

USER node

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]