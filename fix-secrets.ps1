# Instructions pour configurer les secrets GitHub manquants

Write-Host "=== SECRETS GITHUB MANQUANTS ===" -ForegroundColor Red
Write-Host ""
Write-Host "Le diagnostic montre que HOSTINGER_HOST et HOSTINGER_USER sont vides." -ForegroundColor Yellow
Write-Host ""
Write-Host "Allez sur: https://github.com/majorellecentreaffaires2-sys/kelios-pro1/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ajoutez ces 2 secrets manquants:" -ForegroundColor Green
Write-Host ""
Write-Host "1. HOSTINGER_HOST = 194.164.77.52" -ForegroundColor White
Write-Host "2. HOSTINGER_USER = devadmin" -ForegroundColor White
Write-Host ""
Write-Host "DEPLOY_KEY est deja configure (3388 caracteres)." -ForegroundColor Green
Write-Host ""
Write-Host "Apres avoir ajoute les secrets, relancez:" -ForegroundColor Yellow
Write-Host "git commit --allow-empty -m 'Trigger deployment'" -ForegroundColor White
Write-Host "git push kelios main" -ForegroundColor White