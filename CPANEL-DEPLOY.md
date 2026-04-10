# 🚀 DÉPLOIEMENT CPANEL HOSTINGER (Updated with DB)

## 🎯 Étapes (10 min)

### 1. Build local
```bash
npm run build
```

### 2. Upload public_html/
```
File Manager: package.json, server.js, ecosystem.config.js, server/, dist/, .htaccess, .env.example
Créer: logs/, uploads/
```

### 3. cPanel Node.js App
```
Setup Node.js App → Node 20/18 → Root: public_html → Startup: ecosystem.config.js → CREATE
```

### 4. **BASE DE DONNÉES MySQL (CRUCIAL)**
```
MySQL Databases:
- DB: facture_app_db
- User: facture_user + pass fort → Assign to DB (ALL PRIVS)
```
```
.env (copier .env.example):
DB_HOST=localhost
DB_USER=facture_user
DB_PASS=yourpass
DB_NAME=facture_app_db
JWT_SECRET=generate_long_secret
```

### 5. Terminal cPanel
```bash
cd public_html
npm install --production
pm2 start ecosystem.config.js --env production
pm2 save
```

### 6. Permissions
```
uploads/: 755/775, logs/: 755
```

### 7. Test
- Site: https://domaine.com
- API: /api/check-uploads

## 📦 Auto-ZIP
```bash
./deploy-cpanel.sh  # Crée facture-app-cpanel.zip
```

**Prêt pour Hostinger cPanel!** 🎉

