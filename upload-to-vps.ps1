# PowerShell script to upload project files to VPS
# Alternative to the .bat file

$VPS_IP = "172.105.252.86"
$VPS_USER = "root"
$VPS_DIR = "/var/www/aura-papers"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Uploading Aura Papers to VPS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creating directory on VPS..." -ForegroundColor Yellow
ssh "$VPS_USER@$VPS_IP" "mkdir -p $VPS_DIR"

Write-Host ""
Write-Host "Uploading files (this may take a while)..." -ForegroundColor Yellow
Write-Host "Please enter your password when prompted." -ForegroundColor Yellow
Write-Host ""

# Files and directories to upload
$itemsToUpload = @(
    "package.json",
    "package-lock.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "components.json",
    "index.html",
    "eslint.config.js",
    "src",
    "public",
    "server",
    "nginx-config.conf",
    "ecosystem.config.js",
    "deploy.sh"
)

foreach ($item in $itemsToUpload) {
    if (Test-Path $item) {
        Write-Host "Uploading $item..." -ForegroundColor Gray
        scp -r $item "${VPS_USER}@${VPS_IP}:${VPS_DIR}/"
    }
}

Write-Host ""
Write-Host "Upload complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. SSH into your VPS: ssh $VPS_USER@$VPS_IP" -ForegroundColor White
Write-Host "2. Make deploy script executable: chmod +x /var/www/aura-papers/deploy.sh" -ForegroundColor White
Write-Host "3. Run deployment: cd /var/www/aura-papers && ./deploy.sh" -ForegroundColor White
Write-Host ""
