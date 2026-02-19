# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=/api

ENV NODE_OPTIONS=--max-old-space-size=4096
ENV VITE_API_URL=${VITE_API_URL}
ENV CI=false

# Do NOT set NODE_ENV=production during build - it prevents devDependencies install
# which includes vite, typescript, and other build tools

COPY package*.json ./

# Install ALL dependencies including devDependencies (needed for vite build)
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

COPY . .

# Now build with vite (which is installed in devDependencies)
RUN npm run build

RUN find dist -type f -name '*.js' -exec sed -i 's|http://localhost:5002/api|/api|g' {} + || true

FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]