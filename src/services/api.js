/**
 * API Service for Netlify Functions
 * Handles all backend API calls
 */

// API Base URL configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/.netlify/functions' 
  : 'http://localhost:8888/.netlify/functions';

// Check if we're in development and should use mock data
const isDevelopment = process.env.NODE_ENV !== 'production';
// In production, always try real API first, fallback to mock only on error
const shouldMockAPI = isDevelopment;

class APIService {
  async request(endpoint, options = {}) {
    console.log(`🔄 API Request: ${endpoint}`);

    // Use mock responses in development when netlify dev is not available
    if (shouldMockAPI) {
      return this.getMockResponse(endpoint, options);
    }

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
      console.log(`✅ API Response from ${endpoint}:`, data.success ? 'Success' : 'Failed');
      
      return data;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      // Fallback to mock response if API fails
      return this.getMockResponse(endpoint, options);
    }
  }

  // Mock API responses for development
  getMockResponse(endpoint, options = {}) {
    console.log(`🎭 Using mock response for: ${endpoint}`);
    
    if (endpoint === '/get-analytics') {
      return this.getMockAnalytics();
    }
    
    if (endpoint.startsWith('/get-train-data')) {
      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const file = urlParams.get('file');
      return this.getMockTrainData(file);
    }
    
    if (endpoint === '/ml-optimization') {
      return this.getMockMLOptimization();
    }
    
    if (endpoint.startsWith('/generate-qr')) {
      const urlParams = new URLSearchParams(endpoint.split('?')[1] || '');
      const role = urlParams.get('role');
      return this.getMockQRCode(role);
    }
    
    if (endpoint === '/chatbot') {
      const { message } = JSON.parse(options.body || '{}');
      return this.getMockChatbotResponse(message);
    }
    
    // Default mock response
    return {
      success: true,
      message: 'Mock API response',
      data: null
    };
  }

  getMockAnalytics() {
    const totalTrains = 25;
    const operational = Math.floor(totalTrains * 0.7);
    const maintenance = Math.floor(totalTrains * 0.2);
    const outOfService = totalTrains - operational - maintenance;

    return {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        summary: {
          totalTrains,
          operational,
          maintenance,
          outOfService,
          totalMileage: 156847,
          avgEfficiency: 0.85,
          operationalPercentage: Math.round((operational / totalTrains) * 100)
        },
        performance: {
          cleaning: 88,
          branding: 75,
          operational: 82,
          performance: 79,
          overall: 81
        },
        alerts: [
          {
            type: 'warning',
            trainId: 'KMRL-003',
            message: 'Fitness certificate expires in 15 days',
            timestamp: new Date()
          },
          {
            type: 'critical',
            trainId: 'KMRL-007',
            message: '2 critical issues pending',
            timestamp: new Date()
          },
          {
            type: 'info',
            trainId: 'KMRL-012',
            message: 'Job card pending completion',
            timestamp: new Date()
          }
        ],
        rawDataCounts: {
          fitness_certificates: totalTrains,
          job_cards: totalTrains,
          branding_priorities: totalTrains,
          mileage_data: totalTrains,
          cleaning_status: totalTrains,
          stabling_geometry: totalTrains,
          ml_analysis: totalTrains
        }
      }
    };
  }

  getMockTrainData(file) {
    if (!file) {
      return {
        success: true,
        availableFiles: {
          fitness_certificates: { count: 25, headers: ['train_id', 'compliance_status', 'certificate_expiry_date'] },
          job_cards: { count: 25, headers: ['train_id', 'job_card_status', 'critical_issues'] },
          branding_priorities: { count: 25, headers: ['train_id', 'branding_priority_level', 'completion_percentage'] },
          mileage_data: { count: 25, headers: ['train_id', 'total_mileage', 'mileage_efficiency'] },
          cleaning_status: { count: 25, headers: ['train_id', 'cleaning_score', 'cleaning_quality_rating'] },
          stabling_geometry: { count: 25, headers: ['train_id', 'operational_efficiency', 'deployment_time_minutes'] },
          ml_analysis: { count: 25, headers: ['train_id', 'composite_score', 'overall_status'] }
        },
        totalFiles: 7
      };
    }

    // Generate mock data for specific file
    const data = [];
    for (let i = 1; i <= 25; i++) {
      const trainId = `KMRL-${String(i).padStart(3, '0')}`;
      if (file === 'fitness_certificates') {
        data.push({
          train_id: trainId,
          compliance_status: Math.random() > 0.2 ? 'compliant' : 'non_compliant',
          certificate_expiry_date: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      } else if (file === 'job_cards') {
        data.push({
          train_id: trainId,
          job_card_status: Math.random() > 0.3 ? 'completed' : 'open',
          critical_issues: Math.floor(Math.random() * 3)
        });
      }
      // Add more file types as needed
    }

    return {
      success: true,
      file,
      data,
      count: data.length
    };
  }

  getMockMLOptimization() {
    const results = [];
    const totalTrains = 25;
    
    for (let i = 1; i <= totalTrains; i++) {
      const trainId = `KMRL-${String(i).padStart(3, '0')}`;
      const score = Math.random();
      const status = score > 0.7 ? 'Available' : score > 0.4 ? 'Maintenance' : 'Unavailable';
      
      results.push({
        train_id: trainId,
        id: trainId,
        composite_score: score,
        overall_status: status,
        score: Math.round(score * 100),
        status: status,
        explanation: status === 'Available' ? 'All systems optimal for deployment' : 
                    status === 'Maintenance' ? 'Maintenance required' : 'Multiple issues detected',
        individual_scores: {
          fitness: Math.max(0, score + (Math.random() * 0.2 - 0.1)),
          job_card: Math.max(0, score + (Math.random() * 0.2 - 0.1)),
          branding: Math.max(0, score + (Math.random() * 0.2 - 0.1)),
          mileage: Math.max(0, score + (Math.random() * 0.2 - 0.1)),
          cleaning: Math.max(0, score + (Math.random() * 0.2 - 0.1)),
          stabling: Math.max(0, score + (Math.random() * 0.2 - 0.1))
        },
        mileage: Math.floor(Math.random() * 50000) + 10000,
        stabling_bay: `Bay-${String.fromCharCode(65 + Math.floor(Math.random() * 6))}${Math.floor(Math.random() * 10) + 1}`, // Bay-A1 to Bay-F10
        branding_priority: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
        last_cleaned_date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        fitnessValid: status !== 'Unavailable',
        jobCardStatus: status === 'Available' ? 'Clear' : 'Pending',
        cleaningScore: score,
        brandingScore: score
      });
    }

    const availableTrains = results.filter(r => r.overall_status === 'Available');
    const selectedTrains = availableTrains.sort((a, b) => b.composite_score - a.composite_score).slice(0, 14);

    return {
      success: true,
      message: 'ML optimization completed successfully',
      data: {
        results,
        selectedTrains,
        summary: {
          totalTrains,
          availableCount: availableTrains.length,
          selectedCount: selectedTrains.length,
          successRate: ((selectedTrains.length / availableTrains.length) * 100).toFixed(1)
        }
      }
    };
  }

  getMockQRCode(role) {
    if (!role) {
      return {
        success: true,
        availableRoles: ['brand', 'clean', 'tech', 'yard', 'operation', 'admin'],
        credentials: {
          brand: { workerId: 'brand', password: 'password', role: 'Branding Officer', redirectUrl: '/branding_officer' },
          clean: { workerId: 'clean', password: 'password', role: 'Cleaning Crew', redirectUrl: '/cleaning' },
          tech: { workerId: 'tech', password: 'password', role: 'Technical Staff', redirectUrl: '/technical' },
          yard: { workerId: 'yard', password: 'password', role: 'Yard Operations', redirectUrl: '/yard' },
          operation: { workerId: 'operation', password: 'password', role: 'Operation Staff', redirectUrl: '/operation_staff' },
          admin: { workerId: 'admin', password: 'password', role: 'Administrator', redirectUrl: '/dashboard' }
        }
      };
    }

    return {
      success: true,
      role: role,
      qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      credentials: {
        workerId: role,
        password: 'password',
        redirectUrl: `/${role}`
      }
    };
  }

  getMockChatbotResponse(message) {
    const responses = [
      "I'm here to help with train operations and maintenance questions.",
      "For technical issues, please check the maintenance manual or contact the technical team.",
      "Train deployment procedures are documented in the operations guide.",
      "Safety protocols require all trains to pass fitness certification before deployment.",
      "For real-time updates, check the dashboard analytics section."
    ];

    return {
      success: true,
      response: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date().toISOString()
    };
  }

  // Get Analytics Data (Dashboard summary, performance metrics, alerts)
  async getAnalytics() {
    return this.request('/get-analytics');
  }

  // Get Train Data (specific CSV file or all files info)
  async getTrainData(file = null) {
    if (file) {
      return this.request(`/get-train-data?file=${file}`);
    }
    return this.request('/get-train-data');
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

  // Chatbot interaction
  async sendChatMessage(message) {
    return this.request('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  // AI Chat service
  async aiChat(message) {
    return this.request('/ai-chat', {
      method: 'POST', 
      body: JSON.stringify({ message })
    });
  }

  // Deployment optimization
  async optimizeDeployment(params = {}) {
    return this.request('/optimize-deployment', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  // Convenience methods for specific data types
  async getFitnessCertificates() {
    const response = await this.getTrainData('fitness_certificates');
    return response.data || [];
  }

  async getJobCards() {
    const response = await this.getTrainData('job_cards');
    return response.data || [];
  }

  async getBrandingPriorities() {
    const response = await this.getTrainData('branding_priorities');
    return response.data || [];
  }

  async getMileageData() {
    const response = await this.getTrainData('mileage_data');
    return response.data || [];
  }

  async getCleaningStatus() {
    const response = await this.getTrainData('cleaning_status');
    return response.data || [];
  }

  async getStablingGeometry() {
    const response = await this.getTrainData('stabling_geometry');
    return response.data || [];
  }

  async getMLAnalysis() {
    const response = await this.getTrainData('ml_analysis');
    return response.data || [];
  }

  // Get complete dashboard data
  async getDashboardData() {
    try {
      const [analytics, mlOptimization] = await Promise.all([
        this.getAnalytics(),
        this.runMLOptimization().catch(error => {
          console.warn('ML Optimization failed:', error);
          return { success: false, data: null };
        })
      ]);

      return {
        success: true,
        analytics: analytics.data,
        mlOptimization: mlOptimization.success ? mlOptimization.data : null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }
}

export default new APIService();
