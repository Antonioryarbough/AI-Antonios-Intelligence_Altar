# AI Enterprise Studio - Deployment Script
# Run this script to deploy your app to Firebase

Write-Host "🚀 AI Enterprise Studio - Deployment Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking for Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "✅ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Installing Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
    Write-Host "✅ Firebase CLI installed!" -ForegroundColor Green
}

Write-Host ""

# Check if config.js has been updated
Write-Host "Checking configuration..." -ForegroundColor Yellow
$configContent = Get-Content "public\config.js" -Raw
if ($configContent -match "YOUR_API_KEY") {
    Write-Host "⚠️  Warning: config.js still has placeholder values!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please update public\config.js with your Firebase credentials:" -ForegroundColor Yellow
    Write-Host "1. Go to https://console.firebase.google.com/" -ForegroundColor Cyan
    Write-Host "2. Select your project" -ForegroundColor Cyan
    Write-Host "3. Project Settings → Your apps → Web app" -ForegroundColor Cyan
    Write-Host "4. Copy the config values to public\config.js" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit
    }
} else {
    Write-Host "✅ Configuration looks good!" -ForegroundColor Green
}

Write-Host ""

# Check if .firebaserc has been updated
$firebasercContent = Get-Content ".firebaserc" -Raw
if ($firebasercContent -match "YOUR_PROJECT_ID") {
    Write-Host "⚠️  Warning: .firebaserc still has placeholder!" -ForegroundColor Red
    Write-Host "Please update .firebaserc with your Firebase project ID" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to deploy!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ask user what to deploy
Write-Host "What would you like to deploy?" -ForegroundColor Yellow
Write-Host "1. Everything (Firestore rules + Hosting)" -ForegroundColor Cyan
Write-Host "2. Hosting only" -ForegroundColor Cyan
Write-Host "3. Firestore rules only" -ForegroundColor Cyan
Write-Host "4. Cancel" -ForegroundColor Cyan
Write-Host ""
$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Deploying everything..." -ForegroundColor Yellow
        firebase deploy
    }
    "2" {
        Write-Host ""
        Write-Host "Deploying hosting..." -ForegroundColor Yellow
        firebase deploy --only hosting
    }
    "3" {
        Write-Host ""
        Write-Host "Deploying Firestore rules..." -ForegroundColor Yellow
        firebase deploy --only firestore:rules
    }
    "4" {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit
    }
    default {
        Write-Host "Invalid choice. Deployment cancelled." -ForegroundColor Red
        exit
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app should now be live!" -ForegroundColor Green
Write-Host "Check your Firebase console for the URL." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
