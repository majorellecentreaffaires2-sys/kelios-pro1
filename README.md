# KELIOS Pro - ERP & Facturation

Application de gestion d'entreprise, facturation et CRM.

## 🚀 Déploiement sur VPS Hostinger Ubuntu

### Prérequis sur le VPS
```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer PM2
sudo npm install -g pm2

# Installer Nginx
sudo apt install -y nginx

# Installer MySQL (si pas déjà installé)
sudo apt install -y mysql-server
```

### 1. Configurer MySQL
```bash
# Créer la base (si besoin)
sudo mysql -e "CREATE DATABASE IF NOT EXISTS majorlle_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Importer un dump complet (schéma + données) — fichier fourni dans le dépôt
mysql -u root -p majorlle_erp < /var/www/kelios-pro/database/kelios_pro_complete.sql

# OU, si la base existe déjà, données / scripts additionnels
mysql -u root -p majorlle_erp < /var/www/kelios-pro/database/all_databases.sql

# Données incrémentales seules (notifications, etc.) — optionnel
mysql -u root -p majorlle_erp < /var/www/kelios-pro/database/kelios_pro_data.sql
```

#### Synchroniser avec votre dossier de dumps (ex. `Downloads/databases`)
Si vous maintenez des exports MySQL ailleurs sur votre machine (par exemple `kelios_pro_complete.sql`, `kelios_pro_data.sql`), copiez-les vers `database/` **avant** de committer ou déployer, ou sur le VPS remplacez le fichier puis réimportez :

```bash
# Exemple : après copie du dump à jour sur le VPS
mysql -u VOTRE_USER -p majorlle_erp < /var/www/kelios-pro/database/kelios_pro_complete.sql
```

Le démarrage de l’application exécute aussi des migrations légères (`server/config/db.js`) pour aligner le schéma sur les anciennes installations.

### 2. Configurer l'application
```bash
cd /var/www/kelios-pro

# Copier et éditer le fichier d'environnement
cp .env.example .env
nano .env
# → Remplir les vrais identifiants DB, JWT, SMTP, etc.
```

### 3. Configurer Nginx
```bash
# Copier la config nginx
sudo cp nginx.conf /etc/nginx/sites-available/kelios-pro
sudo ln -sf /etc/nginx/sites-available/kelios-pro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Tester et redémarrer
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Activer HTTPS (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kelios-pro.com -d www.kelios-pro.com
```

### 5. Lancer l'application
```bash
cd /var/www/kelios-pro
npm install --omit=dev --no-audit
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup  # Pour démarrage automatique au reboot
```

### 6. Configurer GitHub Actions (CI/CD)
Dans **Settings → Secrets and variables → Actions** du dépôt GitHub, ajoutez :

| Secret | Valeur pour ce projet |
|--------|------------------------|
| `VPS_HOST` | `194.164.77.52` |
| `VPS_USER` | `devadmin` |
| `VPS_PORT` | `22` |
| `VPS_SSH_KEY` | contenu **complet** de la clé privée (fichier type `id_rsa` ou `id_ed25519`) correspondant à la clé publique déjà dans `~/.ssh/authorized_keys` sur le VPS |

Ne commitez jamais ces valeurs dans le code : le workflow lit uniquement `${{ secrets.* }}`.  
Collez chaque secret **sans espace ni ligne vide** avant ou après (sinon la connexion SSH échoue).

Chaque `git push` sur `main` déclenchera un déploiement automatique.

### Commandes utiles
```bash
pm2 status              # État de l'app
pm2 logs kelios-pro     # Voir les logs
pm2 restart kelios-pro  # Redémarrer
pm2 monit               # Monitoring en temps réel
```

## 🔧 Développement local
```bash
npm install
# Optionnel : commitez le package-lock.json généré pour activer le cache npm dans GitHub Actions
# (sinon le workflow fonctionne sans, sans cache).
# Terminal 1 — API (port 5000, charge le fichier .env)
npm start
# Terminal 2 — interface Vite (port 3000, proxy /api et /uploads vers 5000)
npm run dev
```
Sans `npm start`, le proxy Vite ne peut pas joindre l’API.

## 📁 Structure
```
├── src/              # Frontend React
├── server/           # Backend Express
│   ├── config/       # DB, email, plans
│   ├── routes/       # API routes
│   ├── middleware/    # Auth, validation
│   └── jobs/         # Cron jobs
├── database/         # SQL schemas
├── nginx.conf        # Config Nginx VPS
├── ecosystem.config.cjs # Config PM2 (CommonJS — requis avec "type": "module")
└── .github/workflows/   # CI/CD
```
