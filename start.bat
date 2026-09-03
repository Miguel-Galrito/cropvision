@echo off
title SatHealth - Earth Observation SaaS Launcher
echo =======================================================================
echo          Starting SatHealth Backend and Frontend Simultaneously
echo =======================================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000...
start "SatHealth Backend (FastAPI)" cmd /k "cd backend && call .venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload --port 8000"

echo [2/2] Launching Next.js Frontend on http://localhost:3000...
start "SatHealth Frontend (Next.js)" cmd /k "cd frontend && npm run dev"

echo.
echo =======================================================================
echo Both services are starting in separate windows!
echo - Frontend: http://localhost:3000
echo - Backend API Docs: http://localhost:8000/api/v1/docs
echo =======================================================================
echo.
timeout /t 5 >nul
start http://localhost:3000
exit /b 0
