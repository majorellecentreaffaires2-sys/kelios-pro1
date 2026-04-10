#!/bin/bash
# Script préparation déploiement cPanel Hostinger
# Crée ZIP prêt pour upload public_html/

echo "🔨 Préparation déploiement cPanel..."

# Build frontend
npm run build || { echo "Build failed"; exit 1; }

# Créer dossier temp
rm -rf deploy-temp
mkdir -p deploy-temp/{server,dist,public,uploads,logs}

# Copier fichiers essentiels
cp -r server deploy-temp/
cp dist/* deploy-temp/dist/
cp -r public/* deploy-temp/public/ 2>/dev/null || true
cp package.json server.js ecosystem.config.js .htaccess deploy-temp/
cp .env.example deploy-temp/.env 2>/dev/null || echo "DB_HOST=localhost\nDB_USER=\nDB_PASS=\nDB_NAME=" > deploy-temp/.env
touch deploy-temp/uploads/.htaccess deploy-temp/logs/.gitkeep

# Créer ZIP
zip -r facture-app-cpanel.zip deploy-temp -x "*/node_modules/*" "*/.git/*"

echo "✅ deploy-temp/ et facture-app-cpanel.zip créés"
echo "Upload facture-app-cpanel.zip → cPanel File Manager → public_html/"
echo "Puis: npm install && pm2 start ecosystem.config.js"
rm -rf deploy-temp

