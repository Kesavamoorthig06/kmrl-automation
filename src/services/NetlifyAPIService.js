const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions' 
  : 'http://localhost:8888/.netlify/functions';

class NetlifyAPIService {
  async makeRequest(endpoint, options = {}) {
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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get train data
  async getTrainData() {
    return this.makeRequest('/get-train-data');
  }

  // Get analytics data
  async getAnalytics() {
    return this.makeRequest('/get-analytics');
  }

  // Chat with bot
  async chatWithBot(message, context = {}) {
    return this.makeRequest('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message, context })
    });
  }

  // Optimize deployment
  async optimizeDeployment(selectedTrains, constraints = {}) {
    return this.makeRequest('/optimize-deployment', {
      method: 'POST',
      body: JSON.stringify({ selectedTrains, constraints })
    });
  }

  // Get system status
  async getSystemStatus() {
    const [trainData, analytics] = await Promise.all([
      this.getTrainData(),
      this.getAnalytics()
    ]);

    return {
      trains: trainData.data?.trains || [],
      analytics: analytics.data || {},
      summary: trainData.data?.summary || {}
    };
  }

  // Get real-time updates
  async getRealTimeUpdates() {
    return this.makeRequest('/get-analytics');
  }
}

export default new NetlifyAPIService();
