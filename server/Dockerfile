# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --omit=dev

# Copy application code
COPY . .

# Create public directory if it doesn't exist and ensure CSV is copied
RUN mkdir -p /app/public /public

# Copy CSV file to both locations the app checks
COPY public/retraction_watch.csv /app/public/retraction_watch.csv 2>/dev/null || \
     COPY retraction_watch.csv /app/public/retraction_watch.csv 2>/dev/null || \
     echo "Warning: retraction_watch.csv not found in build context"

RUN cp /app/public/retraction_watch.csv /public/retraction_watch.csv 2>/dev/null || true

EXPOSE 5004

CMD ["node", "server.js"]