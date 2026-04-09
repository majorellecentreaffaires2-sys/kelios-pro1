# Script pour tester la connexion SSH avec différents usernames possibles
# Utilisation: .\test-ssh.ps1

Write-Host "🧪 Test de connexion SSH Hostinger" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

$host_ip = "194.164.77.52"
$usernames = @("devadmin", "u123456789", "u987654321", "u000000000", "root", $env:USERNAME)

Write-Host "Test de connexion avec différents usernames possibles..." -ForegroundColor Yellow
Write-Host "Serveur: $host_ip" -ForegroundColor White
Write-Host ""

foreach ($user in $usernames) {
    Write-Host "🔍 Test avec username: $user" -ForegroundColor Cyan

    try {
        $result = ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -T "$user@$host_ip" "echo 'Connexion réussie avec $user'" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎉 SUCCÈS ! Votre HOSTINGER_USER est: $user" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 Utilisez ce username pour configurer GitHub Secrets :" -ForegroundColor Yellow
            Write-Host "HOSTINGER_USER = $user" -ForegroundColor Gray
            exit 0
        } else {
            Write-Host "❌ Échec avec $user" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Échec avec $user" -ForegroundColor Red
    }

    Write-Host ""
}

Write-Host "❌ Aucun test n'a réussi automatiquement." -ForegroundColor Red
Write-Host ""
Write-Host "🔍 Vérifiez manuellement dans votre panneau Hostinger :" -ForegroundColor Yellow
Write-Host "• Business Web Hosting : Files → File Manager" -ForegroundColor White
Write-Host "• VPS/Cloud : Servers → SSH Access" -ForegroundColor White
Write-Host ""
Write-Host "💡 Test manuel: ssh VOTRE_USERNAME@$host_ip" -ForegroundColor Cyan