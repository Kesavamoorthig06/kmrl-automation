# KMRL Employee QR Codes

## Generated QR Codes

This directory contains QR codes for different KMRL employee roles. Each QR code contains login credentials that automatically log in users and redirect them to their respective dashboard pages.

### Available QR Codes:

| Role | QR Data | Worker ID | Password | Redirects to |
|------|---------|-----------|----------|--------------|
| Branding Officer | BRAND001 | BRAND001 | password | branding_officer.html |
| Cleaning Crew | CLEAN001 | CLEAN001 | password | cleaning.html |
| Technical Staff | TECH001 | TECH001 | password | technical.html |
| Yard Operations | YARD001 | YARD001 | password | yard.html |
| Administrator | ADMIN001 | ADMIN001 | password | operation staff.html |

### How to Use:

1. **For Testing:**
   - Open `login.html` in your browser
   - Click "Open Camera" button
   - Scan any of the QR codes in this directory
   - You will be automatically logged in and redirected

2. **For Employees:**
   - Each employee should scan their role-specific QR code
   - The system will automatically fill in credentials and log them in
   - They will be redirected to their appropriate dashboard

### Files in this directory:

- `KMRL_Branding_Officer_BRAND001.png` - Branding Officer QR Code
- `KMRL_Cleaning_Crew_CLEAN001.png` - Cleaning Crew QR Code  
- `KMRL_Technical_Staff_TECH001.png` - Technical Staff QR Code
- `KMRL_Yard_Operations_YARD001.png` - Yard Operations QR Code
- `KMRL_Administrator_ADMIN001.png` - Administrator QR Code

Each QR code also has a corresponding `_credentials.txt` file with detailed information.

### Security Notes:

- These QR codes are for testing purposes only
- In production, use unique, secure passwords for each role
- Consider implementing proper authentication and encryption
- QR codes should be kept secure and not shared publicly

Generated on: 25/9/2025, 12:13:54 am