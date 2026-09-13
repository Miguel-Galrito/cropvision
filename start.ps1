# CropVision SaaS Local Launcher for Windows PowerShell
Write-Host "=======================================================================" -ForegroundColor Cyan
Write-Host "         Starting CropVision SaaS Backend and Frontend                 " -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Cyan

$RootPath = $PSScriptRoot
if (-not $RootPath) { $RootPath = Get-Location }

# 1. Start FastAPI Backend in new window
Write-Host "[1/2] Launching FastAPI Backend on http://localhost:8000..." -ForegroundColor Yellow
$BackendCmd = "cd '$RootPath\backend'; & '.\.venv\Scripts\Activate.ps1'; python -m uvicorn app.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $BackendCmd

# 2. Start Next.js Frontend in new window
Write-Host "[2/2] Launching Next.js Frontend on http://localhost:3000..." -ForegroundColor Yellow
$FrontendCmd = "cd '$RootPath\frontend'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $FrontendCmd

Write-Host "`nBoth services launched in separate windows!" -ForegroundColor Green
Write-Host "- Web Application:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Swagger API Docs:   http://localhost:8000/api/v1/docs" -ForegroundColor Cyan
Write-Host "=======================================================================" -ForegroundColor Cyan

Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"
