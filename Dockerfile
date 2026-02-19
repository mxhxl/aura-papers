# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=/api
ARG NODE_ENV=production

ENV NODE_OPTIONS=--max-old-space-size=4096
ENV VITE_API_URL=${VITE_API_URL}
ENV NODE_ENV=${NODE_ENV}
ENV CI=false

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --legacy-peer-deps

COPY . .

RUN npm run build

FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]