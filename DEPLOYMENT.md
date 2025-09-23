# KMRL Metro Management System - Vercel Deployment

## 🚇 Project Overview

The KMRL (Kochi Metro Rail Limited) Metro Management System is a comprehensive web application for managing metro train operations, maintenance, and crew coordination. This system includes:

- **Frontend**: React-based dashboard with real-time train monitoring
- **Backend**: API routes for deployment, authentication, and data management
- **Features**: Train selection, deployment simulation, QR code authentication, and ML-based optimization

## 🚀 Deployment to Vercel

### Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Your code is already committed to git
3. **Node.js**: Version 18+ (Vercel will handle this automatically)

### Deployment Steps

#### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Link to existing project: No
   - Project name: `kmrl-metro-system` (or your preferred name)
   - Directory: `.` (current directory)
   - Override settings: No

#### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub** (if not already done):
   ```bash
   git remote add origin https://github.com/yourusername/kmrl-metro-system.git
   git push -u origin master
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `build`
     - Install Command: `npm install`

## 📁 Project Structure

```
kmrl/
├── api/                    # Vercel API routes
│   ├── auth/
│   │   ├── login.js       # Authentication endpoint
│   │   └── verify-qr.js   # QR code verification
│   ├── deploy.js          # Train deployment endpoint
│   ├── health.js          # Health check endpoint
│   └── rerun-simulation.js # ML simulation endpoint
├── src/                   # React frontend
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── services/         # Data services
│   └── utils/            # Utility functions
├── public/               # Static assets
│   ├── ml_analysis_data.csv  # ML data file
│   └── charts/           # Generated charts
├── vercel.json          # Vercel configuration
└── package.json         # Dependencies and scripts
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login with QR code
- `POST /api/auth/verify-qr` - Verify QR code validity

### Operations
- `POST /api/deploy` - Deploy selected trains
- `POST /api/rerun-simulation` - Run ML simulation
- `GET /api/health` - Health check

### Data Access
- `GET /ml_analysis_data.csv` - Access ML analysis data
- `GET /charts/*` - Access generated charts

## 🎯 Key Features

### 1. Train Management Dashboard
- Real-time train status monitoring
- ML-based train selection and optimization
- Performance metrics and analytics
- Interactive train details modal

### 2. Deployment System
- Select multiple trains for deployment
- Simulate crew notifications
- Track deployment status
- Generate deployment reports

### 3. Authentication System
- QR code-based authentication
- Role-based access control
- Session management
- Secure API endpoints

### 4. Data Visualization
- Performance charts and graphs
- Real-time metrics display
- Export functionality
- Interactive dashboards

## 🔐 Environment Variables

For production deployment, you may want to set these environment variables in Vercel:

```bash
# Optional: For enhanced features
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=https://your-domain.vercel.app

# Optional: For notifications (future enhancement)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_FROM=your_twilio_phone

# Optional: For email notifications (future enhancement)
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_PORT=587
```

## 🚀 Post-Deployment

### 1. Test Your Deployment
- Visit your Vercel URL
- Test the login functionality (admin/admin)
- Verify train data loading
- Test deployment simulation

### 2. Custom Domain (Optional)
- Go to your Vercel project settings
- Add your custom domain
- Configure DNS settings

### 3. Monitor Performance
- Use Vercel Analytics
- Monitor API usage
- Check error logs

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### API Testing
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Test login endpoint
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"workerId":"admin","password":"admin"}'
```

## 📊 Data Files

The system uses several data files:

- `public/ml_analysis_data.csv` - Main train data with ML analysis
- `public/charts/` - Generated performance charts
- `data/` - Additional data files for ML processing

## 🔄 Updates and Maintenance

### Updating the Application
1. Make changes to your code
2. Commit and push to git
3. Vercel will automatically redeploy

### Adding New Features
1. Create new API routes in `api/` directory
2. Update frontend components in `src/`
3. Test locally before deploying

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for syntax errors

2. **API Errors**:
   - Verify API route structure
   - Check request/response formats
   - Review Vercel function logs

3. **Data Loading Issues**:
   - Ensure CSV files are in `public/` directory
   - Check file paths and permissions
   - Verify CORS settings

### Getting Help
- Check Vercel documentation
- Review function logs in Vercel dashboard
- Test API endpoints individually

## 🎉 Success!

Your KMRL Metro Management System is now deployed on Vercel! 

**Next Steps:**
1. Share the deployment URL with your team
2. Test all functionality
3. Set up monitoring and analytics
4. Plan for future enhancements

---

**Deployment URL**: `https://your-app-name.vercel.app`
**Admin Login**: `admin` / `admin`
**QR Code**: Use any of the provided QR codes for testing
