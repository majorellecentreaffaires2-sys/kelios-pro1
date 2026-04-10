#!/bin/bash

# Script de déploiement pour Hostinger Ubuntu VPS
# Usage: ./deploy-ubuntu.sh [user] [host] [port]

VPS_USER=${1:-"root"}
VPS_HOST=${2:-"your-vps-ip"}
VPS_PORT=${3:-"22"}
PROJECT_NAME="facture-app"
DEPLOY_PATH="/var/www/$PROJECT_NAME"

echo "🚀 Déploiement de KELIOS IA sur Hostinger Ubuntu VPS..."
echo "📍 Cible: $VPS_USER@$VPS_HOST:$VPS_PORT"
echo "📂 Chemin: $DEPLOY_PATH"

# Vérifier si SSH est disponible
if ! command -v ssh &> /dev/null; then
    echo "❌ SSH n'est pas installé. Veuillez installer OpenSSH."
    exit 1
fi

# Vérifier si Docker est installé sur le VPS
echo "🔍 Vérification de Docker sur le VPS..."
ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker n'est pas installé sur le VPS"
        echo "📦 Installation de Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
        usermod -aG docker $USER
    else
        echo "✅ Docker est déjà installé"
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose n'est pas installé sur le VPS"
        echo "📦 Installation de Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    else
        echo "✅ Docker Compose est déjà installé"
    fi
    exit
EOF

# Créer le répertoire de déploiement
echo "📂 Création du répertoire de déploiement..."
ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    mkdir -p $DEPLOY_PATH
    mkdir -p /var/log/$PROJECT_NAME
    exit
EOF

# Copier les fichiers du projet
echo "📤 Copie des fichiers du projet..."
scp -P $VPS_PORT -o StrictHostKeyChecking=no -r \
    Dockerfile \
    docker-compose.yml \
    nginx.conf \
    dist/ \
    $VPS_USER@$VPS_HOST:$DEPLOY_PATH/

# Déployer l'application avec Docker
echo "🐳 Déploiement avec Docker Compose..."
ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    cd $DEPLOY_PATH
    
    # Arrêter les conteneurs existants
    docker-compose down --remove-orphans
    
    # Construire et démarrer les conteneurs
    docker-compose up --build -d
    
    # Vérifier le statut
    sleep 10
    if docker-compose ps | grep -q "Up"; then
        echo "✅ Conteneurs démarrés avec succès"
    else
        echo "❌ Erreur lors du démarrage des conteneurs"
        docker-compose logs
        exit 1
    fi
    
    # Nettoyer les images inutilisées
    docker image prune -f
    
    exit
EOF

# Configurer Nginx pour le reverse proxy (optionnel)
echo "🌐 Configuration du reverse proxy Nginx..."
ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    # Créer la configuration Nginx
    cat > /etc/nginx/sites-available/$PROJECT_NAME << 'NGINX_CONF'
server {
    listen 80;
    server_name $VPS_HOST;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_CONF

    # Activer le site
    ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    
    # Tester la configuration
    nginx -t
    
    # Redémarrer Nginx
    systemctl restart nginx
    
    exit
EOF

# Vérifier le déploiement
echo "🔍 Vérification du déploiement..."
sleep 15

# Test de santé de l'application
if curl -f -s "http://$VPS_HOST" > /dev/null; then
    echo "✅ Application accessible à http://$VPS_HOST"
else
    echo "❌ Application non accessible. Vérification des logs..."
    ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
        echo "=== Logs Docker Compose ==="
        docker-compose logs
        echo "=== Logs Nginx ==="
        tail -20 /var/log/nginx/error.log
        exit
    EOF'
    exit 1
fi

# Afficher les informations de déploiement
echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "📍 URL de l'application: http://$VPS_HOST"
echo "📂 Répertoire: $DEPLOY_PATH"
echo "🐳 Conteneurs: docker-compose ps (sur le VPS)"
echo "📊 Logs: docker-compose logs (sur le VPS)"
echo ""
echo "🔧 Commandes utiles sur le VPS:"
echo "  cd $DEPLOY_PATH"
echo "  docker-compose ps"
echo "  docker-compose logs"
echo "  docker-compose restart"
echo "  docker-compose down"
echo ""
echo "🌐 Pour configurer HTTPS:"
echo "  sudo certbot --nginx -d $VPS_HOST"
echo ""

# Afficher le statut final
ssh -p $VPS_PORT -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "=== STATUT FINAL ==="
    docker-compose ps
    echo "=== ESPACE DISQUE ==="
    df -h
    echo "=== MÉMOIRE ==="
    free -h
    exit
EOF
