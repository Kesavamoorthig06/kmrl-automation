@echo off
echo Starting KMRL Authentication Server...
echo.

cd /d "%~dp0"

echo Installing dependencies if needed...
call npm install

echo.
echo Starting authentication server on port 5000...
echo Login page will be available at: http://localhost:5000/login
echo API health check: http://localhost:5000/api/health
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

pause

