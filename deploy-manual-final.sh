#!/bin/bash

# Script de déploiement MANUEL FINAL pour KELIOS IA
# Solution sans SSH - déploiement via interface web

echo "🚀 DÉPLOIEMENT MANUEL FINAL KELIOS IA"
echo "======================================"

echo ""
echo "📋 INSTRUCTIONS ÉTAPE PAR ÉTAPE"
echo "===================================="
echo ""

echo "🔴 ÉTAPE 1 : ACCÈS AU VPS"
echo "================================"
echo "1. Connectez-vous à votre interface Hostinger"
echo "2. Allez dans 'Gestion des fichiers' ou 'File Manager'"
echo "3. Naviguez vers : /var/www/kelios-pro/"
echo "4. Si le dossier n'existe pas, créez-le"
echo ""

echo "🔴 ÉTAPE 2 : TÉLÉCHARGEMENT DES FICHIERS"
echo "=========================================="
echo "Téléchargez ces fichiers depuis GitHub :"
echo "https://github.com/majorellecentreaffaires2-sys/kelios-pro1"
echo ""
echo "Fichiers nécessaires :"
echo "- dist/ (dossier complet du build)"
echo "- docker-compose.yml"
echo "- Dockerfile"
echo "- Dockerfile.backend"
echo "- nginx.conf"
echo ""

echo "🔴 ÉTAPE 3 : TRANSFERT DES FICHIERS"
echo "===================================="
echo "1. Uploadez tous les fichiers dans /var/www/kelios-pro/"
echo "2. Assurez-vous que la structure est correcte"
echo ""

echo "🔴 ÉTAPE 4 : CONFIGURATION DOCKER"
echo "================================="
echo "1. Allez dans 'Docker' ou 'Conteneurs'"
echo "2. Uploadez le fichier docker-compose.yml"
echo "3. Lancez la commande de build"
echo ""

echo "🔴 ÉTAPE 5 : DÉMARRAGE DES SERVICES"
echo "===================================="
echo "1. Démarrez les conteneurs Docker"
echo "2. Vérifiez que les ports 80 et 3001 sont ouverts"
echo ""

echo "🔴 ÉTAPE 6 : VÉRIFICATION"
echo "========================"
echo "1. Testez l'accès à : https://www.kelios-pro.com"
echo "2. Testez l'API à : https://www.kelios-pro.com/api/test"
echo ""

echo "📋 RÉSUMÉ DES FICHIERS À UPLOADER"
echo "===================================="
echo ""

# Créer la liste des fichiers à uploader
echo "📁 Fichiers build frontend :"
find dist -type f | head -10

echo ""
echo "📄 Fichiers de configuration :"
ls -la docker-compose.yml Dockerfile Dockerfile.backend nginx.conf

echo ""
echo "🌐 INFORMATIONS FINALES"
echo "========================"
echo "Application : https://www.kelios-pro.com"
echo "Admin : Tahaa / Zll292518@@"
echo "VPS : 194.164.77.52"
echo ""

echo "✅ GUIDE TERMINÉ - Suivez les étapes ci-dessus"
echo ""
