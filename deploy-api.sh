#!/bin/bash

# Script de déploiement via API pour KELIOS IA
# Utilise l'API Hostinger pour déployer sans SSH

echo "🚀 DÉPLOIEMENT API KELIOS IA"
echo "=================================="

# Configuration
API_HOST="https://api.hostinger.com"
API_TOKEN=""  # À configurer via variable d'environnement
DOMAIN="kelios-pro.com"

echo "📋 Configuration:"
echo "  API: $API_HOST"
echo "  Domain: $DOMAIN"
echo ""

# Vérifier si les fichiers nécessaires existent
echo "🔍 Vérification des fichiers..."
if [ ! -f "dist/index.html" ]; then
    echo "❌ Erreur: Le build frontend n'existe pas. Lancez 'npm run build' d'abord."
    exit 1
fi

echo "✅ Build frontend trouvé"
echo ""

# Vérifier le token API
if [ -z "$API_TOKEN" ]; then
    echo "⚠️  Token API non configuré."
    echo "Utilisation: API_TOKEN=votre_token ./deploy-api.sh"
    exit 1
fi

# Créer le payload pour l'API
PAYLOAD=$(cat << EOF
{
    "action": "deploy",
    "domain": "$DOMAIN",
    "files": {
        "frontend": {
            "path": "public_html/facture-app",
            "source": "dist/"
        },
        "config": {
            "docker-compose.yml": "docker-compose.yml",
            "Dockerfile": "Dockerfile",
            "Dockerfile.backend": "Dockerfile.backend"
        }
    }
}
EOF
)

echo "📤 Envoi des fichiers à l'API Hostinger..."
echo "  Domaine: $DOMAIN"
echo "  Taille du build: $(du -sh dist | cut -f1)"
echo ""

# Upload du frontend via API
echo "📁 Upload du frontend..."
if command -v curl &> /dev/null; then
    FRONTEND_RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        "$API_HOST/v1/deploy/frontend")
    
    if echo "$FRONTEND_RESPONSE" | grep -q '"success":true'; then
        echo "✅ Frontend déployé avec succès"
    else
        echo "❌ Erreur lors du déploiement frontend:"
        echo "$FRONTEND_RESPONSE"
    fi
else
    echo "❌ Erreur: curl non disponible"
    exit 1
fi

# Upload des fichiers de configuration
echo "📄 Upload des fichiers de configuration..."
CONFIG_PAYLOAD=$(cat << EOF
{
    "action": "upload_config",
    "domain": "$DOMAIN",
    "files": {
        "docker-compose.yml": "$(cat docker-compose.yml | base64 -w 0)",
        "Dockerfile": "$(cat Dockerfile | base64 -w 0)",
        "Dockerfile.backend": "$(cat Dockerfile.backend | base64 -w 0)"
    }
}
EOF
)

CONFIG_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$CONFIG_PAYLOAD" \
    "$API_HOST/v1/deploy/config")

if echo "$CONFIG_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Configuration déployée avec succès"
else
    echo "❌ Erreur lors du déploiement de la configuration:"
    echo "$CONFIG_RESPONSE"
fi

# Démarrage des services
echo "🚀 Démarrage des services..."
START_PAYLOAD=$(cat << EOF
{
    "action": "start_services",
    "domain": "$DOMAIN"
}
EOF
)

START_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$START_PAYLOAD" \
    "$API_HOST/v1/services/start")

if echo "$START_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Services démarrés avec succès"
else
    echo "❌ Erreur lors du démarrage des services:"
    echo "$START_RESPONSE"
fi

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo ""
echo "🌐 Application accessible à:"
echo "   https://$DOMAIN"
echo ""
echo "🔑 Identifiants de test:"
echo "   Email: demo@kelios.local"
echo "   Mot de passe: password123"
echo ""
echo "⚙️ Endpoints:"
echo "   Frontend: https://$DOMAIN"
echo "   API: https://$DOMAIN/api"
echo "   Test: https://$DOMAIN/api/test"
echo ""
echo "📊 Monitoring:"
echo "   Vérifier les logs: curl -H \"Authorization: Bearer $API_TOKEN\" $API_HOST/v1/logs"
echo "   Statut services: curl -H \"Authorization: Bearer $API_TOKEN\" $API_HOST/v1/services/status"
