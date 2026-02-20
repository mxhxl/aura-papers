# syntax=docker/dockerfile:1
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit

COPY . .

RUN node init-db.js

ENV NODE_ENV=production

EXPOSE 5004

CMD ["sh", "-c", "node init-db.js && node server.js"]