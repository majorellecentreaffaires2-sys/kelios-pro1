param(
    [string]$CommitMessage = "Update for cPanel"
)

Write-Host "Preparing cPanel deployment (local build)..." -ForegroundColor Green

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build complete. Use deploy-cpanel.sh or manual ZIP."
Write-Host "Upload to cPanel public_html/ then: npm install && pm2 restart all" -ForegroundColor Green
