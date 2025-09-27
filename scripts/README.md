# KMRL QR Code Generator Scripts

This directory contains scripts to generate QR codes for the KMRL Employee Login System.

## Quick Start

### Option 1: Using Batch File (Windows)
```bash
# Double-click or run:
generate_qr_codes.bat
```

### Option 2: Using PowerShell (Windows)
```powershell
# Run in PowerShell:
.\generate_qr_codes.ps1
```

### Option 3: Using Node.js directly
```bash
# Install dependencies
npm install

# Generate QR codes
node generate_qr_codes.js
```

## What it does

The script will:

1. **Install required dependencies** (qrcode package)
2. **Generate 5 QR codes** for different employee roles:
   - Branding Officer (BRAND001)
   - Cleaning Crew (CLEAN001)
   - Technical Staff (TECH001)
   - Yard Operations (YARD001)
   - Administrator (ADMIN001)

3. **Save files to `../qr-codes/` directory:**
   - PNG images of each QR code
   - Text files with credentials
   - README.md with instructions

## Generated Files

After running the script, you'll find in the `qr-codes` folder:

```
qr-codes/
├── README.md
├── KMRL_Branding_Officer_BRAND001.png
├── KMRL_Branding_Officer_BRAND001_credentials.txt
├── KMRL_Cleaning_Crew_CLEAN001.png
├── KMRL_Cleaning_Crew_CLEAN001_credentials.txt
├── KMRL_Technical_Staff_TECH001.png
├── KMRL_Technical_Staff_TECH001_credentials.txt
├── KMRL_Yard_Operations_YARD001.png
├── KMRL_Yard_Operations_YARD001_credentials.txt
├── KMRL_Administrator_ADMIN001.png
└── KMRL_Administrator_ADMIN001_credentials.txt
```

## Testing the QR Codes

1. **Run the generator script** (any of the options above)
2. **Open `../html pages/login.html`** in your browser
3. **Click "Open Camera"** button
4. **Scan any of the generated QR codes**
5. **Verify automatic login and redirection**

## Customization

To modify the QR codes or add new roles:

1. **Edit `generate_qr_codes.js`**
2. **Update the `qrCredentials` object**
3. **Run the generator script again**

## Dependencies

- **Node.js** (required)
- **qrcode** package (installed automatically)

## Troubleshooting

### If npm install fails:
```bash
# Try with administrator privileges
npm install --global qrcode
```

### If Node.js is not installed:
1. Download from [nodejs.org](https://nodejs.org/)
2. Install and restart your terminal
3. Run the script again

### If QR codes don't work:
1. Check that `login.html` has the updated QR processing code
2. Verify the QR code data matches the credentials in the login page
3. Test with a QR code scanner app to verify the codes contain the correct data

## File Structure

```
scripts/
├── generate_qr_codes.js      # Main generator script
├── generate_qr_codes.bat     # Windows batch file
├── generate_qr_codes.ps1     # PowerShell script
├── package.json              # Node.js dependencies
└── README.md                 # This file

../qr-codes/                  # Generated QR codes (created by script)
├── README.md
├── *.png                     # QR code images
└── *_credentials.txt         # Credential files
```
