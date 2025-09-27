@echo off
echo ========================================
echo    KMRL QR Code Generator
echo ========================================
echo.

echo Installing dependencies...
call npm install

echo.
echo Generating QR codes...
call node generate_qr_codes.js

echo.
echo ========================================
echo    QR Codes generated successfully!
echo ========================================
echo.
echo Check the 'qr-codes' folder for generated files.
echo.
pause
