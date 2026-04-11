#!/bin/bash

# Script de déploiement manuel pour KELIOS IA
# Utilise ce script si GitHub Actions échoue à cause des problèmes SSH

echo "🚀 DÉPLOIEMENT MANUEL KELIOS IA"
echo "=================================="

# Configuration
VPS_HOST="194.164.77.52"
VPS_PORT="22"
VPS_USER="root"
DEPLOY_DIR="/var/www/facture-app"

echo "📋 Configuration:"
echo "  VPS: $VPS_HOST:$VPS_PORT"
echo "  User: $VPS_USER"
echo "  Directory: $DEPLOY_DIR"
echo ""

# Vérifier si les fichiers nécessaires existent
echo "🔍 Vérification des fichiers..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ Erreur: Le build frontend n'existe pas. Lancez 'npm run build' d'abord."
    exit 1
fi

if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erreur: docker-compose.yml introuvable."
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo "❌ Erreur: Dockerfile introuvable."
    exit 1
fi

if [ ! -f "Dockerfile.backend" ]; then
    echo "❌ Erreur: Dockerfile.backend introuvable."
    exit 1
fi

echo "✅ Tous les fichiers nécessaires sont présents"
echo ""

# Test de connexion SSH
echo "🔑 Test de connexion SSH..."
if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST "echo 'Connexion SSH réussie'"; then
    echo "✅ Connexion SSH réussie"
else
    echo "❌ Erreur: Impossible de se connecter au VPS"
    echo "Vérifiez:"
    echo "  - L'adresse IP du VPS"
    echo "  - Le port SSH (22 par défaut)"
    echo "  - L'utilisateur SSH"
    echo "  - La clé SSH autorisée sur le VPS"
    exit 1
fi

echo ""

# Déploiement des fichiers
echo "📤 Déploiement des fichiers..."

# Créer le répertoire de déploiement
ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST "mkdir -p $DEPLOY_DIR"

# Copier les fichiers
echo "  📁 Copie du build frontend..."
scp -o StrictHostKeyChecking=no -P $VPS_PORT -r dist/* $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

echo "  📄 Copie de docker-compose.yml..."
scp -o StrictHostKeyChecking=no -P $VPS_PORT docker-compose.yml $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

echo "  🐳 Copie de Dockerfile..."
scp -o StrictHostKeyChecking=no -P $VPS_PORT Dockerfile $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

echo "  🐳 Copie de Dockerfile.backend..."
scp -o StrictHostKeyChecking=no -P $VPS_PORT Dockerfile.backend $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

echo "✅ Fichiers copiés avec succès"
echo ""

# Déploiement des services Docker
echo "🐳 Déploiement des services Docker..."
ssh -o StrictHostKeyChecking=no -p $VPS_PORT $VPS_USER@$VPS_HOST << EOF
cd $DEPLOY_DIR

echo "  🛑 Arrêt des conteneurs existants..."
docker-compose down --remove-orphans 2>/dev/null || true

echo "  🧹 Nettoyage des anciens fichiers..."
rm -rf *

echo "  🔨 Construction des images..."
docker-compose build --no-cache

echo "  🚀 Démarrage des conteneurs..."
docker-compose up -d

echo "  ⏱️ Attente du démarrage..."
sleep 15

echo "  📊 Vérification du statut..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Déploiement réussi !"
    echo ""
    echo "📋 Services actifs:"
    docker-compose ps
else
    echo "❌ Erreur lors du démarrage des conteneurs"
    echo "📋 Logs des conteneurs:"
    docker-compose logs
    exit 1
fi

echo "  🧹 Nettoyage des images non utilisées..."
docker image prune -f

EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
    echo ""
    echo "🌐 Application accessible à:"
    echo "   http://$VPS_HOST"
    echo ""
    echo "🔑 Identifiants de test:"
    echo "   Email: demo@kelios.local"
    echo "   Mot de passe: password123"
    echo ""
    echo "⚙️ Endpoints:"
    echo "   API: http://$VPS_HOST/api"
    echo "   Test: http://$VPS_HOST/api/test"
else
    echo "❌ Erreur lors du déploiement"
    exit 1
fi
