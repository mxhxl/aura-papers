# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --omit=dev

# Copy application code and data files
COPY . .

# Ensure the CSV file is in the correct location
# The app looks for it in /public/retraction_watch.csv and /app/public/retraction_watch.csv
RUN mkdir -p /app/public /public && \
    if [ -f retraction_watch.csv ]; then \
      cp retraction_watch.csv /app/public/retraction_watch.csv && \
      cp retraction_watch.csv /public/retraction_watch.csv; \
    elif [ -f public/retraction_watch.csv ]; then \
      cp public/retraction_watch.csv /app/public/retraction_watch.csv && \
      cp public/retraction_watch.csv /public/retraction_watch.csv; \
    fi

# Expose the port
EXPOSE 5004

# Start the server
CMD ["node", "server.js"]