# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

COPY . .

# Only initialize DB if CSV file exists, otherwise skip (DB will be empty or use existing data)
RUN npm run init-db || echo "CSV file not found, skipping DB initialization"

EXPOSE 5002

CMD ["npm", "start"]