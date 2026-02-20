# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Copy application code
COPY . .

# Skip database initialization during build - it should run at container startup
# The CSV file might not be available during build time

EXPOSE 5004

# Run initialization and start server
CMD if [ -f "init-db.js" ]; then node init-db.js; fi && \
    if [ -f "migrate-db.js" ]; then node migrate-db.js; fi && \
    node server.js