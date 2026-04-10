#!/bin/bash

# Script build local pour cPanel Hostinger
# Utilisation: ./deploy.sh
# Crée facture-app-cpanel.zip prêt pour upload

if [ $# -eq 0 ]; then
    echo "❌ Erreur: Veuillez fournir un message de commit"
    echo "Usage: ./deploy.sh \"Message de commit\""
    exit 1
fi

COMMIT_MESSAGE="$1"

echo "🚀 Déploiement automatique Kelios Pro vers GitHub"
echo "================================================="

# Vérifier l'état du repo
echo "📊 Vérification de l'état du repository..."
if git diff --quiet && git diff --staged --quiet; then
    echo "ℹ️ Aucune modification détectée"
    exit 0
else
    echo "✅ Modifications détectées"
    git status --short
fi

# Test du build avant commit
echo "🔨 Test du build avant déploiement..."
if npm run build; then
    echo "✅ Build réussi"
else
    echo "❌ Échec du build - Annulation du déploiement"
    exit 1
fi

# Ajouter tous les fichiers
echo "📁 Ajout des fichiers modifiés..."
git add .

# Commit avec le message fourni
echo "💾 Création du commit..."
git commit -m "$COMMIT_MESSAGE"

# Push vers GitHub
echo "⬆️ Push vers GitHub (kelios/main)..."
echo "✅ Utilisez ./deploy-cpanel.sh pour générer ZIP cPanel
echo "📦 Ou npm run deploy:cpanel"
echo "Upload vers public_html/ puis pm2 restart all"
