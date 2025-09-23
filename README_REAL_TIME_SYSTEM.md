# KMRL Real-Time Train Management System

## 🚀 Overview

The KMRL Real-Time Train Management System is a comprehensive IoT-powered platform that automatically collects data from sensors, runs ML optimization algorithms, and provides real-time insights for train induction planning. This system transforms the manual, error-prone process of train deployment into an automated, data-driven decision support platform.

## 🏗️ System Architecture

### Core Components

1. **IoT Sensor Simulator** (`src/services/IoTSimulator.js`)
   - Simulates real-time data collection from 25 trains
   - Monitors 6 critical variables for each train
   - Updates data every 30 seconds with realistic changes
   - Tracks sensor health and connectivity

2. **ML Optimization Engine** (`src/services/MLOptimizationEngine.js`)
   - Multi-objective optimization for train deployment
   - Constraint analysis and compliance checking
   - Genetic algorithm-based ranking system
   - Conflict detection and resolution

3. **Real-Time Data Service** (`src/services/RealTimeDataService.js`)
   - Integrates IoT sensors and ML optimization
   - Manages real-time data flow and updates
   - Provides callback system for UI updates
   - Handles data history and caching

4. **Dashboard Integration**
   - Real-time status indicators
   - Live alerts and notifications
   - System health monitoring
   - ML optimization results display

## 📊 Data Collection & Processing

### IoT Sensors Monitored

1. **Fitness Certificates**
   - Rolling-Stock certificates
   - Signalling certificates
   - Telecom certificates
   - Validity status tracking

2. **Job Card Status**
   - IBM Maximo integration
   - Open work orders count
   - Critical issues detection
   - Maintenance scheduling

3. **Branding Priorities**
   - Contractual commitments
   - Exposure hours tracking
   - Priority level monitoring
   - Revenue optimization

4. **Mileage Balancing**
   - Total mileage tracking
   - Bogie wear monitoring
   - Brake pad wear analysis
   - HVAC system wear

5. **Cleaning & Detailing**
   - Interior condition assessment
   - Exterior condition monitoring
   - Manpower availability
   - Cleaning schedule optimization

6. **Stabling Geometry**
   - Bay position tracking
   - Shunting distance calculation
   - Accessibility scoring
   - Optimal positioning

### Real-Time Metrics

- **Operational Data**: Punctuality, energy consumption, passenger load
- **Performance Indicators**: Service readiness, reliability scores
- **Cost Optimization**: Maintenance costs, shunting efficiency
- **Branding Exposure**: Contract fulfillment, revenue tracking

## 🧠 ML Optimization Features

### Multi-Objective Optimization

The system optimizes for four key objectives:

1. **Service Readiness** (40% weight)
   - Punctuality scores
   - Energy efficiency
   - Passenger load optimization

2. **Reliability** (30% weight)
   - Fitness certificate compliance
   - Job card status validation
   - Maintenance history analysis

3. **Cost Efficiency** (20% weight)
   - Mileage optimization
   - Maintenance cost reduction
   - Shunting cost minimization

4. **Branding Exposure** (10% weight)
   - Contract fulfillment
   - Priority-based deployment
   - Revenue maximization

### Constraint Engine

The system enforces six critical constraints:

- **Fitness Certificates**: Must be valid for deployment
- **Job Card Status**: No critical issues allowed
- **Branding Priorities**: Contract requirements met
- **Mileage Balancing**: Wear distribution optimization
- **Cleaning & Detailing**: Condition standards met
- **Stabling Geometry**: Optimal positioning achieved

## 🎯 Key Features

### Real-Time Monitoring
- Live IoT sensor data collection
- Continuous constraint monitoring
- Automatic alert generation
- System health tracking

### ML-Powered Optimization
- Genetic algorithm-based ranking
- Multi-objective optimization
- Conflict detection and resolution
- Explainable AI recommendations

### Intelligent Alerts
- Critical constraint violations
- Performance degradation warnings
- Maintenance scheduling alerts
- Resource conflict notifications

### Dashboard Integration
- Real-time status indicators
- Live data visualization
- ML optimization results
- System performance metrics

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kmrl
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open `http://localhost:3004/`
   - The system will automatically initialize IoT sensors
   - ML optimization will run every 5 minutes

### System Initialization

The system automatically:
1. Initializes 25 train sensors
2. Starts real-time data collection
3. Runs initial ML optimization
4. Begins continuous monitoring

