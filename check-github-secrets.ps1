# Script pour vérifier et reconfigurer les secrets GitHub
# Utilisation: .\check-github-secrets.ps1

Write-Host "🔍 Vérification des secrets GitHub" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Secrets requis :" -ForegroundColor Yellow
Write-Host "===================" -ForegroundColor Yellow
Write-Host "• HOSTINGER_HOST = 194.164.77.52" -ForegroundColor White
Write-Host "• HOSTINGER_USER = devadmin" -ForegroundColor White
Write-Host "• DEPLOY_KEY = [clé SSH privée]" -ForegroundColor White

Write-Host ""
Write-Host "🔗 Instructions pour configurer :" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "1. Allez sur : https://github.com/majorellecentreaffaires2-sys/kelios-pro1" -ForegroundColor White
Write-Host "2. Settings -> Secrets and variables -> Actions" -ForegroundColor White
Write-Host "3. Vérifiez que ces 3 secrets existent :" -ForegroundColor White
Write-Host "   - HOSTINGER_HOST" -ForegroundColor Gray
Write-Host "   - HOSTINGER_USER" -ForegroundColor Gray
Write-Host "   - DEPLOY_KEY" -ForegroundColor Gray

Write-Host ""
Write-Host "Si un secret manque, cliquez 'New repository secret'" -ForegroundColor Green
Write-Host "   et ajoutez-le avec les valeurs ci-dessus." -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Après configuration, faites un nouveau commit :" -ForegroundColor Yellow
Write-Host "git commit --allow-empty -m `"Trigger deployment`"" -ForegroundColor White
Write-Host "git push kelios main" -ForegroundColor White