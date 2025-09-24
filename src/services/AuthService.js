// Authentication Service for KMRL Metro Management System
// Handles login, token management, and API communication

class AuthService {
  constructor() {
    // Use environment variable for API URL, fallback to localhost for development
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    this.token = localStorage.getItem('kmrl_token');
    this.user = JSON.parse(localStorage.getItem('kmrl_user') || 'null');
  }

  // Login with credentials
  async login(workerId, password, qrCode = null) {
    try {
      console.log('🔐 Attempting login...', { workerId, qrCode });
      
      // Try API first, fallback to local validation if backend is not available
      try {
        const response = await fetch(`${this.baseURL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workerId,
            password,
            qrCode
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ API Login successful:', data);

          // Store authentication data
          this.token = data.token;
          this.user = data.worker;
          
          localStorage.setItem('kmrl_token', this.token);
          localStorage.setItem('kmrl_user', JSON.stringify(this.user));
          localStorage.setItem('kmrl_qrCode', JSON.stringify(data.qrCode));

          return {
            success: true,
            user: this.user,
            qrCode: data.qrCode,
            token: this.token
          };
        }
      } catch (apiError) {
        console.log('⚠️ API not available, using local validation:', apiError.message);
      }

      // Fallback: Local validation (for when backend is not running)
      return this.localLogin(workerId, password, qrCode);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Local login validation (fallback when backend is not available)
  localLogin(workerId, password, qrCode = null) {
    console.log('🔐 Using local login validation...');
    
    // Validate credentials locally
    if (workerId !== 'admin' || password !== 'admin') {
      return {
        success: false,
        error: 'Invalid credentials. Please use admin/admin'
      };
    }

    // Simulate QR code validation
    const validQRCodes = {
      'DEFAULT': { type: 'admin', description: 'Default Admin Access', redirect_url: '/' },
      '23it279': { type: 'operation', description: 'Operation Staff Access', redirect_url: 'operation staff.html' },
      'TECH001': { type: 'technical', description: 'Technical Department Access', redirect_url: 'technical.html' },
      'YARD001': { type: 'yard', description: 'Yard Operations Access', redirect_url: 'yard.html' },
      'OPS001': { type: 'operations', description: 'Metro Operations Interface', redirect_url: 'kochi_metro_ops_interface.html' },
      'BRAND001': { type: 'branding', description: 'Branding Officer Access', redirect_url: 'branding_officer.html' },
      'CLEAN001': { type: 'cleaning', description: 'Cleaning Crew Access', redirect_url: 'cleaning.html' }
    };

    const finalQrCode = qrCode || 'DEFAULT';
    const qrDetails = validQRCodes[finalQrCode];
    
    if (!qrDetails) {
      return {
        success: false,
        error: 'Invalid QR Code'
      };
    }

    // Generate a simple token
    const token = Buffer.from(JSON.stringify({
      workerId: workerId,
      name: workerId,
      department: qrDetails.type || 'General',
      qrCode: qrCode,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64');

    // Store authentication data
    this.token = token;
    this.user = {
      workerId: workerId,
      name: workerId,
      department: qrDetails.type || 'General'
    };
    
    localStorage.setItem('kmrl_token', this.token);
    localStorage.setItem('kmrl_user', JSON.stringify(this.user));
    localStorage.setItem('kmrl_qrCode', JSON.stringify({
      code: finalQrCode,
      type: qrDetails.type,
      description: qrDetails.description,
      redirectUrl: qrDetails.redirect_url
    }));

    console.log('✅ Local login successful');

    return {
      success: true,
      user: this.user,
      qrCode: {
        code: finalQrCode,
        type: qrDetails.type,
        description: qrDetails.description,
        redirectUrl: qrDetails.redirect_url
      },
      token: this.token
    };
  }

  // Verify QR code
  async verifyQRCode(qrCode) {
    try {
      console.log('🔍 Verifying QR code:', qrCode);
      
      // Try API first, fallback to local validation
      try {
        const response = await fetch(`${this.baseURL}/api/auth/verify-qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qrCode })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ API QR code verified:', data);
          return {
            success: true,
            qrCode: data.qrCode
          };
        }
      } catch (apiError) {
        console.log('⚠️ API not available, using local QR validation:', apiError.message);
      }

