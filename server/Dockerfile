# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

# Copy application code
COPY . .

# Copy the CSV data file from parent directory's public folder
COPY ../public/retraction_watch.csv /app/public/retraction_watch.csv

# Initialize database before starting server
RUN npm run init-db

# Expose port
EXPOSE 5004

# Start the server
CMD ["npm", "start"]