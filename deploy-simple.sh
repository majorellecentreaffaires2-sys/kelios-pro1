#!/bin/bash

# Script de déploiement simple pour KELIOS IA (sans SSH/FTP)
# Déploie uniquement le frontend statique sur Hostinger

echo "🚀 DÉPLOIEMENT SIMPLE KELIOS IA"
echo "=================================="

# Configuration
DEPLOY_HOST="194.164.77.52"
DEPLOY_USER="keliospro"  # Utilisateur FTP Hostinger
DEPLOY_PASS=""  # À configurer via variable d'environnement
DEPLOY_PATH="/public_html/facture-app"

echo "📋 Configuration:"
echo "  Hôte: $DEPLOY_HOST"
echo "  User: $DEPLOY_USER"
echo "  Path: $DEPLOY_PATH"
echo ""

# Vérifier si le build existe
echo "🔍 Vérification du build..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ Erreur: Le build frontend n'existe pas."
    echo "Lancement du build..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors du build."
        exit 1
    fi
fi

echo "✅ Build frontend trouvé"
echo ""

# Vérifier le mot de passe
if [ -z "$DEPLOY_PASS" ]; then
    echo "⚠️  Mot de passe non configuré."
    echo "Utilisation: DEPLOY_PASS=votre_mot_de_passe ./deploy-simple.sh"
    exit 1
fi

# Création du script FTP
cat > /tmp/ftp-deploy.txt << EOF
open $DEPLOY_HOST
user $DEPLOY_USER $DEPLOY_PASS
cd $DEPLOY_PATH
rm -rf *
mkdir -p $DEPLOY_PATH
cd $DEPLOY_PATH
mput -R dist/
quit
EOF

echo "📤 Déploiement via FTP..."
if command -v ftp &> /dev/null; then
    ftp -n < /tmp/ftp-deploy.txt
elif command -v lftp &> /dev/null; then
    echo "Utilisation de lftp..."
    lftp -u $DEPLOY_USER,$DEPLOY_PASS -e "set ssl:verify-certificate no; open $DEPLOY_HOST; cd $DEPLOY_PATH; rm -rf *; mirror -R dist/ .; quit"
else
    echo "❌ Erreur: FTP client non trouvé."
    rm -f /tmp/ftp-deploy.txt
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "✅ Déploiement réussi !"
    echo ""
    echo "🌐 Application déployée à:"
    echo "   http://$DEPLOY_HOST"
    echo ""
    echo "📝 Note: Seul le frontend statique est déployé."
    echo "   Le backend nécessite un accès SSH pour fonctionner."
    echo ""
    echo "🔑 Identifiants de test:"
    echo "   Email: demo@kelios.local"
    echo "   Mot de passe: password123"
else
    echo "❌ Erreur lors du déploiement"
    exit 1
fi

rm -f /tmp/ftp-deploy.txt
