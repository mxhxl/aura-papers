# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --omit=dev

# Copy application code
COPY . .

# Ensure the CSV file exists in the public directory
# If the CSV is in the root or elsewhere, adjust the path accordingly
RUN if [ ! -f public/retraction_watch.csv ]; then \
      echo "WARNING: retraction_watch.csv not found in public/ directory"; \
      mkdir -p public; \
    fi

# Expose the port
EXPOSE 5004

# Initialize database and start server
CMD ["sh", "-c", "npm run init-db || echo 'Database initialization skipped' && npm start"]