      // Fallback: Local QR code validation
      return this.localVerifyQRCode(qrCode);
      
    } catch (error) {
      console.error('❌ QR verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Local QR code verification (fallback when backend is not available)
  localVerifyQRCode(qrCode) {
    console.log('🔍 Using local QR code validation...');
    
    const validQRCodes = {
      'DEFAULT': { type: 'admin', description: 'Default Admin Access', redirect_url: '/' },
      '23it279': { type: 'operation', description: 'Operation Staff Access', redirect_url: 'operation staff.html' },
      'TECH001': { type: 'technical', description: 'Technical Department Access', redirect_url: 'technical.html' },
      'YARD001': { type: 'yard', description: 'Yard Operations Access', redirect_url: 'yard.html' },
      'OPS001': { type: 'operations', description: 'Metro Operations Interface', redirect_url: 'kochi_metro_ops_interface.html' },
      'BRAND001': { type: 'branding', description: 'Branding Officer Access', redirect_url: 'branding_officer.html' },
      'CLEAN001': { type: 'cleaning', description: 'Cleaning Crew Access', redirect_url: 'cleaning.html' }
    };

    const qrDetails = validQRCodes[qrCode];
    
    if (!qrDetails) {
      return {
        success: false,
        error: 'Invalid or inactive QR Code'
      };
    }

    console.log('✅ Local QR code verified');

    return {
      success: true,
      qrCode: {
        code: qrCode,
        type: qrDetails.type,
        description: qrDetails.description,
        redirectUrl: qrDetails.redirect_url
      }
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    // Check both instance properties and localStorage
    const hasToken = !!this.token || !!localStorage.getItem('kmrl_token');
    const hasUser = !!this.user || !!localStorage.getItem('kmrl_user');
    return hasToken && hasUser;
  }

  // Get current user
  getCurrentUser() {
    // Refresh from localStorage if not set
    if (!this.user) {
      this.user = JSON.parse(localStorage.getItem('kmrl_user') || 'null');
    }
    return this.user;
  }

  // Refresh authentication state from localStorage
  refreshAuthState() {
    this.token = localStorage.getItem('kmrl_token');
    this.user = JSON.parse(localStorage.getItem('kmrl_user') || 'null');
  }

  // Get stored QR code info
  getStoredQRCode() {
    return JSON.parse(localStorage.getItem('kmrl_qrCode') || 'null');
  }

  // Logout
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('kmrl_token');
    localStorage.removeItem('kmrl_user');
    localStorage.removeItem('kmrl_qrCode');
    console.log('👋 User logged out');
  }

  // Get authorization header for API requests
  getAuthHeader() {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }

  // Make authenticated API request
  async authenticatedRequest(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers
    };

    return fetch(url, {
      ...options,
      headers
    });
  }

  // Deploy trains (authenticated request)
  async deployTrains(trains) {
    try {
      console.log('🚂 Deploying trains:', trains);
      
      const response = await this.authenticatedRequest(`${this.baseURL}/api/deploy`, {
        method: 'POST',
        body: JSON.stringify({ trains })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Deployment failed');
      }

      const data = await response.json();
      console.log('✅ Deployment successful:', data);

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ Deployment error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Rerun ML simulation (authenticated request)
  async rerunSimulation() {
    try {
      console.log('🔄 Rerunning ML simulation...');
      
      const response = await this.authenticatedRequest(`${this.baseURL}/api/rerun-simulation`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Simulation failed');
      }

      const data = await response.json();
      console.log('✅ Simulation completed:', data);

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('❌ Simulation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export default new AuthService();
