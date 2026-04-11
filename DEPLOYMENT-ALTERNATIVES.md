# DÉPLOIEMENT ALTERNATIVES - KELIOS IA

## Problème : SSH Connection Timeout

L'erreur `Connection timed out` indique que :
- Le VPS ne répond pas sur le port SSH
- Le pare-feu bloque la connexion
- Le service SSH est arrêté
- Le VPS est inaccessible

---

## Solution 1 : Déploiement Manuel via Interface Hostinger

### Étape 1 : Accès Hostinger
1. Connectez-vous à votre compte Hostinger
2. Allez dans "Gestionnaire de fichiers" ou "File Manager"
3. Naviguez vers `/home/devadmin/`

### Étape 2 : Création du répertoire
1. Créez le dossier `kelios-pro`
2. Accédez au dossier

### Étape 3 : Téléchargement des fichiers
1. Téléchargez les fichiers depuis GitHub :
   https://github.com/majorellecentreaffaires2-sys/kelios-pro1
2. Uploadez tous les fichiers dans `/home/devadmin/kelios-pro/`

### Étape 4 : Configuration Docker
1. Allez dans "Docker" ou "Conteneurs"
2. Uploadez `docker-compose.yml`
3. Lancez le build et le démarrage

---

## Solution 2 : Déploiement via API Hostinger

### Configuration API
```bash
# Utilisez l'API Hostinger pour déployer
curl -X POST https://api.hostinger.com/v1/deploy \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{"domain": "kelios-pro.com", "files": {...}}'
```

---

## Solution 3 : Déploiement Local puis Synchronisation

### Étape 1 : Déploiement local
```bash
# Sur votre machine locale
npm run build
docker-compose up -d
```

### Étape 2 : Test local
```bash
# Testez l'application localement
curl http://localhost/api/test
```

### Étape 3 : Exportation
```bash
# Exportez les conteneurs
docker save kelios-backend > backend.tar
docker save kelios-frontend > frontend.tar
```

### Étape 4 : Importation sur VPS
```bash
# Importez sur le VPS (quand accessible)
docker load < backend.tar
docker load < frontend.tar
```

---

## Solution 4 : Déploiement via FTP/SFTP

### Configuration SFTP
```bash
# Utilisez un client SFTP
sftp devadmin@194.164.77.52

# Commands SFTP
put -r dist/
put docker-compose.yml
put Dockerfile
put Dockerfile.backend
```

---

## Solution 5 : Déploiement via Git Direct

### Étape 1 : Clone sur VPS
```bash
# Quand le VPS sera accessible
ssh devadmin@194.164.77.52
cd /home/devadmin/
git clone https://github.com/majorellecentreaffaires2-sys/kelios-pro1.git kelios-pro
cd kelios-pro
```

### Étape 2 : Déploiement
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## Dépannage SSH

### Vérifier le statut du VPS
1. **Ping** : `ping 194.164.77.52`
2. **Port scan** : `nmap -p 22 194.164.77.52`
3. **Telnet** : `telnet 194.164.77.52 22`

### Solutions possibles
1. **Redémarrer le VPS** via le panneau Hostinger
2. **Vérifier le pare-feu** dans les paramètres réseau
3. **Réinstaller SSH** si nécessaire
4. **Contacter le support** Hostinger

---

## Solution Immédiate

### Utiliser le script de déploiement terminal
```bash
./deploy-terminal.sh
```

Ce script fournit toutes les commandes à exécuter manuellement quand le SSH sera accessible.

### Préparer les fichiers
1. **Build** : `npm run build` (déjà fait)
2. **Vérification** : Tous les fichiers sont prêts
3. **GitHub** : Repository à jour

---

## Monitoring

### Quand le VPS sera accessible
1. **Test SSH** : `ssh devadmin@194.164.77.52`
2. **Vérifier Docker** : `docker ps`
3. **Test application** : `curl http://localhost/api/test`

### Logs de déploiement
```bash
# Sur le VPS
cd /home/devadmin/kelios-pro
docker-compose logs
```

---

## Résumé

### Problème actuel
- SSH : Connection timed out
- VPS : Inaccessible temporairement

### Solutions disponibles
1. **Interface Hostinger** : Déploiement web
2. **API Hostinger** : Déploiement programmatique
3. **Déploiement local** : Test et préparation
4. **FTP/SFTP** : Transfert de fichiers
5. **Git direct** : Clone et déploiement

### Action recommandée
1. **Attendre** que le VPS soit accessible
2. **Utiliser** `./deploy-terminal.sh` quand possible
3. **Contacter** le support Hostinger si nécessaire

---

## Instructions pour maintenant

### Si le VPS est inaccessible
1. **Patientez** quelques minutes
2. **Vérifiez** le statut du VPS sur Hostinger
3. **Essayez** de vous connecter régulièrement

### Si le VPS est accessible
1. **Connectez-vous** : `ssh devadmin@194.164.77.52`
2. **Exécutez** : `./deploy-devadmin.sh`
3. **Vérifiez** : `curl http://localhost/api/test`

### En attendant
1. **Préparez** tous les fichiers (déjà fait)
2. **Vérifiez** le build (déjà fait)
3. **Documentez** les étapes (déjà fait)

---

**Le déploiement est prêt, il faut juste attendre que le VPS soit accessible !**
