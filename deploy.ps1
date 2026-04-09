param(
    [Parameter(Mandatory=$true)]
    [string]$CommitMessage
)

Write-Host "Deploying Kelios Pro to GitHub..." -ForegroundColor Green

$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes detected" -ForegroundColor Blue
    exit 0
}

Write-Host "Building project..." -ForegroundColor Yellow
& npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}

git add .
git commit -m $CommitMessage
git push kelios main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "Push failed" -ForegroundColor Red
    exit 1
}