# Configuration des Secrets GitHub pour KELIOS IA

## 📋 ÉTAPES DE CONFIGURATION

### 1. Accéder aux settings du repository
- URL: https://github.com/majorellecentreaffaires2-sys/kelios-pro1/settings/secrets/actions
- Ou: Repository → Settings → Secrets and variables → Actions

### 2. Créer les 4 secrets requis

#### **VPS_HOST**
```
Nom: VPS_HOST
Valeur: 194.164.77.52
Description: Adresse IP du VPS Hostinger
```

#### **VPS_USER**
```
Nom: VPS_USER
Valeur: root
Description: Utilisateur SSH du VPS
```

#### **VPS_PORT**
```
Nom: VPS_PORT
Valeur: 22
Description: Port SSH du VPS
```

#### **VPS_SSH_KEY**
```
Nom: VPS_SSH_KEY
Valeur: [contenu complet de la clé SSH privée]
Description: Clé SSH privée pour connexion au VPS
```

## 🔑 GÉNÉRATION DE CLÉ SSH

### Option 1: Utiliser une clé existante
Si vous avez déjà une clé SSH:
```bash
cat ~/.ssh/id_rsa
```

### Option 2: Générer une nouvelle clé
```bash
ssh-keygen -t rsa -b 4096 -f github-deploy-key -N ""
```

### Option 3: Utiliser Putty Key Generator (Windows)
1. Télécharger PuTTYgen
2. Générer une clé RSA 4096 bits
3. Sauvegarder la clé privée
4. Copier le contenu complet

## 🔧 CONFIGURATION SUR LE VPS

### Ajouter la clé publique au VPS
```bash
# Copier le contenu de la clé publique
cat github-deploy-key.pub

# Ajouter au fichier authorized_keys sur le VPS
echo "contenu_clé_publique" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## ✅ VÉRIFICATION

Après configuration, le workflow GitHub devrait afficher:
```
=== DEBUG SECRETS ===
VPS_HOST: ***CONFIGURED***
VPS_USER: ***CONFIGURED***
VPS_PORT: ***CONFIGURED***
VPS_SSH_KEY: ***CONFIGURED***
=== ALL SECRETS CONFIGURED CORRECTLY ===
```

## 🚀 DÉPLOIEMENT AUTOMATIQUE

Une fois les secrets configurés:
1. Push vers la branche `main`
2. Le workflow GitHub Actions se déclenchera automatiquement
3. L'application sera déployée sur le VPS

## 📞 SUPPORT

En cas de problème:
- Vérifier que tous les 4 secrets sont configurés
- S'assurer que la clé SSH est valide
- Consulter les logs GitHub Actions
- Vérifier l'accès SSH manuel au VPS
