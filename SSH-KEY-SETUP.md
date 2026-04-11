# SSH KEY SETUP - KELIOS IA

## Erreur : `Permission denied (publickey,password)`

### Comprendre l'erreur
Cette erreur signifie que SSH essaie de se connecter avec :
1. **Clé publique (publickey)** : Échec
2. **Mot de passe (password)** : Échec

SSH ne trouve ni clé SSH valide, ni mot de passe correct.

---

## Solution 1 : Utiliser le mot de passe (recommandé)

### Étape 1 : Connexion avec mot de passe
```bash
ssh root@194.164.77.52
# Mot de passe : MaKrame2121@
```

### Étape 2 : Si ça ne fonctionne pas, essayer avec sshpass
```bash
sshpass -p "MaKrame2121@" ssh -o StrictHostKeyChecking=no root@194.164.77.52
```

---

## Solution 2 : Générer une clé SSH

### Étape 1 : Générer une nouvelle clé SSH
```bash
ssh-keygen -t ed25519 -C "kelios-pro@hostinger" -f ~/.ssh/kelios_pro
```

### Étape 2 : Copier la clé publique
```bash
cat ~/.ssh/kelios_pro.pub
```

### Étape 3 : Ajouter la clé au VPS
```bash
ssh-copy-id -i ~/.ssh/kelios_pro.pub root@194.164.77.52
```

---

## Solution 3 : Configuration manuelle

### Étape 1 : Se connecter au VPS avec mot de passe
```bash
ssh root@194.164.77.52
```

### Étape 2 : Créer le répertoire SSH
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

### Étape 3 : Créer le fichier authorized_keys
```bash
nano ~/.ssh/authorized_keys
```

### Étape 4 : Ajouter votre clé publique
```bash
# Copiez-collez votre clé publique ici
# Exemple : ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG... kelios-pro@hostinger
```

### Étape 5 : Configurer les permissions
```bash
chmod 600 ~/.ssh/authorized_keys
```

---

## Solution 4 : Vérifier la configuration SSH du VPS

### Étape 1 : Se connecter au VPS
```bash
ssh root@194.164.77.52
```

### Étape 2 : Vérifier la configuration SSH
```bash
nano /etc/ssh/sshd_config
```

### Étape 3 : Vérifier ces lignes
```bash
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PasswordAuthentication yes
```

### Étape 4 : Redémarrer SSH
```bash
systemctl restart sshd
```

---

## Pour GitHub Actions

### Étape 1 : Générer une clé pour GitHub Actions
```bash
ssh-keygen -t ed25519 -C "github-actions@kelios-pro" -f ~/.ssh/github_actions
```

### Étape 2 : Ajouter la clé publique au VPS
```bash
ssh-copy-id -i ~/.ssh/github_actions.pub root@194.164.77.52
```

### Étape 3 : Configurer les secrets GitHub
1. Allez sur : https://github.com/majorellecentreaffaires2-sys/kelios-pro1/settings/secrets
2. Ajoutez `VPS_SSH_KEY` avec le contenu de `~/.ssh/github_actions`
3. Ajoutez `VPS_HOST` : `194.164.77.52`
4. Ajoutez `VPS_PORT` : `22`
5. Ajoutez `VPS_USER` : `root`

---

## Test de connexion

### Test avec mot de passe
```bash
ssh root@194.164.77.52
```

### Test avec clé SSH
```bash
ssh -i ~/.ssh/kelios_pro root@194.164.77.52
```

### Test GitHub Actions
```bash
ssh -i ~/.ssh/github_actions root@194.164.77.52
```

---

## Dépannage

### Erreur : "Permission denied"
- Vérifiez le mot de passe : `MaKrame2121@`
- Vérifiez que la clé SSH est bien dans `~/.ssh/authorized_keys`
- Vérifiez les permissions : `chmod 600 ~/.ssh/authorized_keys`

### Erreur : "Host key verification failed"
```bash
ssh-keygen -R 194.164.77.52
```

### Erreur : "Connection refused"
- Vérifiez que le port 22 est ouvert
- Vérifiez que le service SSH fonctionne : `systemctl status sshd`

---

## Solution rapide

Si vous voulez juste déployer maintenant, utilisez le script terminal :

```bash
./deploy-terminal.sh
```

Ce script utilise `git clone` et ne nécessite pas de clé SSH.
