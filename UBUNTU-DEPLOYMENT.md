# DÉPLOIEMENT UBUNTU VPS - KELIOS IA

## Guide complet pour déployer KELIOS IA sur Hostinger Ubuntu VPS avec synchronisation GitHub

---

## PRÉREQUIS

### 1. VPS Hostinger Ubuntu
- Ubuntu 20.04 ou supérieur
- Accès SSH (root ou utilisateur avec sudo)
- Docker et Docker Compose installés
- Nginx installé

### 2. Domaine configuré
- DNS pointant vers l'IP du VPS
- Certificat SSL (recommandé)

---

## MÉTHODE 1: DÉPLOIEMENT AUTOMATIQUE VIA GITHUB ACTIONS

### 1.1 Configuration des secrets GitHub

Dans votre repository GitHub → **Settings** → **Secrets and variables** → **Actions** :

#### Secret 1: VPS_HOST
```
Name: VPS_HOST
Value: votre-ip-vps-ou-domaine.com
```

#### Secret 2: VPS_USER
```
Name: VPS_USER
Value: root
```

#### Secret 3: VPS_SSH_KEY
```
Name: VPS_SSH_KEY
Value: 
-----BEGIN OPENSSH PRIVATE KEY-----
[COPIER LE CONTENU COMPLET DE VOTRE CLÉ SSH PRIVÉE]
-----END OPENSSH PRIVATE KEY-----
```

#### Secret 4: VPS_PORT
```
Name: VPS_PORT
Value: 22
```

### 1.2 Workflow GitHub Actions

Le fichier `.github/workflows/deploy.yml` est déjà configuré pour :
- Build de l'application
- Connexion SSH au VPS
- Déploiement avec Docker
- Vérification du déploiement

### 1.3 Déploiement automatique

```bash
# Pousser les modifications
git add .
git commit -m "Déploiement KELIOS IA VPS"
git push origin main
```

Le workflow s'exécute automatiquement et déploie sur votre VPS.

---

## MÉTHODE 2: DÉPLOIEMENT MANUEL VIA SCRIPT

### 2.1 Préparation du VPS

```bash
# Connexion au VPS
ssh root@votre-ip-vps

# Mise à jour du système
apt update && apt upgrade -y

# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Installation de Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Installation de Nginx
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

### 2.2 Utilisation du script de déploiement

```bash
# Rendre le script exécutable
chmod +x deploy-ubuntu.sh

# Déployer sur le VPS
./deploy-ubuntu.sh root votre-ip-vps 22
```

Le script automatise :
- Vérification de Docker/Docker Compose
- Copie des fichiers
- Build et déploiement des conteneurs
- Configuration Nginx
- Vérification du déploiement

---

## CONFIGURATION DOCKER

### Dockerfile optimisé
- **Multi-stage build** : Réduit la taille de l'image
- **Nginx Alpine** : Léger et performant
- **Cache optimisé** : Build rapide
- **Sécurité** : Permissions correctes

### Docker Compose
- **Service unique** : Application React
- **Port 80** : Standard HTTP
- **Health check** : Monitoring automatique
- **Volumes** : Logs persistants
- **Restart policy** : Redémarrage automatique

---

## CONFIGURATION NGINX

### Performance et sécurité
- **Compression Gzip** : -70% taille fichiers
- **Cache statique** : Chargement instantané
- **Headers sécurité** : XSS, CSRF, etc.
- **Proxy API** : Backend support
- **Routing SPA** : React Router compatible

### Reverse proxy
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## VÉRIFICATION DU DÉPLOIEMENT

### 1. Test de santé
```bash
# Vérifier les conteneurs
docker ps

# Vérifier les logs
docker logs facture-app

# Test HTTP
curl -f http://localhost:80
```

### 2. Accès à l'application
- **URL** : `http://votre-ip-vps` ou `http://votre-domaine.com`
- **Logs** : `docker-compose logs` sur le VPS
- **Management** : `docker-compose restart/stop/start`

---

## HTTPS ET CERTIFICAT SSL

### 1. Let's Encrypt gratuit
```bash
# Sur le VPS
sudo apt install certbot python3-certbot-nginx -y

# Obtenir le certificat
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique
sudo crontab -e
# Ajouter: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Configuration HTTPS
```nginx
server {
    listen 443 ssl;
    server_name votre-domaine.com;
    
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:80;
        # ... autres configurations
    }
}
```

---

## MONITORING ET MAINTENANCE

### 1. Logs
```bash
# Logs Docker
docker-compose logs -f

# Logs Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Logs système
journalctl -u nginx -f
```

### 2. Performance
```bash
# Statistiques des conteneurs
docker stats

# Utilisation disque
df -h

# Utilisation mémoire
free -h
```

### 3. Backups
```bash
# Backup des données
docker-compose down
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/facture-app
docker-compose up -d

# Backup automatique (cron)
0 2 * * * /chemin/backup-script.sh
```

---

## DÉPANNAGE

### Problème 1: Conteneur ne démarre pas
```bash
# Vérifier les logs
docker logs facture-app

# Reconstruire l'image
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Problème 2: Erreur 502 Bad Gateway
```bash
# Vérifier si l'application écoute sur le port 80
docker exec facture-app netstat -tlnp

# Redémarrer Nginx
systemctl restart nginx
```

### Problème 3: Application inaccessible
```bash
# Vérifier le firewall
ufw status
ufw allow 80
ufw allow 443

# Vérifier la configuration Nginx
nginx -t
```

---

## OPTIMISATIONS

### 1. Performance
- **CDN** : CloudFlare pour les assets statiques
- **Cache** : Nginx + Browser caching
- **Compression** : Gzip + Brotli
- **HTTP/2** : Support moderne

### 2. Sécurité
- **Fail2Ban** : Protection contre brute-force
- **UFW** : Firewall configuré
- **SSL/TLS** : HTTPS obligatoire
- **Headers** : Sécurité renforcée

---

## MISE À JOUR

### 1. Via GitHub Actions
```bash
# Simple push pour mettre à jour
git add .
git commit -m "Mise à jour KELIOS IA"
git push origin main
```

### 2. Via script manuel
```bash
# Redéployer avec le script
./deploy-ubuntu.sh root votre-ip-vps 22
```

---

## RÉSULTAT FINAL

Après déploiement :
- **URL** : `http://votre-domaine.com` ou `https://votre-domaine.com`
- **Application** : KELIOS IA 100% fonctionnelle
- **Performance** : Optimisée avec Nginx + Docker
- **Maintenance** : Facile via Docker Compose
- **Monitoring** : Logs et métriques disponibles

---

## SUPPORT

### Documentation
- **Docker** : `docker --help`
- **Docker Compose** : `docker-compose --help`
- **Nginx** : `/usr/share/doc/nginx/`
- **System** : `man systemd`

### Commandes utiles
```bash
# Gestion des conteneurs
docker-compose ps
docker-compose logs
docker-compose restart
docker-compose down

# Gestion Nginx
systemctl status nginx
systemctl reload nginx
nginx -t

# Monitoring
htop
df -h
free -h
```

---

**Votre KELIOS IA est maintenant prête pour le déploiement sur Hostinger Ubuntu VPS !** 🚀
