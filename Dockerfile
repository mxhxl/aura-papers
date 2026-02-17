# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_OPTIONS=--max-old-space-size=4096
ENV VITE_API_URL=/api
ENV CI=false

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --legacy-peer-deps

COPY . .

RUN npm run build

RUN find dist -type f -name '*.js' -exec sed -i 's|http://localhost:5002/api|/api|g' {} +

FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:5002/api/; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]