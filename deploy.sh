#!/bin/bash

# Deployment script for Aura Papers
# Run this script on your VPS after uploading the code

set -e  # Exit on error

echo "========================================="
echo "Deploying Aura Papers Application"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/aura-papers/aura-papers"
SERVER_DIR="$APP_DIR/server"
NGINX_CONFIG="/etc/nginx/sites-available/aura-papers"
PM2_APP_NAME="aura-papers-api"

echo -e "${YELLOW}Step 1: Checking system dependencies...${NC}"
command -v node >/dev/null 2>&1 || { echo -e "${RED}Node.js is required but not installed. Please install Node.js first.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}npm is required but not installed.${NC}" >&2; exit 1; }
command -v nginx >/dev/null 2>&1 || { echo -e "${RED}nginx is required but not installed.${NC}" >&2; exit 1; }
command -v pm2 >/dev/null 2>&1 || { echo -e "${RED}PM2 is required but not installed. Install with: npm install -g pm2${NC}" >&2; exit 1; }
echo -e "${GREEN}All dependencies found!${NC}"

echo -e "${YELLOW}Step 2: Installing frontend dependencies...${NC}"
cd "$APP_DIR"
npm install

echo -e "${YELLOW}Step 3: Building frontend...${NC}"
npm run build

if [ ! -d "$APP_DIR/dist" ]; then
    echo -e "${RED}Build failed! dist folder not created.${NC}"
    exit 1
fi
echo -e "${GREEN}Frontend built successfully!${NC}"

echo -e "${YELLOW}Step 4: Installing backend dependencies...${NC}"
cd "$SERVER_DIR"
npm install

echo -e "${YELLOW}Step 5: Checking database...${NC}"
if [ ! -f "$SERVER_DIR/papers.db" ]; then
    echo -e "${YELLOW}Database not found. Checking for CSV file...${NC}"
    if [ -f "$APP_DIR/public/retraction_watch.csv" ]; then
        echo -e "${YELLOW}Initializing database...${NC}"
        npm run init-db
    else
        echo -e "${RED}CSV file not found at $APP_DIR/public/retraction_watch.csv${NC}"
        echo -e "${YELLOW}Please upload the CSV file and run: npm run init-db${NC}"
    fi
else
    echo -e "${GREEN}Database already exists.${NC}"
fi

echo -e "${YELLOW}Step 6: Setting up PM2...${NC}"
# Check if app is already running
if pm2 list | grep -q "$PM2_APP_NAME"; then
    echo -e "${YELLOW}Restarting existing PM2 process...${NC}"
    pm2 restart "$PM2_APP_NAME"
else
    echo -e "${YELLOW}Starting new PM2 process...${NC}"
    cd "$SERVER_DIR"
    pm2 start server.js --name "$PM2_APP_NAME"
fi

pm2 save
echo -e "${GREEN}PM2 configured successfully!${NC}"

echo -e "${YELLOW}Step 7: Configuring nginx...${NC}"
# Copy nginx config if it exists in the app directory
if [ -f "$APP_DIR/nginx-config.conf" ]; then
    cp "$APP_DIR/nginx-config.conf" "$NGINX_CONFIG"
    echo -e "${GREEN}Nginx config copied.${NC}"
else
    echo -e "${YELLOW}Creating nginx config...${NC}"
    cat > "$NGINX_CONFIG" <<'EOF'
server {
    listen 80;
    server_name 172.105.252.86;

    client_max_body_size 100M;

    location / {
        root /var/www/aura-papers/aura-papers/dist;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
EOF
fi

# Enable site
if [ ! -L "/etc/nginx/sites-enabled/aura-papers" ]; then
    ln -s "$NGINX_CONFIG" /etc/nginx/sites-enabled/aura-papers
    echo -e "${GREEN}Nginx site enabled.${NC}"
fi

# Remove default site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    echo -e "${GREEN}Default site removed.${NC}"
fi

# Test nginx config
echo -e "${YELLOW}Testing nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}Nginx configuration is valid!${NC}"
    systemctl restart nginx
    systemctl enable nginx
    echo -e "${GREEN}Nginx restarted successfully!${NC}"
else
    echo -e "${RED}Nginx configuration test failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 8: Setting up PM2 startup script...${NC}"
pm2 startup systemd -u root --hp /root | grep -v "PM2" | bash || true

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "Your application is now running at:"
echo -e "  ${GREEN}http://172.105.252.86${NC}"
echo ""
echo -e "API Health Check:"
echo -e "  ${GREEN}http://172.105.252.86/api/health${NC}"
echo ""
echo -e "Useful commands:"
echo -e "  PM2 status:  ${YELLOW}pm2 status${NC}"
echo -e "  PM2 logs:    ${YELLOW}pm2 logs $PM2_APP_NAME${NC}"
echo -e "  Nginx status: ${YELLOW}systemctl status nginx${NC}"
echo ""
