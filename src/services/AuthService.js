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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('✅ Login successful:', data);

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
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify QR code
  async verifyQRCode(qrCode) {
    try {
      console.log('🔍 Verifying QR code:', qrCode);
      
      const response = await fetch(`${this.baseURL}/api/auth/verify-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'QR code verification failed');
      }

      const data = await response.json();
      console.log('✅ QR code verified:', data);

      return {
        success: true,
        qrCode: data.qrCode
      };
    } catch (error) {
      console.error('❌ QR verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
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
