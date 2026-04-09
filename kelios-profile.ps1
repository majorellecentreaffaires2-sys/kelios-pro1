# Profile PowerShell pour Kelios Pro
# Ajoutez ces lignes à votre $PROFILE

function Deploy-Kelios {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Message
    )

    $scriptPath = Join-Path $PSScriptRoot "deploy.ps1"
    if (Test-Path $scriptPath) {
        & $scriptPath $Message
    } else {
        Write-Host "Script deploy.ps1 introuvable" -ForegroundColor Red
    }
}

# Alias rapide
Set-Alias dk Deploy-Kelios

# Exemple d'utilisation:
# dk "Ajout de la fonctionnalité X"