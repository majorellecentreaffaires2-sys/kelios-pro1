#!/bin/bash

# DÉPLOIEMENT FINAL DÉFINITIF - KELIOS IA
# UTILISATION DIRECTE - PAS DE GITHUB ACTIONS

echo "?? DÉPLOIEMENT FINAL DÉFINITIF - KELIOS IA"
echo "======================================"

# Configuration finale
VPS_HOST="194.164.77.52"
VPS_USER="devadmin"
VPS_PASSWORD="MaRouane2121@"
DOMAIN="https://www.kelios-pro.com"
DEPLOY_DIR="/home/devadmin/kelios-pro"

echo "?? Configuration:"
echo "  VPS: $VPS_HOST"
echo "  User: $VPS_USER"
echo "  Domain: $DOMAIN"
echo "  Directory: $DEPLOY_DIR"
echo ""

# ÉTAPE 1: Vérification locale
echo "?? ÉTAPE 1: Vérification locale"
echo "==============================="
if [ ! -f "dist/index.html" ]; then
    echo "?? Build frontend manquant..."
    echo "?? Lancement du build..."
    npm run build
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "?? Erreur: docker-compose.yml manquant"
    exit 1
fi

echo "?? Fichiers locaux vérifiés"
echo ""

# ÉTAPE 2: Connexion SSH directe
echo "?? ÉTAPE 2: Connexion SSH directe"
echo "==============================="

# Utiliser sshpass pour la connexion
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 $VPS_USER@$VPS_HOST << 'REMOTE_SCRIPT'

echo "?? Connexion réussie au VPS"
echo "?? User: $(whoami)"
echo "?? Directory: $(pwd)"

# ÉTAPE 3: Préparation du VPS
echo ""
echo "?? ÉTAPE 3: Préparation du VPS"
echo "============================"

# Créer le répertoire
mkdir -p /home/devadmin/kelios-pro
cd /home/devadmin/kelios-pro

# Installer Docker si nécessaire
if ! command -v docker &> /dev/null; then
    echo "?? Installation de Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker devadmin
fi

# Installer Docker Compose si nécessaire
if ! command -v docker-compose &> /dev/null; then
    echo "?? Installation de Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "?? Docker prêt"
docker --version
docker-compose --version

# ÉTAPE 4: Téléchargement des fichiers
echo ""
echo "?? ÉTAPE 4: Téléchargement des fichiers"
echo "===================================="

# Cloner le repository
if [ -d ".git" ]; then
    echo "?? Mise à jour du repository..."
    git pull origin main
else
    echo "?? Clonage du repository..."
    git clone https://github.com/majorellecentreaffaires2-sys/kelios-pro1.git .
fi

# ÉTAPE 5: Construction et déploiement
echo ""
echo "?? ÉTAPE 5: Construction et déploiement"
echo "===================================="

# Arrêter les conteneurs existants
echo "?? Arrêt des conteneurs existants..."
docker-compose down --remove-orphans 2>/dev/null || true

# Construire les images
echo "?? Construction des images..."
docker-compose build --no-cache

# Démarrer les conteneurs
echo "?? Démarrage des conteneurs..."
docker-compose up -d

# Attendre le démarrage
echo "?? Attente du démarrage (30 secondes)..."
sleep 30

# ÉTAPE 6: Vérification
echo ""
echo "?? ÉTAPE 6: Vérification"
echo "======================"

# Vérifier les conteneurs
echo "?? Statut des conteneurs:"
docker-compose ps

# Vérifier l'application
echo "?? Test de l'application locale:"
curl -f http://localhost/api/test || echo "?? API test échoué"

# Vérifier les ports
echo "?? Ports ouverts:"
netstat -tulpn | grep -E ':(80|3001)' || echo "?? Ports non détectés"

echo ""
echo "?? DÉPLOIEMENT TERMINÉ SUR LE VPS"
echo "?? Application accessible à: http://194.164.77.52"
echo "?? Domaine: https://www.kelios-pro.com"
echo "?? Admin: Tahaa / Zll292518@@"

REMOTE_SCRIPT

if [ $? -eq 0 ]; then
    echo ""
    echo "?? DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
    echo "=================================="
    echo ""
    echo "?? Application accessible à:"
    echo "   http://194.164.77.52"
    echo "   https://www.kelios-pro.com"
    echo ""
    echo "?? Administration:"
    echo "   User: Tahaa"
    echo "   Password: Zll292518@@"
    echo ""
    echo "?? Connexion SSH:"
    echo "   ssh devadmin@194.164.77.52"
    echo "   Password: MaRouane2121@"
    echo ""
    echo "?? Vérification:"
    echo "   curl http://194.164.77.52/api/test"
else
    echo "?? ERREUR LORS DU DÉPLOIEMENT"
    echo "?? Vérifiez les logs ci-dessus"
    exit 1
fi
