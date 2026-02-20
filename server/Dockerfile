# syntax=docker/dockerfile:1
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit

COPY . .

EXPOSE 5004

CMD ["sh", "-c", "npm run init-db && node server.js"]