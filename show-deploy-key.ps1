# Script pour afficher seulement la DEPLOY_KEY (clé SSH privée)
# Utilisation: .\show-deploy-key.ps1

Write-Host "🔑 Votre DEPLOY_KEY (clé SSH privée pour GitHub)" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$sshPath = "$env:USERPROFILE\.ssh"
$idRsaPath = "$sshPath\id_rsa"

if (Test-Path $idRsaPath) {
    Write-Host ""
    Get-Content $idRsaPath
    Write-Host ""
    Write-Host "📋 Copiez TOUTE cette clé (de -----BEGIN à -----END) dans GitHub Secret DEPLOY_KEY" -ForegroundColor Yellow
} else {
    Write-Host "❌ Aucune clé SSH trouvée !" -ForegroundColor Red
    Write-Host "Lancez d'abord : .\setup-ssh.ps1" -ForegroundColor Yellow
}