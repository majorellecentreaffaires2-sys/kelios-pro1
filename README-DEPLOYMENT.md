# 🚀 Déploiement sur Hostinger avec Ubuntu

## 📋 Prérequis

- Compte GitHub avec le projet
- Compte Hostinger avec accès SSH
- Node.js 18+ installé localement

## 🎯 Étapes de déploiement

### 1️⃣ Préparation du projet

#### A. Initialiser Git
```bash
cd "c:\Users\pc\Downloads\facture backup (1)"
git init
git add .
git commit -m "Initial commit - Application de facturation marocaine avec IA KELIOS"
```

#### B. Créer le repository GitHub
1. Allez sur [github.com](https://github.com)
2. Cliquez sur **"New repository"**
3. Nom : `facture-app-maroc`
4. Choisissez **Public** ou **Private**
5. Cliquez sur **"Create repository"**

#### C. Connecter au distant
```bash
git remote add origin https://github.com/VOTRE_USERNAME/facture-app-maroc.git
git branch -M main
git push -u origin main
```

### 2️⃣ Configuration Hostinger

#### A. Générer les clés SSH
```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

#### B. Ajouter la clé publique à Hostinger
1. Copiez la clé publique :
```bash
cat ~/.ssh/id_rsa.pub
```

2. Allez dans Hostinger → Hébergement → Gestionnaire de fichiers
3. Créez le dossier `.ssh` si nécessaire
4. Ajoutez la clé dans `authorized_keys`

#### C. Configurer GitHub Secrets
Dans votre repository GitHub → Settings → Secrets and variables → Actions :

```
HOSTINGER_HOST=194.164.77.52
HOSTINGER_USER=devadmin
DEPLOY_KEY=votre-clé-ssh-privée-complète
```

### 3️⃣ Déploiement automatique

Le workflow GitHub Actions se déclenchera automatiquement quand vous push sur `main`.

#### Déploiement manuel :
```bash
git add .
git commit -m "Mise à jour du projet"
git push origin main
```

## 🐳 Option Docker (Recommandé pour Hostinger)

### Build local
```bash
docker build -t facture-app .
docker run -p 80:80 facture-app
```

### Docker Compose
```bash
docker-compose up -d
```

## 📁 Structure des fichiers créés

```
facture-app/
├── Dockerfile                 # Configuration Docker
├── nginx.conf               # Configuration Nginx
├── docker-compose.yml        # Services Docker
├── .github/workflows/deploy.yml # CI/CD GitHub
├── README-DEPLOYMENT.md     # Ce fichier
└── src/                    # Code source
```

## 🔧 Configuration Nginx

Le fichier `nginx.conf` inclut :
- ✅ Routing React SPA
- ✅ Compression Gzip
- ✅ Cache statique
- ✅ Sécurité basique
- ✅ Proxy API (optionnel)

## 🌐 Accès à l'application

Une fois déployée, votre application sera accessible :
- **URL principale** : `https://votre-domaine.com/app/`
- **API (si activée)** : `https://votre-domaine.com/api/`

## 🛠️ Dépannage

### Erreur 404
- Vérifiez la configuration Nginx
- Assurez-vous que le routing React fonctionne

### Erreur 502
- Vérifiez que les services sont démarrés
- Contrôlez les logs Docker

### Problème SSH
- Vérifiez les permissions des clés
- Testez la connexion : `ssh user@host`

## 📞 Support

- **GitHub Actions** : Vérifiez l'onglet "Actions"
- **Hostinger** : Panneau de contrôle → Logs
- **Application** : Console du navigateur (F12)

---

🎉 **Votre application de facturation marocaine avec IA KELIOS est prête pour le déploiement !**
