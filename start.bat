@echo off
echo ========================================
echo   Game Theory Bot - Starting...
echo ========================================

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo [2/3] Building shared types...
call npm run build:shared
if %errorlevel% neq 0 (
    echo ERROR: shared build failed
    pause
    exit /b 1
)

echo [3/3] Starting server and client...
echo Server: http://localhost:3000
echo Client: http://localhost:5173
echo Press Ctrl+C to stop

start "GTB Server" cmd /c "npm run dev:server"
timeout /t 3 /nobreak >nul
start "GTB Client" cmd /c "npm run dev:client"

echo Both processes started. Check the opened windows.
pause
