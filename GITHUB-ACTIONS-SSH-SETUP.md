# GITHUB ACTIONS SSH SETUP - KELIOS IA

## Clés SSH disponibles

Vous avez 4 clés SSH à votre disposition :

### 1. Clé principale (recommandée pour GitHub Actions)
```bash
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMOoMApSpjYe8zma+Xp56CV60CjUAyx9Ria/3F2LqK7N kelios-pro@hostinger
```

### 2. Clé SHA256
```bash
SHA256:HFGAAy3R0IwPnw0kgyHCAkm/u/0c6OABJt4eMblBOJU kelios-pro@hostinger
```

### 3. Clé devadmin-secure
```bash
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIHUsfZBIMud6Ticv9jSpz2Y+wtW6QrZLqajrA4s2cAP+ devadmin-secure
```

### 4. Clé devadmin-pc
```bash
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEBoMtzV5cXwOdHCPejdUo1wjQxrNVMzbzfhv3aww5Zy devadmin-pc
```

---

## Configuration GitHub Actions

### Étape 1 : Choisir la clé SSH
Utilisez la **clé principale** pour GitHub Actions :
```bash
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMOoMApSpjYe8zma+Xp56CV60CjUAyx9Ria/3F2LqK7N kelios-pro@hostinger
```

### Étape 2 : Créer la clé privée correspondante
La clé privée correspondante doit être sur votre machine locale :
```bash
# Fichier : ~/.ssh/kelios-pro
# Contenu : (clé privée correspondante)
```

### Étape 3 : Configurer les secrets GitHub

1. **Allez sur GitHub** : https://github.com/majorellecentreaffaires2-sys/kelios-pro1/settings/secrets

2. **Ajoutez les secrets suivants** :

#### Secret 1 : VPS_SSH_KEY
```
 Nom : VPS_SSH_KEY
 Valeur : (contenu complet de la clé privée)
```

Le contenu doit inclure :
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAA...
-----END OPENSSH PRIVATE KEY-----
```

#### Secret 2 : VPS_HOST
```
 Nom : VPS_HOST
 Valeur : 194.164.77.52
```

#### Secret 3 : VPS_PORT
```
 Nom : VPS_PORT
 Valeur : 22
```

#### Secret 4 : VPS_USER
```
 Nom : VPS_USER
 Valeur : root
```

---

## Test de connexion

### Test 1 : Vérifier la clé publique sur le VPS
```bash
ssh root@194.164.77.52
# Mot de passe : MaKrame2121@

# Vérifier les clés autorisées
cat ~/.ssh/authorized_keys
```

La clé publique doit être présente :
```bash
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMOoMApSpjYe8zma+Xp56CV60CjUAyx9Ria/3F2LqK7N kelios-pro@hostinger
```

### Test 2 : Tester la connexion locale
```bash
ssh -i ~/.ssh/kelios-pro root@194.164.77.52
```

### Test 3 : Déclencher GitHub Actions
```bash
git commit --allow-empty -m "test: Trigger GitHub Actions SSH test"
git push origin main
```

---

## Dépannage

### Si la clé privée n'est pas disponible
1. **Générer une nouvelle paire** :
```bash
ssh-keygen -t ed25519 -C "github-actions@kelios-pro" -f ~/.ssh/github_actions
```

2. **Ajouter la clé publique au VPS** :
```bash
ssh-copy-id -i ~/.ssh/github_actions.pub root@194.164.77.52
```

3. **Utiliser la nouvelle clé** dans les secrets GitHub

### Si GitHub Actions échoue
1. **Vérifier les secrets** : Assurez-vous que tous les secrets sont corrects
2. **Vérifier la clé** : La clé privée doit être complète avec BEGIN/END
3. **Vérifier le VPS** : La clé publique doit être dans `~/.ssh/authorized_keys`

---

## Instructions rapides

### Pour configurer maintenant :
1. **Copiez la clé privée** correspondante à `kelios-pro@hostinger`
2. **Allez sur GitHub** et configurez les 4 secrets
3. **Déclenchez** le workflow GitHub Actions
4. **Vérifiez** les logs pour confirmer la connexion SSH

### Si vous n'avez pas la clé privée :
1. **Utilisez la clé** `devadmin-secure` ou `devadmin-pc`
2. **Générez une nouvelle clé** si nécessaire
3. **Configurez** les secrets GitHub avec la nouvelle clé

---

## Solution alternative

Si SSH continue de poser problème, utilisez le script terminal :

```bash
./deploy-terminal.sh
```

Ce script utilise `git clone` et ne nécessite pas de configuration SSH complexe.
