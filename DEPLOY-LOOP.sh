#!/bin/bash

# SCRIPT DE DÉPLOIEMENT EN BOUCLE - KELIOS IA
# TOURNE EN BOUCLE JUSQU'À CE QUE L'APPLICATION SOIT OPÉRATIONNELLE

echo "?? DÉPLOIEMENT EN BOUCLE - KELIOS IA"
echo "=================================="
echo "Ce script tourne en boucle jusqu'à ce que l'application soit opérationnelle"
echo ""

# Configuration
VPS_HOST="194.164.77.52"
VPS_USER="devadmin"
VPS_PASSWORD="MaRouane2121@"
DOMAIN="https://www.kelios-pro.com"
DEPLOY_DIR="/home/devadmin/kelios-pro"
MAX_ATTEMPTS=50
ATTEMPT_DELAY=30

echo "?? Configuration:"
echo "  VPS: $VPS_HOST"
echo "  User: $VPS_USER"
echo "  Domain: $DOMAIN"
echo "  Max tentatives: $MAX_ATTEMPTS"
echo "  Délai entre tentatives: ${ATTEMPT_DELAY}s"
echo ""

# Compteur de tentatives
attempt=1
success=false

# Boucle de déploiement
while [ $attempt -le $MAX_ATTEMPTS ] && [ "$success" = false ]; do
    echo "=========================================="
    echo "?? TENTATIVE $attempt / $MAX_ATTEMPTS"
    echo "=========================================="
    echo ""
    
    # ÉTAPE 1: Test de connexion SSH
    echo "?? Test de connexion SSH..."
    if sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $VPS_USER@$VPS_HOST "echo 'SSH OK'"; then
        echo "?? Connexion SSH réussie"
        
        # ÉTAPE 2: Déploiement sur le VPS
        echo "?? Déploiement sur le VPS..."
        sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
cd /home/devadmin/kelios-pro 2>/dev/null || cd /home/devadmin && mkdir -p kelios-pro && cd kelios-pro

# Installation Docker si nécessaire
if ! command -v docker &> /dev/null; then
    echo "?? Installation Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker devadmin
    newgrp docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo "?? Installation Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Clone ou mise à jour
if [ ! -d ".git" ]; then
    echo "?? Clone du repository..."
    git clone https://github.com/majorellecentreaffaires2-sys/kelios-pro1.git .
else
    echo "?? Mise à jour du repository..."
    git pull origin main
fi

# Build et déploiement
echo "?? Arrêt des conteneurs..."
docker-compose down --remove-orphans 2>/dev/null || true

echo "?? Build des images..."
docker-compose build --no-cache

echo "?? Démarrage des conteneurs..."
docker-compose up -d

echo "?? Attente du démarrage..."
sleep 20

echo "?? Vérification..."
docker-compose ps

# Test local
if curl -f http://localhost/api/test >/dev/null 2>&1; then
    echo "?? APPLICATION OPÉRATIONNELLE SUR LE VPS !"
    echo "?? Frontend: http://localhost"
    echo "?? API: http://localhost/api"
    echo "?? Test: http://localhost/api/test"
    exit 0
else
    echo "?? Application pas encore opérationnelle"
    echo "?? Logs:"
    docker-compose logs --tail=10
fi
EOF
        
        # Vérification du code de sortie
        if [ $? -eq 0 ]; then
            echo "?? DÉPLOIEMENT RÉUSSI SUR LE VPS !"
            success=true
        else
            echo "?? Échec du déploiement sur le VPS"
        fi
        
    else
        echo "?? Échec de la connexion SSH"
    fi
    
    # Test externe si le déploiement a réussi
    if [ "$success" = true ]; then
        echo ""
        echo "?? Test externe de l'application..."
        sleep 10
        
        # Test avec curl (PowerShell équivalent)
        if command -v curl &> /dev/null; then
            if curl -f http://$VPS_HOST/api/test >/dev/null 2>&1; then
                echo "?? APPLICATION ACCÉSIBLE EXTERNEMENT !"
                break
            else
                echo "?? Application pas encore accessible externement"
                success=false
            fi
        else
            # Test avec PowerShell
            if powershell -Command "try { Invoke-WebRequest -Uri http://$VPS_HOST/api/test -UseBasicParsing -TimeoutSec 10 | Out-Null; exit 0 } catch { exit 1 }"; then
                echo "?? APPLICATION ACCÉSIBLE EXTERNEMENT !"
                break
            else
                echo "?? Application pas encore accessible externement"
                success=false
            fi
        fi
    fi
    
    # Si échec, attendre avant la prochaine tentative
    if [ "$success" = false ]; then
        echo ""
        echo "?? Échec - Attente de ${ATTEMPT_DELAY}s avant la tentative $((attempt + 1))"
        echo "?? Press Ctrl+C pour arrêter"
        echo ""
        
        # Compte à rebours
        for ((i=$ATTEMPT_DELAY; i>0; i--)); do
            echo -ne "?? Attente: ${i}s\r"
            sleep 1
        done
        echo ""
        
        attempt=$((attempt + 1))
    fi
done

# Résultat final
echo ""
echo "=========================================="
if [ "$success" = true ]; then
    echo "?? SUCCÈS ! L'application est opérationnelle"
    echo "=========================================="
    echo ""
    echo "?? Application accessible à:"
    echo "   http://194.164.77.52"
    echo "   https://www.kelios-pro.com"
    echo ""
    echo "?? Administration:"
    echo "   User: Tahaa"
    echo "   Password: Zll292518@@"
    echo ""
    echo "?? Connexion SSH:"
    echo "   ssh devadmin@194.164.77.52"
    echo "   Password: MaRouane2121@"
    echo ""
    echo "?? Vérification:"
    echo "   curl http://194.164.77.52/api/test"
else
    echo "?? ÉCHEC - Maximum de tentatives atteint"
    echo "=========================================="
    echo ""
    echo "?? Vérifiez manuellement:"
    echo "   1. Connexion SSH: ssh devadmin@194.164.77.52"
    echo "   2. Status Docker: docker ps"
    echo "   3. Logs: docker-compose logs"
    echo ""
    echo "?? Ou utilisez le guide manuel: MANUAL-DEPLOY-COMMANDS.md"
fi

echo ""
