#!/bin/bash

# Script d'aide pour configurer SSH avec Hostinger
# Utilisation: ./setup-ssh.sh

echo "🔑 Configuration SSH pour Hostinger"
echo "==================================="

# Vérifier si une clé SSH existe
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "📝 Génération d'une nouvelle clé SSH..."
    ssh-keygen -t rsa -b 4096 -C "kelios-deploy@hostinger.com" -f ~/.ssh/id_rsa -N ""
    echo "✅ Clé SSH générée"
else
    echo "ℹ️ Une clé SSH existe déjà"
fi

echo ""
echo "🔑 Votre clé PUBLIQUE (à ajouter sur Hostinger) :"
echo "=================================================="
cat ~/.ssh/id_rsa.pub

echo ""
echo "🔑 Votre clé PRIVÉE (pour GitHub Secrets) :"
echo "==========================================="
cat ~/.ssh/id_rsa

echo ""
echo "� Comment trouver votre HOSTINGER_USER :"
echo "=========================================="
echo "• Business Web Hosting : Files → File Manager (ex: u123456789)"
echo "• VPS/Cloud : Servers → SSH Access"
echo "• Via SSH : commande 'whoami'"
echo ""

echo "�📋 Instructions :"
echo "================="
echo "1. Copiez la clé PUBLIQUE ci-dessus"
echo "2. Allez sur Hostinger → Files → SSH Keys"
echo "3. Ajoutez la clé publique"
echo "4. Notez votre username SSH (devadmin)"
echo "5. Sur GitHub → Settings → Secrets and variables → Actions"
echo "6. Ajoutez ces secrets :"
echo "   - HOSTINGER_HOST = 194.164.77.52"
echo "   - HOSTINGER_USER = devadmin"
echo "   - DEPLOY_KEY = [collez la clé privée ci-dessus]"

echo ""
echo "🧪 Test de la connexion SSH :"
echo "ssh -T $HOSTINGER_USER@$HOSTINGER_HOST"