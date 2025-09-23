@echo off
echo Starting Both KMRL Backend Servers...
echo.

echo Starting Main Server (Port 4000)...
start "KMRL Main Server" cmd /k "cd server && npm install && npm start"

echo.
echo Starting Auth Server (Port 5000)...
start "KMRL Auth Server" cmd /k "cd auth-server && npm install && npm start"

echo.
echo Both servers are starting...
echo Main Server: http://localhost:4000
echo Auth Server: http://localhost:5000
echo.
echo Close the command windows to stop the servers
pause
