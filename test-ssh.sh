#!/bin/bash

# Script pour tester la connexion SSH avec différents usernames possibles
# Utilisation: ./test-ssh.sh

echo "🧪 Test de connexion SSH Hostinger"
echo "=================================="

HOST="194.164.77.52"
USERNAMES=("devadmin" "u123456789" "u987654321" "u000000000" "root" "$(whoami)")

echo "Test de connexion avec différents usernames possibles..."
echo "Serveur: $HOST"
echo ""

for user in "${USERNAMES[@]}"; do
    echo "🔍 Test avec username: $user"
    if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -T "$user@$HOST" "echo '✅ Connexion réussie avec $user'" 2>/dev/null; then
        echo "🎉 SUCCÈS ! Votre HOSTINGER_USER est: $user"
        echo ""
        echo "📋 Utilisez ce username pour configurer GitHub Secrets :"
        echo "HOSTINGER_USER = $user"
        exit 0
    else
        echo "❌ Échec avec $user"
    fi
    echo ""
done

echo "❌ Aucun test n'a réussi automatiquement."
echo ""
echo "🔍 Vérifiez manuellement dans votre panneau Hostinger :"
echo "• Business Web Hosting : Files → File Manager"
echo "• VPS/Cloud : Servers → SSH Access"
echo ""
echo "💡 Test manuel: ssh VOTRE_USERNAME@$HOST"