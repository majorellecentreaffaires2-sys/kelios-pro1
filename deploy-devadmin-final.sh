#!/bin/bash

# Script de déploiement final pour KELIOS IA avec devadmin
# Mot de passe devadmin: MaRouane2121@

echo "?? DÉPLOIEMENT FINAL KELIOS IA - DEVADMIN"
echo "======================================="

# Configuration finale avec devadmin
VPS_HOST="194.164.77.52"
VPS_PORT="22"
VPS_USER="devadmin"
VPS_PASSWORD="MaRouane2121@"
DOMAIN="https://www.kelios-pro.com"
ADMIN_USER="Tahaa"
ADMIN_PASSWORD="Zll292518@@"
DEPLOY_DIR="/home/devadmin/kelios-pro"

echo "?? Configuration finale:"
echo "  VPS: $VPS_HOST:$VPS_PORT"
echo "  User: $VPS_USER"
echo "  Domain: $DOMAIN"
echo "  Admin: $ADMIN_USER"
echo "  Directory: $DEPLOY_DIR"
echo ""

# Vérifier si les fichiers nécessaires existent
echo "?? Vérification des fichiers..."
if [ ! -f "dist/index.html" ]; then
    echo "?? Erreur: Le build frontend n'existe pas. Lancez 'npm run build' d'abord."
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "?? Erreur: docker-compose.yml introuvable."
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo "?? Erreur: Dockerfile introuvable."
    exit 1
fi

if [ ! -f "Dockerfile.backend" ]; then
    echo "?? Erreur: Dockerfile.backend introuvable."
    exit 1
fi

echo "?? Tous les fichiers nécessaires sont présents"
echo ""

# Installation de sshpass si nécessaire
if ! command -v sshpass &> /dev/null; then
    echo "?? Installation de sshpass..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    else
        echo "?? Erreur: Veuillez installer sshpass manuellement."
        exit 1
    fi
fi

# Test de connexion SSH avec devadmin et mot de passe
echo "?? Test de connexion SSH avec devadmin..."
if sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p $VPS_PORT $VPS_USER@$VPS_HOST "echo 'Connexion SSH réussie avec devadmin'"; then
    echo "?? Connexion SSH réussie avec devadmin"
else
    echo "?? Erreur: Impossible de se connecter avec devadmin"
    echo "Vérifiez:"
    echo "  - L'adresse IP du VPS"
    echo "  - Le port SSH (22 par défaut)"
    echo "  - L'utilisateur et le mot de passe devadmin"
    exit 1
fi

echo ""

# Déploiement des fichiers
echo "?? Déploiement des fichiers..."

# Créer le répertoire de déploiement
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST "mkdir -p $DEPLOY_DIR"

# Copier les fichiers
echo "  ?? Copie du build frontend..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -P $VPS_PORT -r dist/* $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

echo "  ?? Copie de docker-compose.yml..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -P $VPS_PORT docker-compose.yml $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

echo "  ?? Copie de Dockerfile..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -P $VPS_PORT Dockerfile $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

echo "  ?? Copie de Dockerfile.backend..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no -P $VPS_PORT Dockerfile.backend $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

echo "?? Fichiers copiés avec succès"
echo ""

# Déploiement des services Docker
echo "?? Déploiement des services Docker..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST << EOF
cd $DEPLOY_DIR

echo "  ?? Installation de Docker si nécessaire..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker devadmin
fi

if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo "  ?? Arrêt des conteneurs existants..."
docker-compose down --remove-orphans 2>/dev/null || true

echo "  ?? Construction des images..."
docker-compose build --no-cache

echo "  ?? Démarrage des conteneurs..."
docker-compose up -d

echo "  ?? Attente du démarrage..."
sleep 20

echo "  ?? Vérification du statut..."
if docker-compose ps | grep -q "Up"; then
    echo "?? Déploiement réussi !"
    echo ""
    echo "?? Services actifs:"
    docker-compose ps
else
    echo "?? Erreur lors du démarrage des conteneurs"
    echo "?? Logs des conteneurs:"
    docker-compose logs
    exit 1
fi

echo "  ?? Nettoyage des images non utilisées..."
docker image prune -f

EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "?? DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
    echo ""
    echo "?? Application accessible à:"
    echo "   $DOMAIN"
    echo ""
    echo "?? Administration:"
    echo "   User: $ADMIN_USER"
    echo "   Password: $ADMIN_PASSWORD"
    echo ""
    echo "?? Endpoints:"
    echo "   Frontend: $DOMAIN"
    echo "   API: $DOMAIN/api"
    echo "   Test: $DOMAIN/api/test"
    echo ""
    echo "?? Connexion SSH:"
    echo "   ssh devadmin@194.164.77.52"
    echo "   Password: $VPS_PASSWORD"
    echo ""
    echo "?? Vérification:"
    echo "   curl http://194.164.77.52/api/test"
else
    echo "?? Erreur lors du déploiement"
    exit 1
fi
