# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit

COPY . .

RUN node init-db.js || true

ENV NODE_ENV=production

EXPOSE 5003

CMD ["node", "server.js"]