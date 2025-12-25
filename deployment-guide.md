# Deployment Guide for Aura Papers on VPS

## Prerequisites
- VPS IP: 172.105.252.86
- SSH User: root
- SSH Password: Rabbitpink777@

## Step 1: Connect to VPS

```bash
ssh root@172.105.252.86
# Enter password when prompted: Rabbitpink777@
```

## Step 2: Install Required Dependencies

Once connected to the VPS, run these commands:

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js (v20.x LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node -v
npm -v

# Install nginx
apt install -y nginx

# Install PM2 globally
npm install -g pm2

# Install git (if not already installed)
apt install -y git
```

## Step 3: Set Up Project Directory

```bash
# Create directory for the application
mkdir -p /var/www/aura-papers
cd /var/www/aura-papers
```

## Step 4: Upload Your Code to VPS

You have two options:

### Option A: Using Git (Recommended if you have a repository)
```bash
# Clone your repository
git clone <your-repo-url> .
```

### Option B: Using SCP from your local machine
From your Windows machine (in a separate terminal), run:
```bash
# Navigate to your project directory
cd D:\PDD\aura-papers

# Copy files to VPS (excluding node_modules)
scp -r * root@172.105.252.86:/var/www/aura-pape

```

## Step 5: Build Frontend

```bash
# Navigate to project directory
cd /var/www/aura-papers

# Install frontend dependencies
npm install

# Build the frontend for production
npm run build
```

This will create a `dist` folder with the built frontend files.

## Step 6: Set Up Backend

```bash
# Navigate to server directory
cd /var/www/aura-papers/server

# Install backend dependencies
npm install

# Initialize the database
npm run init-db
```

Make sure you have the CSV file at `/var/www/aura-papers/public/retraction_watch.csv` before running init-db.

## Step 7: Configure PM2

```bash
# Navigate to server directory
cd /var/www/aura-papers/server

# Start the server with PM2
pm2 start server.js --name aura-papers-api

# Save PM2 process list
pm2 save

# Set PM2 to start on system boot
pm2 startup systemd
# Follow the command that PM2 outputs

# Check status
pm2 status
pm2 logs aura-papers-api
```

## Step 8: Configure Nginx

Create nginx configuration file:

```bash
nano /etc/nginx/sites-available/aura-papers
```

Paste this configuration (copy from nginx-config.conf file provided):

```nginx
server {
    listen 80;
    server_name 172.105.252.86;  # Change to your domain if you have one

    # Frontend - serve built React app
    location / {
        root /var/www/aura-papers/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API - proxy to Express server
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase timeouts for large database queries
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
}
```

Enable the site and restart nginx:

```bash
# Create symbolic link to enable the site
ln -s /etc/nginx/sites-available/aura-papers /etc/nginx/sites-enabled/

# Remove default site if needed
rm /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Restart nginx
systemctl restart nginx

# Enable nginx to start on boot
systemctl enable nginx
```

## Step 9: Configure Firewall (if needed)

```bash
# Allow HTTP traffic
ufw allow 80/tcp

# Allow HTTPS traffic (for future SSL setup)
ufw allow 443/tcp

# Allow SSH (make sure this is allowed before enabling firewall!)
ufw allow 22/tcp

# Enable firewall (only if not already enabled)
ufw enable
```

## Step 10: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check nginx status
systemctl status nginx

# Check if backend is responding
curl http://localhost:3000/api/health

# Check if frontend is accessible
curl http://localhost
```

From your browser, visit:
- http://172.105.252.86 - Should show your frontend
- http://172.105.252.86/api/health - Should show API health status

## Useful Commands for Management

### PM2 Commands
```bash
pm2 status                    # Check status
pm2 logs aura-papers-api     # View logs
pm2 restart aura-papers-api  # Restart app
pm2 stop aura-papers-api     # Stop app
pm2 delete aura-papers-api   # Remove app
```

### Nginx Commands
```bash
systemctl status nginx       # Check status
systemctl restart nginx      # Restart nginx
systemctl reload nginx       # Reload config without downtime
nginx -t                     # Test configuration
```

### View Logs
```bash
# PM2 logs
pm2 logs aura-papers-api

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

## Updating the Application

When you make changes and want to update:

```bash
# Navigate to project
cd /var/www/aura-papers

# Pull latest changes (if using git)
git pull

# Rebuild frontend
npm install
npm run build

# Update backend dependencies if needed
cd server
npm install

# Restart PM2
pm2 restart aura-papers-api

# Reload nginx if config changed
systemctl reload nginx
```

## Optional: Set Up SSL with Let's Encrypt (if you have a domain)

```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically configure nginx for HTTPS
```

## Troubleshooting

### Backend not starting
```bash
# Check logs
pm2 logs aura-papers-api

# Check if port 3000 is in use
netstat -tulpn | grep 3000
```

### Frontend not loading
```bash
# Check nginx error logs
tail -f /var/log/nginx/error.log

# Verify dist folder exists
ls -la /var/www/aura-papers/dist

# Test nginx config
nginx -t
```

### Database issues
```bash
# Check if database file exists
ls -la /var/www/aura-papers/server/papers.db

# Check CSV file exists
ls -la /var/www/aura-papers/public/retraction_watch.csv

# Reinitialize database
cd /var/www/aura-papers/server
npm run init-db
```

## Security Recommendations

1. Change your SSH password after deployment
2. Set up SSH key authentication and disable password login
3. Set up a firewall with ufw
4. Install fail2ban to prevent brute force attacks
5. Set up SSL/TLS with Let's Encrypt if you have a domain
6. Regular system updates: `apt update && apt upgrade`
7. Set up automatic backups of the database

## Notes

- Your backend runs on port 3000 (managed by PM2)
- Nginx listens on port 80 and proxies API requests to backend
- Frontend is served as static files from the dist folder
- Database file is stored at `/var/www/aura-papers/server/papers.db`
