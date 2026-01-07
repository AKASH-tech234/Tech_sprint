# AI Classification Integration Setup Script
# Run this in PowerShell from the Tech_sprint root directory

Write-Host "🚀 Starting AI Classification Integration Setup..." -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "Backend") -or -not (Test-Path "CitizenVoice")) {
    Write-Host "❌ Error: Please run this script from the Tech_sprint root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Install Backend Dependencies
Write-Host "📦 Step 1/5: Installing Backend dependencies..." -ForegroundColor Cyan
cd Backend
npm install @google/generative-ai
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Install Frontend Dependencies
Write-Host "📦 Step 2/5: Installing Frontend dependencies..." -ForegroundColor Cyan
cd ../CitizenVoice
npm install lucide-react
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Check Environment Variables
Write-Host "🔐 Step 3/5: Checking environment variables..." -ForegroundColor Cyan
cd ../Backend
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "GEMINI_API_KEY") {
        Write-Host "✅ GEMINI_API_KEY found in .env" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Warning: GEMINI_API_KEY not found in .env" -ForegroundColor Yellow
        Write-Host "   Please add: GEMINI_API_KEY=your_key_here to Backend/.env" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Warning: .env file not found" -ForegroundColor Yellow
    Write-Host "   Please create Backend/.env with GEMINI_API_KEY" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Optional - Update Issue Model
Write-Host "📝 Step 4/5: Update Issue Model (Optional)" -ForegroundColor Cyan
Write-Host "   To store AI classification metadata, add this to Backend/src/models/Issue.js:" -ForegroundColor White
Write-Host "   
   aiClassification: {
     suggestedCategory: String,
     confidence: Number,
     suggestedPriority: String,
     aiDescription: String,
     classifiedAt: Date
   }
   " -ForegroundColor Gray
Write-Host "   Press any key to continue..." -ForegroundColor White
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Step 5: Test API Endpoint
Write-Host "🧪 Step 5/5: Testing setup..." -ForegroundColor Cyan
Write-Host "   Checking if files exist..." -ForegroundColor White

$requiredFiles = @(
    "src/services/imageClassificationService.js",
    "src/controllers/classificationController.js",
    "src/routes/classificationRoutes.js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NOT FOUND" -ForegroundColor Red
        $allFilesExist = $false
    }
}

cd ../CitizenVoice
$frontendFiles = @(
    "src/components/ClassificationResults.jsx",
    "src/components/AIIssueForm.jsx"
)

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NOT FOUND" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

# Summary
if ($allFilesExist) {
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ AI CLASSIFICATION INTEGRATION COMPLETE!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "   1. Verify GEMINI_API_KEY in Backend/.env" -ForegroundColor White
    Write-Host "   2. Start Backend:  cd Backend && npm start" -ForegroundColor White
    Write-Host "   3. Start Frontend: cd CitizenVoice && npm run dev" -ForegroundColor White
    Write-Host "   4. Test by uploading an issue image" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 Documentation:" -ForegroundColor Cyan
    Write-Host "   - AI_CLASSIFICATION_INTEGRATION.md (Complete guide)" -ForegroundColor White
    Write-Host "   - INTEGRATION_PROMPTS.md (Commands & testing)" -ForegroundColor White
    Write-Host "   - INTEGRATION_SUMMARY.md (Visual overview)" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 Happy coding!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some files are missing. Please check the integration." -ForegroundColor Yellow
    Write-Host "   Run the file creation steps from INTEGRATION_PROMPTS.md" -ForegroundColor White
}

cd ..
