#!/bin/bash

# Script pour afficher seulement la DEPLOY_KEY (clé SSH privée)
# Utilisation: ./show-deploy-key.sh

echo "🔑 Votre DEPLOY_KEY (clé SSH privée pour GitHub)"
echo "================================================"

if [ -f ~/.ssh/id_rsa ]; then
    echo ""
    cat ~/.ssh/id_rsa
    echo ""
    echo "📋 Copiez TOUTE cette clé (de -----BEGIN à -----END) dans GitHub Secret DEPLOY_KEY"
else
    echo "❌ Aucune clé SSH trouvée !"
    echo "Lancez d'abord : ./setup-ssh.sh"
fi