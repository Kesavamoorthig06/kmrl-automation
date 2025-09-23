# Invalid QR Codes for Testing Error Handling

## Purpose
These QR codes contain invalid data that should trigger error messages in the KMRL system.

## Invalid QR Codes Created

### 1. INVALID_QR_001
- **File:** INVALID_QR_001.png
- **Data:** INVALID001
- **Expected Result:** Error message "Invalid QR Code: INVALID001"

### 2. INVALID_QR_002
- **File:** INVALID_QR_002.png
- **Data:** FAKE123
- **Expected Result:** Error message "Invalid QR Code: FAKE123"

### 3. INVALID_QR_003
- **File:** INVALID_QR_003.png
- **Data:** TEST456
- **Expected Result:** Error message "Invalid QR Code: TEST456"

## How to Test Error Handling

1. **Scan Invalid QR Codes:**
   - Use the QR scanner on the login page
   - Scan any of these invalid QR codes
   - Should see red error message

2. **Manual Input Testing:**
   - Enter invalid QR code data manually in the input field
   - Try: INVALID001, FAKE123, TEST456, or any other invalid code
   - Should see error message when trying to login

3. **Expected Behavior:**
   - ❌ Invalid QR codes should show error messages
   - ❌ Login should be blocked for invalid QR codes
   - ✅ Only valid QR codes should allow login

## Valid QR Codes (for comparison)
- 23it279 (Operation Staff)
- TECH001 (Technical)
- YARD001 (Yard Operations)
- BRAND001 (Branding Officer)
- CLEAN001 (Cleaning Crew)

Created on: 2025-09-23T03:06:24.338Z
