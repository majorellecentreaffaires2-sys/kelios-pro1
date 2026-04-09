# Script de déploiement automatique pour Kelios Pro
# Utilisation: .\deploy.ps1 "Message de commit"

param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "🚀 Déploiement automatique Kelios Pro vers GitHub" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Vérifier l'état du repo
Write-Host "📊 Vérification de l'état du repository..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "✅ Modifications détectées" -ForegroundColor Green
    Write-Host $status
} else {
    Write-Host "ℹ️ Aucune modification détectée" -ForegroundColor Blue
    exit 0
}

# Test du build avant commit
Write-Host "🔨 Test du build avant déploiement..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Build réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Échec du build - Annulation du déploiement" -ForegroundColor Red
    exit 1
}

# Ajouter tous les fichiers
Write-Host "📁 Ajout des fichiers modifiés..." -ForegroundColor Yellow
git add .

# Commit avec le message fourni
Write-Host "💾 Création du commit..." -ForegroundColor Yellow
git commit -m "$CommitMessage"

# Push vers GitHub
Write-Host "⬆️ Push vers GitHub (kelios/main)..." -ForegroundColor Yellow
git push kelios main

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Déploiement réussi !" -ForegroundColor Green
    Write-Host "📍 URL: https://github.com/majorellecentreaffaires2-sys/kelios-pro1" -ForegroundColor Cyan
    Write-Host "🚀 GitHub Actions va déployer automatiquement sur Hostinger" -ForegroundColor Cyan
} else {
    Write-Host "❌ Échec du push" -ForegroundColor Red
    exit 1
}