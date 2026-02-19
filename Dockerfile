# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=/api
ARG NODE_ENV=production

ENV NODE_OPTIONS=--max-old-space-size=4096
ENV VITE_API_URL=${VITE_API_URL}
ENV NODE_ENV=${NODE_ENV}
ENV CI=false

# Copy package files from root context
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --legacy-peer-deps

# Copy all frontend source files
COPY . .

# Build the application
RUN npm run build

# Replace API URLs in built files
RUN find dist -type f -name '*.js' -exec sed -i 's|http://localhost:5003/api|/api|g' {} + || true

# Production stage
FROM nginx:1.25-alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]