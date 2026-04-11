#!/bin/bash

# Script de déploiement FTP pour KELIOS IA
# Utilise ce script si SSH n'est pas disponible

echo "🚀 DÉPLOIEMENT FTP KELIOS IA"
echo "=================================="

# Configuration FTP
FTP_HOST="194.164.77.52"
FTP_USER="keliospro"  # À adapter selon votre configuration Hostinger
FTP_PASSWORD=""  # À configurer via variable d'environnement
FTP_PORT="21"
DEPLOY_DIR="/public_html/facture-app"

echo "📋 Configuration FTP:"
echo "  Hôte: $FTP_HOST:$FTP_PORT"
echo "  User: $FTP_USER"
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

# Vérifier le mot de passe FTP
if [ -z "$FTP_PASSWORD" ]; then
    echo "⚠️  Mot de passe FTP non configuré."
    echo "Utilisation: FTP_PASSWORD=votre_mot_de_passe ./deploy-ftp.sh"
    exit 1
fi

# Installation de lftp si nécessaire
if ! command -v lftp &> /dev/null; then
    echo "📦 Installation de lftp..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y lftp
    elif command -v yum &> /dev/null; then
        sudo yum install -y lftp
    else
        echo "❌ Erreur: Veuillez installer lftp manuellement."
        exit 1
    fi
fi

# Création du script de commandes FTP
cat > /tmp/ftp-commands.txt << EOF
set ftp:ssl-allow no
set ftp:passive-mode yes
set ssl:verify-certificate no
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR
rm -rf *
mput -r dist/
put docker-compose.yml
put Dockerfile
put Dockerfile.backend
quit
EOF

echo "📤 Déploiement des fichiers via FTP..."
lftp -u $FTP_USER,$FTP_PASSWORD -p $FTP_PORT $FTP_HOST < /tmp/ftp-commands.txt

if [ $? -eq 0 ]; then
    echo "✅ Fichiers transférés avec succès via FTP"
    rm -f /tmp/ftp-commands.txt
else
    echo "❌ Erreur lors du transfert FTP"
    rm -f /tmp/ftp-commands.txt
    exit 1
fi

echo ""
echo "🌐 Déploiement terminé !"
echo "Application accessible à: http://$FTP_HOST"
echo ""
echo "🔑 Identifiants de test:"
echo "   Email: demo@kelios.local"
echo "   Mot de passe: password123"
echo ""
echo "⚠️  Note: Le backend Docker nécessite un accès SSH pour démarrer les conteneurs."
