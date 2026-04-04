# Helper script to extract Google Service Account credentials from JSON
# Usage: .\extract-service-account.ps1 <path-to-json-file>

param(
    [Parameter(Mandatory=$true)]
    [string]$JsonPath
)

if (-not (Test-Path $JsonPath)) {
    Write-Error "File not found: $JsonPath"
    exit 1
}

try {
    $json = Get-Content $JsonPath -Raw | ConvertFrom-Json
    
    Write-Host "`n=== Service Account Credentials ===" -ForegroundColor Green
    Write-Host "`nClient Email:" -ForegroundColor Yellow
    Write-Host $json.client_email
    
    Write-Host "`nPrivate Key (first 50 chars):" -ForegroundColor Yellow
    Write-Host $json.private_key.Substring(0, 50)...
    
    Write-Host "`n=== Setting Wrangler Secrets ===" -ForegroundColor Green
    
    # Set GOOGLE_SERVICE_ACCOUNT_EMAIL
    Write-Host "`nSetting GOOGLE_SERVICE_ACCOUNT_EMAIL..." -ForegroundColor Cyan
    echo $json.client_email | wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
    
    # Set GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    Write-Host "`nSetting GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY..." -ForegroundColor Cyan
    echo $json.private_key | wrangler secret put GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    
    Write-Host "`n✅ All secrets set successfully!" -ForegroundColor Green
    
} catch {
    Write-Error "Failed to parse JSON: $_"
    exit 1
}
