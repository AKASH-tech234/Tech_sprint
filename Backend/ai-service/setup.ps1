# Setup Script for Python AI Service
# Run this to set up the Python environment and dependencies

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SIH AI Classification Service Setup" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Python not found!" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://www.python.org/" -ForegroundColor Yellow
    exit 1
}

# Create virtual environment
Write-Host "`nCreating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv") {
    Write-Host "Virtual environment already exists" -ForegroundColor Green
} else {
    python -m venv venv
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Virtual environment created successfully" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
}

# Activate virtual environment
Write-Host "`nActivating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Upgrade pip
Write-Host "`nUpgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "`nERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check if model exists
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Model File Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path "model/civic_issues_model.h5") {
    $modelSize = (Get-Item "model/civic_issues_model.h5").Length / 1MB
    Write-Host "`nModel found: civic_issues_model.h5 ($([math]::Round($modelSize, 2)) MB)" -ForegroundColor Green
    Write-Host "You're ready to go!" -ForegroundColor Green
} else {
    Write-Host "`nWARNING: Model file not found!" -ForegroundColor Red
    Write-Host "`nPlease download the trained model and place it here:" -ForegroundColor Yellow
    Write-Host "  Backend/ai-service/model/civic_issues_model.h5" -ForegroundColor White
    Write-Host "`nYou can get the model from:" -ForegroundColor Yellow
    Write-Host "  https://github.com/SayemKhan1111/SIH-AI-Issues-Classification-" -ForegroundColor White
    Write-Host "`nThe service will start but won't work without the model." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nTo start the service:" -ForegroundColor Yellow
Write-Host "  1. Make sure virtual environment is activated" -ForegroundColor White
Write-Host "  2. Run: python app.py" -ForegroundColor White
Write-Host "`nThe service will run on: http://localhost:5001" -ForegroundColor White
Write-Host "`n========================================`n" -ForegroundColor Cyan
