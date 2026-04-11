# COMMANDES MANUELLES - DÉPLOIEMENT KELIOS IA

## ÉTAPES EXACTES À EXÉCUTER MANUELLEMENT

### ÉTAPE 1 : CONNEXION AU VPS
```bash
ssh devadmin@194.164.77.52
# Mot de passe : MaRouane2121@
```

### ÉTAPE 2 : NAVIGATION ET CRÉATION DU RÉPERTOIRE
```bash
cd /home/devadmin/
mkdir -p kelios-pro
cd kelios-pro
```

### ÉTAPE 3 : INSTALLATION DE DOCKER
```bash
# Installation de Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker devadmin

# Installation de Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérification
docker --version
docker-compose --version
```

### ÉTAPE 4 : CLONAGE DU REPOSITORY
```bash
# Clonage du projet
git clone https://github.com/majorellecentreaffaires2-sys/kelios-pro1.git .

# Vérification des fichiers
ls -la
```

### ÉTAPE 5 : CONSTRUCTION DES IMAGES
```bash
# Construction des images Docker
docker-compose build --no-cache
```

### ÉTAPE 6 : DÉMARRAGE DES CONTENEURS
```bash
# Démarrage des services
docker-compose up -d

# Attendre 30 secondes
sleep 30
```

### ÉTAPE 7 : VÉRIFICATION
```bash
# Vérifier les conteneurs
docker-compose ps

# Vérifier l'application
curl http://localhost/api/test

# Vérifier les ports
netstat -tulpn | grep -E ':(80|3001)'
```

### ÉTAPE 8 : TEST FINAL
```bash
# Test de l'API
curl -f http://localhost/api/test

# Test du frontend
curl -f http://localhost/

# Logs si problème
docker-compose logs
```

---

## SI PROBLÈME DE DOCKER

### Alternative : Installation manuelle sans Docker

#### 1. Installation Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Installation des dépendances
```bash
npm install
```

#### 3. Build du frontend
```bash
npm run build
```

#### 4. Démarrage du backend
```bash
node local-server-fixed.js &
```

#### 5. Installation Nginx
```bash
sudo apt update
sudo apt install -y nginx
```

#### 6. Configuration Nginx
```bash
sudo cp nginx.conf /etc/nginx/sites-available/kelios-pro
sudo ln -s /etc/nginx/sites-available/kelios-pro /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## VÉRIFICATION FINALE

### Test local sur VPS
```bash
# API
curl http://localhost:3001/api/test

# Frontend
curl http://localhost/

# Externe
curl http://194.164.77.52/api/test
curl http://194.164.77.52/
```

### Si tout fonctionne
- **Frontend** : http://194.164.77.52
- **API** : http://194.164.77.52/api
- **Admin** : Tahaa / Zll292518@@

---

## DÉPANNAGE

### Si Docker ne démarre pas
```bash
# Redémarrer Docker
sudo systemctl restart docker

# Vérifier les logs
sudo journalctl -u docker

# Nettoyer
docker system prune -a
```

### Si ports bloqués
```bash
# Vérifier le pare-feu
sudo ufw status

# Ouvrir les ports
sudo ufw allow 80
sudo ufw allow 3001
sudo ufw allow 22
```

### Si problème de permissions
```bash
# Donner les permissions à devadmin
sudo chown -R devadmin:devadmin /home/devadmin/kelios-pro

# Ajouter au groupe docker
sudo usermod -aG docker devadmin
```

---

## RÉSUMÉ

1. **Connexion** : `ssh devadmin@194.164.77.52`
2. **Installation** : Docker + Docker Compose
3. **Clonage** : `git clone https://github.com/majorellecentreaffaires2-sys/kelios-pro1.git .`
4. **Build** : `docker-compose build --no-cache`
5. **Démarrage** : `docker-compose up -d`
6. **Vérification** : `curl http://localhost/api/test`

**C'est tout ! L'application sera accessible à http://194.164.77.52**
