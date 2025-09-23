@echo off
echo Starting KMRL Backend Server...
echo.

cd server
echo Installing dependencies...
call npm install

echo.
echo Starting server on http://localhost:4000
echo Press Ctrl+C to stop the server
echo.

call npm start
