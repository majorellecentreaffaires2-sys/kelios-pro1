#!/bin/bash

# Script de déploiement automatique pour Kelios Pro
# Utilisation: ./deploy.sh "Message de commit"

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
if git push kelios main; then
    echo "🎉 Déploiement réussi !"
    echo "📍 URL: https://github.com/majorellecentreaffaires2-sys/kelios-pro1"
    echo "🚀 GitHub Actions va déployer automatiquement sur Hostinger"
else
    echo "❌ Échec du push"
    exit 1
fi