# KMRL Metro Management System - Netlify Frontend Deployment

## 🚇 Project Overview

This guide covers deploying the **frontend only** to Netlify while running the backend locally or on a separate service.

## 🎯 Architecture

- **Frontend**: React app deployed on Netlify
- **Backend**: Separate Node.js servers (main server + auth server)
- **API Communication**: Frontend connects to backend via environment variables

## 🚀 Quick Start

### 1. Start Backend Servers (Local)

**Option A: Start Both Servers**
```bash
# Double-click or run:
start-both-backends.bat
```

**Option B: Start Individual Servers**
```bash
# Main server (port 4000)
start-backend.bat

# Auth server (port 5000) 
start-auth-backend.bat
```

### 2. Deploy Frontend to Netlify

**Option A: Deploy via Netlify CLI**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

**Option B: Deploy via Netlify Dashboard**
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: `18`

## ⚙️ Configuration

### Environment Variables

**For Local Development:**
```bash
# Copy env.example to .env
cp env.example .env

# Edit .env file:
REACT_APP_API_URL=http://localhost:4000
REACT_APP_ENVIRONMENT=development
```

**For Netlify Production:**
1. Go to Site Settings → Environment Variables
2. Add these variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.herokuapp.com
   REACT_APP_ENVIRONMENT=production
   ```

### Backend URLs

Update the backend URL in these places:

1. **Netlify Environment Variables** (for production)
2. **Local .env file** (for development)
3. **Backend deployment** (if using Heroku, Railway, etc.)

## 🔧 Backend Deployment Options

### Option 1: Local Development Only
- Run backend servers locally using the `.bat` files
- Frontend connects to `http://localhost:4000`

### Option 2: Deploy Backend to Cloud
**Heroku:**
```bash
# In server/ directory
heroku create kmrl-main-server
git subtree push --prefix server heroku main

# In auth-server/ directory  
heroku create kmrl-auth-server
git subtree push --prefix auth-server heroku main
```

**Railway:**
```bash
# Connect GitHub repo to Railway
# Set up two services: server/ and auth-server/
```

**Render:**
```bash
# Create two web services
# Connect to server/ and auth-server/ directories
```

## 📁 Project Structure

```
kmrl/
├── src/                    # React frontend
├── public/                 # Static assets
├── server/                 # Main backend server
├── auth-server/           # Authentication server
├── netlify.toml           # Netlify configuration
├── start-backend.bat      # Start main server
├── start-auth-backend.bat # Start auth server
├── start-both-backends.bat # Start both servers
└── env.example            # Environment variables template
```

## 🔄 Development Workflow

### 1. Start Backend
```bash
# Start both servers
start-both-backends.bat
```

### 2. Start Frontend
```bash
# In main directory
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:3000
- Main API: http://localhost:4000
- Auth API: http://localhost:5000

## 🚀 Deployment Workflow

### 1. Deploy Backend (Optional)
```bash
# Deploy to your preferred platform
# Update REACT_APP_API_URL in Netlify
```

### 2. Deploy Frontend
```bash
# Via CLI
netlify deploy --prod

# Or via Git push (if connected to Netlify)
git push origin main
```

## 🔐 Authentication Flow

1. **User visits Netlify frontend**
2. **Login page** calls backend auth API
3. **Backend validates** credentials
4. **Frontend stores** JWT token
5. **Dashboard** uses token for API calls

## 📊 API Endpoints

### Main Server (Port 4000)
- `POST /api/deploy` - Deploy trains
- `POST /api/rerun-simulation` - Run ML simulation
- `GET /api/health` - Health check

### Auth Server (Port 5000)
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-qr` - Verify QR code
- `GET /api/health` - Health check

## 🛠️ Troubleshooting

### Common Issues

**1. CORS Errors:**
- Ensure backend servers have CORS enabled
- Check that frontend URL is in CORS origins

**2. API Connection Failed:**
- Verify `REACT_APP_API_URL` is correct
- Check if backend servers are running
- Test API endpoints directly

**3. Build Failures:**
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check for TypeScript/ESLint errors

### Debug Steps

1. **Check Backend Status:**
   ```bash
   curl http://localhost:4000/api/health
   curl http://localhost:5000/api/health
   ```

2. **Check Environment Variables:**
   ```bash
   echo $REACT_APP_API_URL
   ```

3. **Check Network Tab:**
   - Open browser dev tools
   - Look for failed API requests
   - Check CORS headers

## 🎉 Success!

Your KMRL Metro Management System is now deployed with:

- ✅ **Frontend on Netlify** - Fast, global CDN
- ✅ **Backend locally** - Easy development and testing
- ✅ **Flexible deployment** - Backend can be moved to cloud anytime
- ✅ **Environment management** - Easy switching between dev/prod

## 🔄 Next Steps

1. **Test the deployment** - Verify all functionality works
2. **Set up monitoring** - Add error tracking and analytics
3. **Deploy backend** - Move to cloud when ready
4. **Add CI/CD** - Automate deployments
5. **Scale up** - Add more features and optimizations

---

**Frontend URL**: `https://your-app-name.netlify.app`
**Backend URLs**: `http://localhost:4000` (main) + `http://localhost:5000` (auth)
**Admin Login**: `admin` / `admin`
