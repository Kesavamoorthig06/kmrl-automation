# KMRL QR Code Generator PowerShell Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    KMRL QR Code Generator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Generating QR codes..." -ForegroundColor Yellow
node generate_qr_codes.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    QR Codes generated successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Check the 'qr-codes' folder for generated files." -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
