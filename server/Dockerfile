# syntax=docker/dockerfile:1
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit

COPY . .

ENV NODE_ENV=production

RUN npm run init-db || true

EXPOSE 5004

CMD ["sh", "-c", "npm run init-db && npm start"]