# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --omit=dev

# Copy application files
COPY . .

# Initialize the database
RUN npm run init-db

# Expose the port
EXPOSE 5002

# Start the server
CMD ["node", "server.js"]