# syntax=docker/dockerfile:1
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --prefer-offline --no-audit --legacy-peer-deps

COPY . .

RUN npm run init-db || true

EXPOSE 5002

ENV PORT=5002

CMD ["npm", "start"]