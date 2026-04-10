# DÉPLOIEMENT MANUEL KELIOS IA - HOSTINGER UBUNTU VPS

## QUAND GITHUB ACTIONS ÉCHOUE - UTILISER CE GUIDE

---

## ÉTAPE 1: CONFIGURATION DES SECRETS GITHUB

### Accès aux secrets
1. **Aller sur votre repository** : https://github.com/majorellecentreaffaires2-sys/kelios-pro1
2. **Settings** (onglet en haut)
3. **Secrets and variables** (menu de gauche)
4. **Actions** (sous-menu)
5. **New repository secret** (bouton vert)

---

## ÉTAPE 2: CRÉER LES 4 SECRETS

### Secret 1: VPS_HOST
```
Name: VPS_HOST
Value: votre-ip-vps-ou-domaine.com
```

### Secret 2: VPS_USER
```
Name: VPS_USER
Value: root
```

### Secret 3: VPS_PORT
```
Name: VPS_PORT
Value: 22
```

### Secret 4: VPS_SSH_KEY
```
Name: VPS_SSH_KEY
Value: 
-----BEGIN OPENSSH PRIVATE KEY-----
[COPIER LE CONTENU COMPLET DE VOTRE CLÉ SSH PRIVÉE]
-----END OPENSSH PRIVATE KEY-----
```

---

## ÉTAPE 3: OBTENIR VOTRE CLÉ SSH

### Si vous n'avez pas de clé SSH :
```bash
# Sur votre machine locale
ssh-keygen -t rsa -b 4096 -C "github-actions@votre-domaine.com"

# Appuyez sur Enter pour tous les prompts (pas de passphrase)

# Afficher la clé privée (à copier dans VPS_SSH_KEY)
cat ~/.ssh/id_rsa

# Afficher la clé publique (à ajouter au VPS)
cat ~/.ssh/id_rsa.pub
```

### Ajouter la clé publique au VPS :
```bash
# Sur votre VPS
ssh root@votre-ip-vps
echo "votre-clé-publique-ssh" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
exit
```

---

## ÉTAPE 4: DÉPLOIEMENT MANUEL

### Option 1: Script de déploiement automatique
```bash
# Rendre le script exécutable
chmod +x deploy-ubuntu.sh

# Déployer
./deploy-ubuntu.sh root votre-ip-vps 22
```

### Option 2: Déploiement manuel complet
```bash
# 1. Connecter au VPS
ssh root@votre-ip-vps

# 2. Créer le répertoire de déploiement
mkdir -p /var/www/facture-app
cd /var/www/facture-app

# 3. Arrêter les conteneurs existants
docker-compose down --remove-orphans 2>/dev/null || true

# 4. Nettoyer les anciens fichiers
rm -rf *

exit

# 5. Copier les fichiers depuis votre machine locale
scp -r dist/* root@votre-ip-vps:/var/www/facture-app/
scp docker-compose.yml root@votre-ip-vps:/var/www/facture-app/
scp Dockerfile root@votre-ip-vps:/var/www/facture-app/

# 6. Déployer avec Docker
ssh root@votre-ip-vps << 'EOF'
cd /var/www/facture-app

# Build et démarrage
docker-compose build --no-cache
docker-compose up -d

# Attendre le démarrage
sleep 10

# Vérifier les conteneurs
docker-compose ps

exit
EOF
```

---

## ÉTAPE 5: VÉRIFICATION DU DÉPLOIEMENT

### Test d'accessibilité
```bash
# Test depuis votre machine locale
curl -I http://votre-ip-vps

# Ou depuis le navigateur
# http://votre-ip-vps
```

### Logs sur le VPS
```bash
# Connecter au VPS
ssh root@votre-ip-vps

# Voir les logs
cd /var/www/facture-app
docker-compose logs

# Vérifier les conteneurs
docker-compose ps

# Redémarrer si nécessaire
docker-compose restart
```

---

## ÉTAPE 6: CONFIGURATION HTTPS (Optionnel)

### Installation de Let's Encrypt
```bash
# Sur le VPS
ssh root@votre-ip-vps

# Installer Certbot
apt update && apt install -y certbot python3-certbot-nginx

# Obtenir le certificat
certbot --nginx -d votre-domaine.com

# Renouvellement automatique
crontab -e
# Ajouter: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## DÉPANNAGE

### Problème 1: Connexion SSH refusée
```bash
# Vérifier que la clé SSH est correcte
ssh -v root@votre-ip-vps

# Ajouter la clé publique manuellement
ssh-copy-id root@votre-ip-vps
```

### Problème 2: Docker non installé
```bash
# Sur le VPS
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Installer Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Problème 3: Application inaccessible
```bash
# Vérifier les conteneurs
docker ps

# Vérifier les logs
docker logs facture-app

# Redémarrer
docker-compose restart
```

---

## RÉSULTAT FINAL

Après déploiement réussi :
- **URL** : `http://votre-ip-vps`
- **Application** : KELIOS IA 100% fonctionnelle
- **Monitoring** : `docker-compose logs`
- **Management** : `docker-compose restart/stop/start`

---

## SUPPORT

### Commandes utiles
```bash
# Gestion des conteneurs
docker-compose ps
docker-compose logs
docker-compose restart
docker-compose down
docker-compose up -d

# Monitoring
htop
df -h
free -h

# Logs système
tail -f /var/log/nginx/error.log
```

---

**Votre KELIOS IA est maintenant prête pour le déploiement manuel sur Hostinger Ubuntu VPS !**
