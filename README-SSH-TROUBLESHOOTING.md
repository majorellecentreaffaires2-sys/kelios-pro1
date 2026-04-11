# SSH TROUBLESHOOTING - KELIOS IA

## 🚨 PROBLÈME ACTUEL
```
Permission denied (publickey,password)
```

## 🔧 DIAGNOSTIC

### Étape 1: Vérifier la clé SSH sur le VPS
```bash
# Connecter au VPS manuellement
ssh root@194.164.77.52

# Vérifier les clés autorisées
cat ~/.ssh/authorized_keys

# Vérifier les permissions
ls -la ~/.ssh/
```

### Étape 2: Régénérer la clé SSH
```bash
# Sur votre machine locale
ssh-keygen -t ed25519 -C "github-actions@kelios-pro" -f ~/.ssh/kelios_deploy

# Copier la clé publique
cat ~/.ssh/kelios_deploy.pub
```

### Étape 3: Installer la clé sur le VPS
```bash
# Sur le VPS
echo "VOTRE_CLÉ_PUBLIQUE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh/
```

### Étape 4: Mettre à jour les secrets GitHub
1. Aller sur : https://github.com/majorellecentreaffaires2-sys/kelios-pro1/settings/secrets
2. Mettre à jour :
   - `VPS_SSH_KEY` : Clé privée complète (inclure -----BEGIN et -----END)
   - `VPS_HOST` : 194.164.77.52
   - `VPS_PORT` : 22
   - `VPS_USER` : root

### Étape 5: Tester la connexion
```bash
# Tester avec la nouvelle clé
ssh -i ~/.ssh/kelios_deploy root@194.164.77.52
```

## 🚀 SOLUTIONS

### Option A: Régénérer et réinstaller les clés SSH
1. Supprimer l'ancienne clé du VPS
2. Générer une nouvelle paire de clés
3. Installer la nouvelle clé publique sur le VPS
4. Mettre à jour les secrets GitHub

### Option B: Utiliser l'authentification par mot de passe
1. Mettre à jour `VPS_SSH_KEY` avec le mot de passe
2. Modifier le workflow pour utiliser `sshpass`

### Option C: Vérifier la configuration SSH du VPS
```bash
# Sur le VPS
nano /etc/ssh/sshd_config

# Vérifier ces lignes :
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PasswordAuthentication yes

# Redémarrer SSH
systemctl restart sshd
```

## 📋 VÉRIFICATION FINALE

Après correction, le workflow GitHub Actions devrait montrer :
```
Testing SSH connection to 194.164.77.52:22...
SSH connection successful
Starting deployment to 194.164.77.52:22...
```

## 🎯 ACCÈS APPLICATION

Pendant le dépannage :
- **Frontend** : http://194.164.77.52
- **API Test** : http://194.164.77.52/api/test
- **Identifiants** : demo@kelios.local / password123
