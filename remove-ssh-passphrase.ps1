# Script pour retirer la passphrase de la clé SSH

$keyPath = "$env:USERPROFILE\.ssh\kelios-deploy"
$passphrase = "MaRouane2121@"

# Utiliser openssl pour convertir la clé
$opensslCmd = @"
echo $passphrase | openssl rsa -in "$keyPath" -out "$keyPath.tmp" -passin stdin -passout pass:
if (`$LASTEXITCODE -eq 0) {
    Move-Item "$keyPath.tmp" "$keyPath" -Force
    Write-Host "✅ Passphrase retirée avec succès!" -ForegroundColor Green
    Write-Host "La clé est maintenant lisible par GitHub Actions." -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la conversion" -ForegroundColor Red
}
"@

Write-Host "🔧 Conversion de la clé SSH..."
Write-Host "Suppression de la passphrase..."

Invoke-Expression $opensslCmd
