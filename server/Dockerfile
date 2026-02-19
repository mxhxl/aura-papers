# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit

COPY . .

RUN node init-db.js || true

EXPOSE 5004

ENV NODE_ENV=production

CMD ["node", "server.js"]