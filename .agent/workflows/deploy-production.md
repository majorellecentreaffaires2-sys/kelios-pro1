---
description: How to deploy Majorlle Pro to production (VPS / server)
---

# Deploy to Production (VPS)

## Prerequisites
- Ubuntu 20.04+ VPS (DigitalOcean, Hostinger, OVH, etc.)
- Domain name pointed to server IP
- MySQL 8.0+ installed on server

## Step 1 — Build the frontend
```bash
npm run build
```
This generates `./dist/` which the Express server serves as static files.

## Step 2 — Set production environment variables
Create `.env.production` on the server (NEVER commit this):
```
NODE_ENV=production
PORT=5000
DB_HOST=localhost
DB_USER=majorlle_user
DB_PASSWORD=<strong_password>
DB_NAME=majorlle_erp
JWT_SECRET=<64_char_random_string>
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<resend_api_key>
SMTP_FROM="Majorlle Pro" <noreply@yourdomain.com>
GEMINI_API_KEY=<your_key>
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://yourdomain.com
UPLOAD_DIR=./uploads
```

## Step 3 — Upload code to server
```bash
# On your local machine:
git push origin main

# On the server:
git clone https://github.com/marouan-folane/facture-app.git /var/www/majorlle
cd /var/www/majorlle
npm install --omit=dev
npm run build
```

## Step 4 — Install and configure PM2
```bash
npm install -g pm2
pm2 start server.js --name "majorlle-pro" --env production
pm2 save
pm2 startup
```

## Step 5 — Configure Nginx as reverse proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/majorlle/uploads;
        expires 30d;
    }

    client_max_body_size 10M;
}
```

## Step 6 — Enable HTTPS with Certbot
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 7 — Health check
```bash
pm2 status
pm2 logs majorlle-pro --lines 50
curl https://yourdomain.com/api/me
```

## Update Deployment
```bash
git pull origin main
npm install --omit=dev
npm run build
pm2 restart majorlle-pro
```
