@echo off
echo Generating PNG icons for crew roles...
echo.

REM Create png directory
if not exist "png" mkdir png

REM Generate SVG files
node generate-pngs.js

echo.
echo PNG generation complete!
echo.
echo To get PNG files:
echo 1. Open generate-pngs.html in your browser
echo 2. Click the "Download PNG" button for each icon
echo 3. Or use online SVG to PNG converters with the SVG files in the png/ folder
echo.
pause