## 📈 Performance Metrics

### Real-Time Updates
- **Data Collection**: Every 30 seconds
- **ML Optimization**: Every 5 minutes
- **Alert Processing**: Continuous
- **UI Updates**: Real-time

### System Capacity
- **Trains Monitored**: 25 trains
- **Sensors per Train**: 6 sensor types
- **Data Points**: 150+ metrics per train
- **Update Frequency**: 30-second intervals

### Optimization Performance
- **Processing Time**: < 2 seconds
- **Constraint Checks**: 6 per train
- **Objective Functions**: 4 weighted objectives
- **Conflict Detection**: Real-time

## 🔧 Configuration

### IoT Simulator Settings
```javascript
// Update intervals (milliseconds)
dataUpdateInterval: 30000,    // 30 seconds
optimizationInterval: 300000, // 5 minutes

// Train configuration
totalTrains: 25,
sensorTypes: 6,
maxHistorySize: 50
```

### ML Optimization Weights
```javascript
objectives: {
  serviceReadiness: 0.4,
  reliability: 0.3,
  cost: 0.2,
  brandingExposure: 0.1
}
```

## 🚨 Alert System

### Alert Types
- **Critical**: Constraint violations, system failures
- **Warning**: Performance degradation, maintenance needed
- **Info**: Status updates, optimization complete

### Alert Triggers
- Fitness certificate expiration
- Critical job card issues
- Low punctuality scores
- Resource conflicts
- Maintenance overdue

## 📊 Dashboard Components

### Real-Time Status
- IoT sensor connectivity
- ML optimization status
- System health indicators
- Live data timestamps

### System Overview
- Train status distribution
- Performance metrics
- Constraint violations
- Optimization results

### Alerts Panel
- Real-time notifications
- Alert categorization
- Timestamp tracking
- Action recommendations

## 🔮 Future Enhancements

### Planned Features
- **Predictive Analytics**: Maintenance forecasting
- **Advanced ML Models**: Deep learning integration
- **Mobile App**: Real-time mobile monitoring
- **API Integration**: Third-party system connectivity

### Scalability
- **Fleet Expansion**: Support for 40+ trains
- **Multi-Depot**: Multiple depot management
- **Cloud Deployment**: Scalable infrastructure
- **Real IoT Integration**: Physical sensor connectivity

## 🛠️ Technical Stack

### Frontend
- **React 18**: Modern UI framework
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library

### Backend Services
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **SQLite3**: Database
- **Nodemailer**: Email notifications

### ML & Analytics
- **Custom ML Engine**: Multi-objective optimization
- **Genetic Algorithms**: Train ranking
- **Constraint Programming**: Rule enforcement
- **Real-time Analytics**: Live data processing

## 📝 API Documentation

### Real-Time Data Service
```javascript
// Start the service
await RealTimeDataService.start();

// Get current data
const data = RealTimeDataService.getCurrentData();

// Register for updates
RealTimeDataService.onUpdate('data_update', callback);

// Force optimization
await RealTimeDataService.forceOptimization();
```

### ML Optimization Engine
```javascript
// Run optimization
const result = await MLOptimizationEngine.optimizeTrainInduction(trainData);

// Get optimization history
const history = MLOptimizationEngine.getOptimizationHistory();

// Check processing status
const status = MLOptimizationEngine.getProcessingStatus();
```

## 🎯 Business Impact

### Operational Efficiency
- **99.5% Punctuality**: Maintained through predictive optimization
- **Reduced Downtime**: Proactive maintenance scheduling
- **Cost Optimization**: Minimized shunting and maintenance costs
- **Resource Utilization**: Optimal train deployment

### Decision Support
- **Data-Driven**: Eliminates manual guesswork
- **Real-Time**: Immediate constraint validation
- **Explainable**: Clear reasoning for decisions
- **Auditable**: Complete decision trail

### Scalability
- **Fleet Growth**: Ready for 40+ train expansion
- **Multi-Depot**: Scalable architecture
- **Integration Ready**: API-first design
- **Cloud Native**: Modern deployment options

## 📞 Support

For technical support or questions about the real-time system:
- Check the console logs for detailed system status
- Monitor the dashboard for real-time alerts
- Review the optimization results for decision insights
- Use the system status panel for health monitoring

---

**Built with ❤️ for Kochi Metro Rail Limited**

*Transforming train operations through intelligent automation and real-time optimization.*
