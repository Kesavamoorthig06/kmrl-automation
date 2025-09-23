# KMRL Metro Authentication Server

A Node.js backend server for handling QR code-based authentication for Kochi Metro Rail Limited (KMRL) employee login system.

## Features

- 🔐 **QR Code Authentication**: Secure login using QR codes and worker credentials
- 👥 **Worker Management**: Database-driven worker authentication
- 🎫 **QR Code Management**: Support for multiple QR code types and redirects
- 📱 **Session Tracking**: Login session management and tracking
- 🔒 **JWT Tokens**: Secure token-based authentication
- 📊 **Admin APIs**: Endpoints for managing QR codes and viewing sessions

## Quick Start

### Option 1: Use the Batch File (Windows)
```bash
# Double-click the batch file
start-auth-server.bat
```

### Option 2: Manual Setup
```bash
# Navigate to auth-server directory
cd auth-server

# Install dependencies
npm install

# Start the server
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Employee login with QR code
- `POST /api/auth/verify-qr` - Verify QR code validity
- `GET /api/auth/profile` - Get worker profile (requires token)
- `POST /api/auth/logout` - Logout and invalidate session

### Admin
- `GET /api/qr-codes` - Get all QR codes (requires token)
- `GET /api/sessions` - Get login sessions (requires token)

### System
- `GET /api/health` - Health check endpoint
- `GET /login` - Login page

## Authentication

The system now uses **admin credentials** for dashboard access. The authentication is based on:

- **Worker ID**: Must be "admin"
- **QR Code**: Must be a valid QR code from the database
- **Password**: Must be "admin"

### Valid QR Codes

| QR Code | Type | Description | Redirect Page |
|---------|------|-------------|---------------|
| 23it279 | operation | Operation Staff Access | operation staff.html |
| TECH001 | technical | Technical Department Access | technical.html |
| YARD001 | yard | Yard Operations Access | yard.html |
| OPS001 | operations | Metro Operations Interface | kochi_metro_ops_interface.html |
| BRAND001 | branding | Branding Officer Access | branding_officer.html |
| CLEAN001 | cleaning | Cleaning Crew Access | cleaning.html |

### Direct Access URLs

You can also access these pages directly:
- **Cleaning Page**: `http://localhost:5000/cleaning.html`
- **Login Page**: `http://localhost:5000/login`
- **Operation Staff**: `http://localhost:5000/operation staff.html`
- **Technical**: `http://localhost:5000/technical.html`
- **Yard Operations**: `http://localhost:5000/yard.html`
- **Operations Interface**: `http://localhost:5000/kochi_metro_ops_interface.html`
- **Branding Officer**: `http://localhost:5000/branding_officer.html`

### Example Login
- **Worker ID**: `admin`
- **QR Code**: `23it279` (scan or enter manually)
- **Password**: `admin`

## Database Schema

### Workers Table
- `worker_id` - Unique worker identifier
- `name` - Worker's full name
- `department` - Department/role
- `password_hash` - Bcrypt hashed password
- `qr_code` - Associated QR code
- `is_active` - Account status

### QR Codes Table
- `code` - QR code value
- `type` - QR code type/category
- `description` - Human-readable description
- `redirect_url` - Page to redirect after login
- `is_active` - QR code status

### Login Sessions Table
- `session_id` - Unique session identifier
- `worker_id` - Associated worker
- `qr_code` - QR code used for login
- `login_time` - Timestamp of login
- `ip_address` - Client IP address
- `user_agent` - Client user agent

## Security Features

- 🔐 **Password Hashing**: Bcrypt for secure password storage
- 🎫 **JWT Tokens**: Secure token-based authentication
- 🛡️ **CORS Protection**: Configurable CORS settings
- 📝 **Session Tracking**: Comprehensive login session logging
- 🔒 **Input Validation**: Server-side validation for all inputs

## Configuration

Create a `.env` file based on `env.example`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_secret_key_here
DB_PATH=./kmrl_auth.db
CORS_ORIGIN=http://localhost:3000,http://localhost:5000
```

## Usage

1. **Start the server** using one of the methods above
2. **Open your browser** and go to `http://localhost:5000/login`
3. **Enter credentials**:
   - Worker ID: `admin`
   - Password: `admin`
   - QR Code: Scan `23it279` or enter manually
4. **Click Login** to authenticate and redirect to dashboard (admin login) or specific department page

## Development

```bash
# Install dependencies
npm install

# Start in development mode (with auto-restart)
npm run dev

# Start in production mode
npm start
```

## Troubleshooting

### Common Issues

1. **Port 5000 already in use**
   - Change the PORT in your `.env` file
   - Or kill the process using port 5000

2. **Database errors**
   - Delete `kmrl_auth.db` and restart the server
   - Check file permissions in the auth-server directory

3. **QR Code not working**
   - Ensure the QR code exists in the database
   - Check if the QR code is marked as active

### Logs

The server logs all important events to the console. Check the terminal output for:
- Database connection status
- Authentication attempts
- API requests
- Error messages

## License

MIT License - See LICENSE file for details
