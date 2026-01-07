# Start Script for Python AI Service

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Starting SIH AI Classification Service" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if virtual environment exists
if (-not (Test-Path "venv")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run setup.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Check if model exists
if (-not (Test-Path "model/civic_issues_model.h5")) {
    Write-Host "WARNING: Model file not found!" -ForegroundColor Red
    Write-Host "The service will start but classification will fail." -ForegroundColor Yellow
    Write-Host "Please place your model at: model/civic_issues_model.h5" -ForegroundColor White
    Write-Host "`nContinuing anyway in 5 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Activate virtual environment and start service
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

Write-Host "Starting Flask service..." -ForegroundColor Yellow
Write-Host "`n========================================`n" -ForegroundColor Cyan

python app.py
