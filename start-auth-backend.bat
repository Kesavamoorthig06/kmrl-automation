@echo off
echo Starting KMRL Auth Backend Server...
echo.

cd auth-server
echo Installing dependencies...
call npm install

echo.
echo Starting auth server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

call npm start
