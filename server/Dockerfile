# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

# Copy application code
COPY . .

# Initialize the database during build
RUN npm run init-db

# Expose the port
EXPOSE 5002

# Start the server
CMD ["npm", "start"]