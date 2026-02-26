# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit

# Copy application code
COPY . .

# Copy the CSV data file from parent directory into the image
# REMOVED: COPY ../public/retraction_watch.csv /app/public/retraction_watch.csv  (COPY cannot access ../)

# Initialize database with the CSV file now present
RUN node init-db.js

FROM node:20-alpine

WORKDIR /app

# Copy node_modules and built artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/*.js ./
COPY --from=builder /app/database.db ./
COPY --from=builder /app/public ./public

EXPOSE 5004

CMD ["node", "server.js"]