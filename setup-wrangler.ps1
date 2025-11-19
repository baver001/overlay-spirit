# Setup script for wrangler Cloudflare Pages
# Run: .\setup-wrangler.ps1

Write-Host "Setting up wrangler for Cloudflare Pages..." -ForegroundColor Cyan

# Remove deprecated environment variables (they conflict with OAuth)
$env:CF_API_KEY = $null
$env:CF_ACCOUNT_ID = $null

Write-Host "Deprecated environment variables removed" -ForegroundColor Green

# Check authorization
Write-Host "`nChecking authorization..." -ForegroundColor Cyan
wrangler whoami

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nYou are not authorized. Run: wrangler login" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nAuthorization successful!" -ForegroundColor Green
Write-Host "`nFor deployment use:" -ForegroundColor Cyan
Write-Host "   wrangler pages deploy dist --project-name=loverlay" -ForegroundColor White

