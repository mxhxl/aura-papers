@echo off
REM Script to upload project files to VPS
REM This script uses SCP to copy files to the server

echo =========================================
echo Uploading Aura Papers to VPS
echo =========================================
echo.

set VPS_IP=172.105.252.86
set VPS_USER=root
set VPS_DIR=/var/www/aura-papers

echo Creating directory on VPS...
ssh %VPS_USER%@%VPS_IP% "mkdir -p %VPS_DIR%"

echo.
echo Uploading files (this may take a while)...
echo Please enter your password when prompted.
echo.

REM Upload all files except node_modules and dist
scp -r ^
  package.json ^
  package-lock.json ^
  vite.config.ts ^
  tsconfig.json ^
  tsconfig.app.json ^
  tsconfig.node.json ^
  tailwind.config.ts ^
  postcss.config.js ^
  components.json ^
  index.html ^
  eslint.config.js ^
  src ^
  public ^
  server ^
  nginx-config.conf ^
  ecosystem.config.js ^
  deploy.sh ^
  %VPS_USER%@%VPS_IP%:%VPS_DIR%/

echo.
echo Upload complete!
echo.
echo Next steps:
echo 1. SSH into your VPS: ssh %VPS_USER%@%VPS_IP%
echo 2. Make deploy script executable: chmod +x /var/www/aura-papers/deploy.sh
echo 3. Run deployment: cd /var/www/aura-papers ^&^& ./deploy.sh
echo.
pause
