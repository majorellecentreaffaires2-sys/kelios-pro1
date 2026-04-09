# Script d'aide pour configurer SSH avec Hostinger
# Utilisation: .\setup-ssh.ps1

Write-Host "[SSH] Configuration SSH pour Hostinger" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

$sshPath = "$env:USERPROFILE\.ssh"
$idRsaPath = "$sshPath\id_rsa"
$idRsaPubPath = "$sshPath\id_rsa.pub"

# Créer le dossier .ssh s'il n'existe pas
if (-not (Test-Path $sshPath)) {
    New-Item -ItemType Directory -Path $sshPath -Force | Out-Null
}

# Générer la clé SSH si elle n'existe pas
if (-not (Test-Path $idRsaPath)) {
    Write-Host "[GEN] Generation d'une nouvelle cle SSH..." -ForegroundColor Yellow
    ssh-keygen -t rsa -b 4096 -C "kelios-deploy@hostinger.com" -f $idRsaPath -N '""'
    Write-Host "[OK] Cle SSH generee" -ForegroundColor Green
} else {
    Write-Host "[INFO] Une cle SSH existe deja" -ForegroundColor Blue
}

Write-Host ""
Write-Host "[CLE] Votre cle PUBLIQUE (a ajouter sur Hostinger) :" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Get-Content $idRsaPubPath

Write-Host ""
Write-Host "[CLE] Votre cle PRIVEE (pour GitHub Secrets) :" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Get-Content $idRsaPath

Write-Host ""
Write-Host "� Comment trouver votre HOSTINGER_USER :" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "- Business Web Hosting : Files -> File Manager (ex: u123456789)" -ForegroundColor White
Write-Host "- VPS/Cloud : Servers -> SSH Access" -ForegroundColor White
Write-Host "- Via SSH : commande 'whoami'" -ForegroundColor White
Write-Host ""

Write-Host "[GUIDE] Instructions :" -ForegroundColor Yellow
Write-Host "=================" -ForegroundColor Yellow
Write-Host "1. Copiez la clé PUBLIQUE ci-dessus" -ForegroundColor White
Write-Host "2. Allez sur Hostinger -> Files -> SSH Keys" -ForegroundColor White
Write-Host "3. Ajoutez la cle publique" -ForegroundColor White
Write-Host "4. Notez votre username SSH (devadmin)" -ForegroundColor White
Write-Host "5. Sur GitHub -> Settings -> Secrets and variables -> Actions" -ForegroundColor White
Write-Host "6. Ajoutez ces secrets :" -ForegroundColor White
Write-Host "   - HOSTINGER_HOST = 194.164.77.52" -ForegroundColor Gray
Write-Host "   - HOSTINGER_USER = devadmin" -ForegroundColor Gray
Write-Host "   - DEPLOY_KEY = [collez la clé privée ci-dessus]" -ForegroundColor Gray

Write-Host ""
Write-Host "[TEST] Test de la connexion SSH :" -ForegroundColor Green
Write-Host "ssh -T `$HOSTINGER_USER@`$HOSTINGER_HOST" -ForegroundColor White