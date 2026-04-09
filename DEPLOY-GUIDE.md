# 🚀 GUIDE COMPLET DE DÉPLOIEMENT

## 📦 Projet prêt pour GitHub + Hostinger + Ubuntu

Votre projet est maintenant **100% prêt** pour le déploiement avec tous les fichiers nécessaires !

---

## 🎯 ÉTAPES À SUIVRE

### 1️⃣ **Mettre sur GitHub**

```bash
# Ouvrir un terminal dans le dossier du projet
cd "c:\Users\pc\Downloads\facture backup (1)"

# Initialiser Git
git init
git add .
git commit -m "Initial commit - Application de facturation marocaine avec IA KELIOS"

# Créer le repository sur GitHub : https://github.com/new
# Nom recommandé : facture-app-maroc

# Connecter et pousser
git remote add origin https://github.com/VOTRE_USERNAME/facture-app-maroc.git
git branch -M main
git push -u origin main
```

### 2️⃣ **Configurer Hostinger**

#### A. Activer SSH sur Hostinger
1. Connectez-vous à Hostinger
2. Allez dans **Hébergement → Gestionnaire de fichiers**
3. Créez le dossier `.ssh` s'il n'existe pas
4. Créez le fichier `authorized_keys`

#### B. Générer vos clés SSH
```bash
# Sur votre machine locale
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
# Appuyez sur Entrée pour toutes les questions

# Copier la clé publique
cat ~/.ssh/id_rsa.pub
```

#### C. Ajouter la clé à Hostinger
1. Copiez le contenu de `id_rsa.pub`
2. Collez-le dans `authorized_keys` sur Hostinger
3. Testez la connexion :
```bash
ssh votre-user-ssh@votre-domaine.com
```

### 3️⃣ **Configurer GitHub Actions**

Dans votre repository GitHub :
1. Allez dans **Settings → Secrets and variables → Actions**
2. Ajoutez ces 3 secrets :

```
HOSTINGER_HOST = votre-domaine.com
HOSTINGER_USER = votre-username-ssh  
DEPLOY_KEY = -----BEGIN OPENSSH PRIVATE KEY-----
votre-clé-privée-complète-ici
-----END OPENSSH PRIVATE KEY-----
```

### 4️⃣ **Déploiement Automatique**

Le déploiement se fera **automatiquement** quand vous push sur `main` !

```bash
# Pour déployer une nouvelle version
git add .
git commit -m "Nouvelle fonctionnalité"
git push origin main
```

---

## 🐳 **Option Docker (Recommandé)**

### Build et test local
```bash
# Construire l'image
npm run docker:build

# Tester localement
npm run docker:run

# Avec Docker Compose
npm run docker:compose
```

### Déploiement Docker sur Hostinger
```bash
# Copier les fichiers sur Hostinger
scp -r . votre-user@votre-domaine.com:~/app/

# Sur Hostinger
cd ~/app
docker-compose up -d
```

---

## 📁 **Fichiers créés pour vous**

✅ **Dockerfile** - Configuration Docker optimisée  
✅ **nginx.conf** - Serveur web performant  
✅ **docker-compose.yml** - Services complets  
✅ **.github/workflows/deploy.yml** - CI/CD automatique  
✅ **README-DEPLOYMENT.md** - Documentation complète  
✅ **package.json** - Scripts de déploiement ajoutés  

---

## 🌐 **Accès à votre application**

Une fois déployée :
- **URL principale** : `https://votre-domaine.com/app/`
- **Version de développement** : `http://localhost:3000` (local)
- **Version Docker** : `http://localhost:80` (local)

---

## 🛠️ **Dépannage rapide**

### Si le déploiement échoue :
1. **Vérifiez les secrets GitHub** (Settings → Secrets)
2. **Testez la connexion SSH** manuellement
3. **Vérifiez les logs GitHub Actions**

### Si l'application ne s'affiche pas :
1. **Videz le cache** du navigateur
2. **Vérifiez la console** (F12)
3. **Contrôlez les permissions** des fichiers

### Si Docker ne fonctionne pas :
1. **Installez Docker Desktop**
2. **Vérifiez que Docker tourne** : `docker --version`
3. **Nettoyez** : `docker system prune`

---

## 🎉 **Félicitations !**

Votre application de facturation marocaine avec **IA KELIOS** est maintenant :

- ✅ **Prête pour GitHub**
- ✅ **Configurée pour Hostinger**  
- ✅ **Optimisée pour Ubuntu**
- ✅ **Déployable automatiquement**
- ✅ **Accessible en production**

**Il ne vous reste plus qu'à suivre les étapes ci-dessus !** 🚀

---

## 📞 **Besoin d'aide ?**

- **GitHub** : Vérifiez l'onglet "Actions" pour les logs
- **Hostinger** : Panneau → Hébergement → Logs
- **Local** : `npm run dev` pour tester en développement

**Votre projet est 100% prêt pour la production !** 🎯
