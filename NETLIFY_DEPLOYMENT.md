# Netlify Deployment Guide for KMRL Metro System

## 🚀 Overview

This guide explains how to deploy your KMRL Metro System to Netlify with full backend functionality using Netlify Functions.

## 📁 Project Structure

```
kmrl/
├── netlify/
│   └── functions/
│       ├── ml-optimization.js    # ML train optimization
│       ├── generate-qr.js        # QR code generation
│       ├── train-data.js         # Train data API
│       ├── health.js             # Health check
│       └── package.json          # Function dependencies
├── src/
│   ├── services/
│   │   ├── api.js                # API service
│   │   └── MLDataService.js      # Updated to use API
│   └── ...
├── public/
│   ├── train_*.csv               # Data files
│   └── ml_analysis_data.csv      # Generated data
├── netlify.toml                  # Netlify configuration
└── package.json
```

## 🔧 API Endpoints

### Available Endpoints:

1. **Health Check**
   - `GET /.netlify/functions/health`
   - Returns system status

2. **ML Optimization**
   - `GET /.netlify/functions/ml-optimization`
   - Runs ML train optimization
   - Returns optimized train selection

3. **QR Code Generation**
   - `GET /.netlify/functions/generate-qr?role=brand`
   - Generates QR code for specific role
   - Available roles: brand, clean, tech, yard, operation, admin

4. **Train Data**
   - `GET /.netlify/functions/train-data?file=fitness_certificates`
   - Returns CSV data as JSON
   - Available files: fitness_certificates, job_cards, branding_priorities, mileage_data, cleaning_status, stabling_geometry, ml_analysis

## 🚀 Deployment Steps

### 1. Prepare Your Project

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Deploy to Netlify

#### Option A: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

#### Option B: Git Integration
1. Push your code to GitHub/GitLab
2. Connect repository to Netlify
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

### 3. Environment Variables (Optional)

In Netlify dashboard, add environment variables:
- `NODE_ENV=production`
- `REACT_APP_API_URL=https://your-site.netlify.app`

## 🔄 How It Works

### Local Development:
- Frontend: `npm run dev` (Vite dev server)
- Functions: `netlify dev` (Netlify CLI)

### Production:
- Frontend: Static files served by Netlify CDN
- Backend: Netlify Functions (serverless)
- Data: CSV files in `public/` folder

## 📊 Data Flow

1. **User opens app** → React frontend loads
2. **User logs in** → QR scan or manual entry
3. **Dashboard loads** → API calls to Netlify Functions
4. **ML optimization** → Processes CSV data
5. **Results displayed** → Real-time updates

## 🛠️ API Usage Examples

### Frontend API Calls:

```javascript
// Health check
const health = await fetch('/.netlify/functions/health');

// ML optimization
const optimization = await fetch('/.netlify/functions/ml-optimization');

// Generate QR code
const qrCode = await fetch('/.netlify/functions/generate-qr?role=brand');

// Get train data
const trainData = await fetch('/.netlify/functions/train-data?file=fitness_certificates');
```

## 🔍 Testing

### Local Testing:
```bash
# Start Netlify dev server
netlify dev

# Test endpoints
curl http://localhost:8888/.netlify/functions/health
curl http://localhost:8888/.netlify/functions/ml-optimization
```

### Production Testing:
```bash
# Test your deployed site
curl https://your-site.netlify.app/.netlify/functions/health
```

## 🚨 Troubleshooting

### Common Issues:

1. **Functions not working**
   - Check `netlify.toml` configuration
   - Verify function files are in `netlify/functions/`
   - Check Netlify function logs

2. **CORS errors**
   - Functions include CORS headers
   - Check browser console for errors

3. **Data not loading**
   - Verify CSV files are in `public/` folder
   - Check function logs in Netlify dashboard

4. **Build failures**
   - Check Node.js version (18+)
   - Verify all dependencies are installed
   - Check build logs in Netlify dashboard

## 📈 Performance

- **Frontend**: CDN-cached static files
- **Functions**: Serverless, auto-scaling
- **Data**: CSV files served as static assets
- **Caching**: Netlify CDN + function caching

## 🔐 Security

- Functions run in isolated environment
- No persistent storage (stateless)
- CORS properly configured
- No sensitive data in client-side code

## 📝 Notes

- Functions have 10-second timeout limit
- File size limit: 50MB per function
- Concurrent executions: 1000
- Cold start: ~1-2 seconds

## 🎯 Success Criteria

After deployment, your app should:
- ✅ Load the login page
- ✅ Handle QR code scanning
- ✅ Navigate between worker pages
- ✅ Run ML optimization
- ✅ Display train data
- ✅ Generate QR codes
- ✅ Work exactly like localhost

## 🆘 Support

If you encounter issues:
1. Check Netlify function logs
2. Verify all files are deployed
3. Test API endpoints directly
4. Check browser console for errors
