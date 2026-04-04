# Check Stripe Webhook Delivery Status
# Run this to see if the webhook was successfully delivered

Write-Host "=== Checking Webhook Delivery Status ===" -ForegroundColor Cyan
Write-Host ""

# Get the webhook endpoint ID first
Write-Host "Step 1: Listing your webhook endpoints..." -ForegroundColor Yellow
stripe webhook-endpoints list --limit 5

Write-Host ""
Write-Host "=== Recent Webhook Attempts ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the endpoint ID (we_...) from above, then run:" -ForegroundColor Yellow
Write-Host "stripe events list --type checkout.session.completed --limit 3" -ForegroundColor Green
Write-Host ""
Write-Host "Then check specific event delivery:" -ForegroundColor Yellow
Write-Host "stripe events retrieve evt_1SYXg3IcMSxwbtZN6u7LhbiH" -ForegroundColor Green
