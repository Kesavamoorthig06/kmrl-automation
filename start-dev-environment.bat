@echo off
title KMRL Development Environment - Smart Launcher
color 0B

echo ========================================
echo    KMRL Smart Development Launcher
echo    Automated Server Management
echo ========================================
echo.

:: Set error handling
setlocal enabledelayedexpansion

:: Check prerequisites
echo [1/5] Checking prerequisites...

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js found: 
node --version

:: Check if package.json files exist
if not exist "package.json" (
    echo ❌ ERROR: package.json not found in root directory
    pause
    exit /b 1
)
if not exist "auth-server\package.json" (
    echo ❌ ERROR: auth-server\package.json not found
    pause
    exit /b 1
)
if not exist "server\package.json" (
    echo ❌ ERROR: server\package.json not found
    pause
    exit /b 1
)
echo ✅ All package.json files found
echo.

:: Install dependencies
echo [2/5] Installing/Updating dependencies...

echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

echo Installing auth-server dependencies...
cd auth-server
call npm install
if errorlevel 1 (
    echo ❌ Failed to install auth-server dependencies
    pause
    exit /b 1
)
cd ..

echo Installing main-server dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ❌ Failed to install main-server dependencies
    pause
    exit /b 1
)
cd ..

echo ✅ All dependencies installed
echo.

:: Check for environment files
echo [3/5] Checking environment configuration...

if not exist "auth-server\.env" (
    if exist "auth-server\env.example" (
        echo ⚠️  WARNING: auth-server\.env not found
        echo Copying from env.example...
        copy "auth-server\env.example" "auth-server\.env"
    )
)

if not exist "server\.env" (
    if exist "server\env.example" (
        echo ⚠️  WARNING: server\.env not found
        echo Copying from env.example...
        copy "server\env.example" "server\.env"
    )
)

echo ✅ Environment configuration checked
echo.

:: Kill any existing processes on the ports
echo [4/5] Checking for existing processes...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Killing process on port 3000: %%a
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo Killing process on port 3001: %%a
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Killing process on port 5000: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo ✅ Port cleanup completed
echo.

:: Start servers
echo [5/5] Starting all servers...

echo Starting Auth Server (Port 5000)...
start "KMRL - Auth Server" cmd /k "cd /d "%~dp0auth-server" && echo 🔐 Auth Server starting on http://localhost:5000 && echo Login: http://localhost:5000/login && echo Health: http://localhost:5000/api/health && echo. && npm start && echo. && echo Auth Server stopped. Press any key to close... && pause >nul"

echo Starting Main Server (Port 3001)...
start "KMRL - Main Server" cmd /k "cd /d "%~dp0server" && echo 🚀 Main Server starting on http://localhost:3001 && echo API: http://localhost:3001/api && echo. && npm start && echo. && echo Main Server stopped. Press any key to close... && pause >nul"

echo Waiting for backend servers to initialize...
timeout /t 5 /nobreak >nul

echo Starting React Frontend (Port 3000)...
start "KMRL - Frontend" cmd /k "cd /d "%~dp0" && echo 🌐 Frontend starting on http://localhost:3000 && echo. && npm start && echo. && echo Frontend stopped. Press any key to close... && pause >nul"

:: Wait for frontend to start
echo Waiting for frontend to start...
timeout /t 10 /nobreak >nul

:: Open browser
echo.
echo ========================================
echo    🎉 Development Environment Ready!
echo ========================================
echo.
echo 📱 Services Running:
echo    Frontend:     http://localhost:3000
echo    Auth Server:  http://localhost:5000
echo    Main Server:  http://localhost:3001
echo.
echo 🔗 Quick Links:
echo    Dashboard:    http://localhost:3000/dashboard
echo    Admin Panel:  http://localhost:3000/admin
echo    Login:        http://localhost:5000/login
echo.
echo Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo    💡 Tips:
echo    - Each server runs in its own window
echo    - Close individual windows to stop servers
echo    - Press Ctrl+C in server windows to stop
echo    - Run this script again to restart everything
echo ========================================
echo.
echo Press any key to close this launcher...
pause >nul
