# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./

RUN npm ci --prefer-offline --no-audit --omit=dev

COPY server/ .

EXPOSE 5002

CMD ["node", "server.js"]