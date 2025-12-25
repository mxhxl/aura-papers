# Quick Start Deployment Guide

This is a simplified guide to get your application deployed quickly.

## Method 1: Automated Script (Recommended)

### Step 1: Upload Files to VPS

Run the upload script from your Windows machine:

```bash
upload-to-vps.bat
```

Enter your password when prompted: `Rabbitpink777@`

### Step 2: Run Deployment Script on VPS

Connect to your VPS:
```bash
ssh root@172.105.252.86
# Password: Rabbitpink777@
```

Then run:
```bash
cd /var/www/aura-papers
chmod +x deploy.sh
./deploy.sh
```

That's it! Your application will be available at: http://172.105.252.86

---

## Method 2: Manual Steps

If the automated script doesn't work, follow the detailed guide in `deployment-guide.md`

---

## After Deployment

Visit these URLs to verify:
- Frontend: http://172.105.252.86
- API Health: http://172.105.252.86/api/health

## Managing Your Application

### View PM2 Status
```bash
ssh root@172.105.252.86
pm2 status
```

### View Logs
```bash
ssh root@172.105.252.86
pm2 logs aura-papers-api
```

### Restart Application
```bash
ssh root@172.105.252.86
pm2 restart aura-papers-api
```

## Troubleshooting

If something goes wrong, check:
1. PM2 logs: `pm2 logs aura-papers-api`
2. Nginx logs: `tail -f /var/log/nginx/error.log`
3. Make sure CSV file is uploaded to `/var/www/aura-papers/public/retraction_watch.csv`

For detailed troubleshooting, see `deployment-guide.md`
