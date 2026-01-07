#!/usr/bin/env pwsh
# OpenAI Integration Quick Start Script
# Run this from the Tech_sprint root directory

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  OpenAI Vision Integration - Quick Start   " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check current directory
if (-not (Test-Path "Backend") -or -not (Test-Path "CitizenVoice")) {
    Write-Host "❌ Error: Run this script from Tech_sprint root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Correct directory detected" -ForegroundColor Green
Write-Host ""

# Step 1: Check OpenAI package
Write-Host "Step 1: Checking OpenAI package..." -ForegroundColor Yellow
cd Backend
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.dependencies.openai) {
    Write-Host "✅ OpenAI package found in package.json" -ForegroundColor Green
} else {
    Write-Host "⚠️  Installing OpenAI package..." -ForegroundColor Yellow
    npm install openai
}
Write-Host ""

# Step 2: Verify environment variables
Write-Host "Step 2: Verifying environment variables..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    
    $hasOpenAI = $envContent -match "OPENAI_API_KEY"
    $hasMongo = $envContent -match "MONGO_URI"
    
    if ($hasOpenAI) {
        Write-Host "✅ OPENAI_API_KEY configured" -ForegroundColor Green
    } else {
        Write-Host "❌ OPENAI_API_KEY missing in .env" -ForegroundColor Red
    }
    
    if ($hasMongo) {
        Write-Host "✅ MONGO_URI configured" -ForegroundColor Green
    } else {
        Write-Host "❌ MONGO_URI missing in .env" -ForegroundColor Red
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}
Write-Host ""

# Step 3: Check critical files
Write-Host "Step 3: Checking critical files..." -ForegroundColor Yellow

$criticalFiles = @(
    "src/services/imageClassificationService.js",
    "src/controllers/classificationController.js",
    "src/routes/classificationRoutes.js"
)

$allFilesExist = $true
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MISSING" -ForegroundColor Red
        $allFilesExist = $false
    }
}
Write-Host ""

# Step 4: Test environment loading
Write-Host "Step 4: Testing environment loading..." -ForegroundColor Yellow
$envTest = node -e "require('dotenv').config(); console.log(JSON.stringify({openai: !!process.env.OPENAI_API_KEY, mongo: !!process.env.MONGO_URI}));" | ConvertFrom-Json

if ($envTest.openai) {
    Write-Host "✅ OpenAI API key loads correctly" -ForegroundColor Green
} else {
    Write-Host "❌ OpenAI API key not loading" -ForegroundColor Red
}

if ($envTest.mongo) {
    Write-Host "✅ MongoDB URI loads correctly" -ForegroundColor Green
} else {
    Write-Host "❌ MongoDB URI not loading" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "              SETUP SUMMARY                  " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

if ($allFilesExist -and $envTest.openai -and $envTest.mongo) {
    Write-Host "🎉 ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Start Backend:  cd Backend && npm start" -ForegroundColor White
    Write-Host "  2. Start Frontend: cd CitizenVoice && npm run dev" -ForegroundColor White
    Write-Host "  3. Test at: http://localhost:5173" -ForegroundColor White
    Write-Host ""
    Write-Host "Test AI Classification:" -ForegroundColor Cyan
    Write-Host "  - Login to the app" -ForegroundColor White
    Write-Host "  - Go to 'Report Issue'" -ForegroundColor White
    Write-Host "  - Enable 'AI Auto-Classification'" -ForegroundColor White
    Write-Host "  - Upload an issue image" -ForegroundColor White
    Write-Host "  - Watch OpenAI classify it! ✨" -ForegroundColor White
} else {
    Write-Host "⚠️  SOME CHECKS FAILED" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please fix the issues above before starting." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "  - Missing files: Check OPENAI_INTEGRATION_COMPLETE.md" -ForegroundColor White
    Write-Host "  - Missing env vars: Add to Backend/.env file" -ForegroundColor White
    Write-Host "  - Missing package: Run 'npm install' in Backend" -ForegroundColor White
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

cd ..
