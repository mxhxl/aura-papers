# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit

COPY . .

# Don't run init-db during build - the CSV file is mounted at runtime
# Database initialization will happen on first startup via CMD

EXPOSE 5004

# Initialize database on startup (only if it doesn't exist) then start server
CMD sh -c 'if [ ! -f /app/database.db ]; then node init-db.js; fi && node server.js'