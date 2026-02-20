# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

COPY . .

COPY ../public/retraction_watch.csv /app/public/retraction_watch.csv || true

RUN npm run init-db || echo "Database initialization skipped"

EXPOSE 5004

CMD ["npm", "start"]