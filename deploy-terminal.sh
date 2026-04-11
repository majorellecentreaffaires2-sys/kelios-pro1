#!/bin/bash

# Script de déploiement TERMINAL pour KELIOS IA
# Solution via terminal VPS uniquement

echo "🚀 DÉPLOIEMENT TERMINAL KELIOS IA"
echo "=================================="

echo ""
echo "📋 COMMANDES À EXÉCUTER SUR LE VPS"
echo "======================================"
echo ""

echo "🔴 ÉTAPE 1 : CONNEXION AU VPS"
echo "ssh devadmin@194.164.77.52"
echo "Utilisez votre clé SSH ou mot de passe devadmin"
echo ""

echo "🔴 ÉTAPE 2 : NAVIGATION VERS LE RÉPERTOIRE"
echo "cd /home/devadmin/"
echo ""

echo "🔴 ÉTAPE 3 : CRÉATION DU RÉPERTOIRE KELIOS-PRO"
echo "mkdir -p kelios-pro"
echo "cd kelios-pro"
echo ""

echo "🔴 ÉTAPE 4 : TÉLÉCHARGEMENT DES FICHIERS DEPUIS GITHUB"
echo "git clone https://github.com/majorellecentreaffaires2-sys/kelios-pro1.git ."
echo ""

echo "🔴 ÉTAPE 5 : INSTALLATION DE DOCKER (SI NÉCESSAIRE)"
echo "apt update"
echo "apt install -y docker.io docker-compose"
echo ""

echo "🔴 ÉTAPE 6 : CONSTRUCTION DES IMAGES DOCKER"
echo "docker-compose build --no-cache"
echo ""

echo "🔴 ÉTAPE 7 : DÉMARRAGE DES CONTENEURS"
echo "docker-compose up -d"
echo ""

echo "🔴 ÉTAPE 8 : VÉRIFICATION DU STATUT"
echo "docker-compose ps"
echo ""

echo "🔴 ÉTAPE 9 : VÉRIFICATION DES PORTS"
echo "netstat -tulpn | grep -E ':(80|3001)'"
echo ""

echo "🔴 ÉTAPE 10 : TEST DE L'APPLICATION"
echo "curl -f http://localhost/api/test"
echo ""

echo "🌐 INFORMATIONS FINALES"
echo "========================"
echo "Application : http://194.164.77.52"
echo "API : http://194.164.77.52/api"
echo "Domaine : https://www.kelios-pro.com"
echo "Admin : Tahaa / Zll292518@@"
echo ""

echo "✅ GUIDE TERMINÉ - Copiez-collez les commandes ci-dessus"
echo ""

echo "📝 NOTES IMPORTANTES :"
echo "======================"
echo "1. Assurez-vous que Docker est installé sur le VPS"
echo "2. Vérifiez que les ports 80 et 3001 sont ouverts"
echo "3. Si erreur de permissions, utilisez 'sudo' devant les commandes"
echo "4. Les fichiers de configuration sont inclus dans le dépôt GitHub"
echo ""

echo "🔧 DÉPANNAGE :"
echo "==============="
echo "Si problème :"
echo "- Vérifier les logs : docker-compose logs"
echo "- Redémarrer : docker-compose restart"
echo "- Arrêter : docker-compose down"
echo "- Nettoyer : docker system prune -f"
echo ""
