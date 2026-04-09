#!/bin/bash

echo "🚀 Test de déploiement local pour Kelios Pro"
echo "==========================================="

# Vérifier Node.js
echo "📦 Vérification Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION détectée. Version 18+ requise."
    exit 1
fi
echo "✅ Node.js $(node --version) détecté"

# Nettoyer le cache
echo "🧹 Nettoyage du cache npm..."
npm cache clean --force

# Installer les dépendances
echo "📥 Installation des dépendances..."
if npm ci --prefer-offline --no-audit; then
    echo "✅ Dépendances installées avec succès"
else
    echo "❌ Échec de l'installation des dépendances"
    exit 1
fi

# Vérifier les dépendances
echo "🔍 Vérification des dépendances..."
npm list --depth=0

# Build l'application
echo "🔨 Build de l'application..."
if npm run build; then
    echo "✅ Build réussi"
else
    echo "❌ Échec du build"
    exit 1
fi

# Vérifier le dossier dist
echo "📂 Vérification du build..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Dossier dist créé avec index.html"
    ls -la dist/
else
    echo "❌ Dossier dist manquant ou index.html absent"
    exit 1
fi

echo ""
echo "🎉 Test local réussi !"
echo "Votre application est prête pour le déploiement GitHub Actions."
echo ""
echo "Pour déployer :"
echo "git add ."
echo "git commit -m 'Ready for deployment'"
echo "git push origin main"