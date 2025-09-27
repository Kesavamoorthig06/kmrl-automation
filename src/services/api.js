/**
 * API Service for Netlify Functions
 * Handles all backend API calls
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions' 
  : 'http://localhost:8888/.netlify/functions';

class APIService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }

  // ML Optimization
  async runMLOptimization() {
    return this.request('/ml-optimization');
  }

  // Generate QR Code
  async generateQRCode(role) {
    return this.request(`/generate-qr?role=${role}`);
  }

  // Get all available QR roles
  async getAvailableQRRoles() {
    return this.request('/generate-qr');
  }

  // Get train data
  async getTrainData(file) {
    return this.request(`/train-data?file=${file}`);
  }

  // Get all available data files
  async getAvailableDataFiles() {
    return this.request('/train-data');
  }
}

export default new APIService();
