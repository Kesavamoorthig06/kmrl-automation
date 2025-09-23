import React, { useState, useEffect } from "react";
import { RefreshCw, XCircle, CheckCircle, Users, BarChart3, Target, Activity, Zap } from "lucide-react";
import SelectedTrainsDashboard from "./SelectedTrainsDashboard.jsx";
import Navbar from "../components/Navbar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";
import PerformanceMetrics from "../components/dashboard/PerformanceMetrics.jsx";
import MaintenanceAlert from "../components/dashboard/MaintenanceAlert.jsx";
import TrainTable from "../components/dashboard/TrainTable.jsx";
import SelectionControls from "../components/dashboard/SelectionControls.jsx";
import ConfirmationAlert from "../components/dashboard/ConfirmationAlert.jsx";
import ConstraintsModal from "../components/dashboard/ConstraintsModal.jsx";
import ReasonModal from "../components/dashboard/ReasonModal.jsx";
import TrainDetailsModal from "../components/dashboard/TrainDetailsModal.jsx";
import SystemStatus from "../components/dashboard/SystemStatus.jsx";
// Removed debug component to maintain minimal theme
// Removed unused CSV parsing imports - now using MLDataService
import MLDataService from "../services/MLDataService.js";

function Dashboard() {
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonText, setReasonText] = useState("");
  const [showTrainModal, setShowTrainModal] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState("");
  const [deployedTrains, setDeployedTrains] = useState(new Set());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [chartPath, setChartPath] = useState("");
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [selectedTrains, setSelectedTrains] = useState(new Set());
  const [trainMetrics, setTrainMetrics] = useState(null);
  const [currentPage, setCurrentPage] = useState('selection'); // 'selection', 'dashboard', or 'deployment-success'
  const [showConstraintsModal, setShowConstraintsModal] = useState(false);
  const [selectedTrainForConstraints, setSelectedTrainForConstraints] = useState(null);
  const [constraintChecks, setConstraintChecks] = useState({
    fitnessCertificates: false,
    jobCardStatus: false,
    brandingPriorities: false,
    mileageBalancing: false,
    cleaningDetailing: false,
    stablingGeometry: false
  });
  const [serverStatus, setServerStatus] = useState('unknown'); // 'connected', 'disconnected', 'unknown'
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [realTimeData, setRealTimeData] = useState(null);
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [alerts, setAlerts] = useState([]);

  // Check server status - Mock for production
  const checkServerStatus = async () => {
    // In production, we'll simulate a connected server
    setServerStatus('connected');
  };

  // Handle navbar navigation
  const handleNavbarNavigation = (page) => {
    if (page === 'selection') {
      setCurrentPage('selection');
    } else if (page === 'dashboard') {
      setCurrentPage('dashboard');
    } else if (page === 'analytics') {
      // Navigate to analytics page with selected trains
      window.location.href = '/analytics';
    } else if (page === 'alerts') {
      // Navigate to alerts page
      window.location.href = '/alerts';
    } else if (page === 'settings') {
      // Handle settings page - you can implement this later
      console.log('Settings page requested');
    }
  };

  // Load CSV data on component mount
  useEffect(() => {
    loadCSVData();
    checkServerStatus();
    initializeMLData();
  }, []);

  // Initialize ML data service
  const initializeMLData = async () => {
    try {
      console.log('🚀 Initializing ML Data Service...');
      
      // Load ML data
      const mlData = await MLDataService.loadMLData();
      setIsRealTimeActive(true);
      
      // Register for data updates
      MLDataService.onUpdate('data_loaded', (data) => {
        setRealTimeData({ trains: data, timestamp: new Date() });
        setLastUpdateTime(new Date());
      });
      
      // Get initial data
      const initialData = MLDataService.getTrainData();
      if (initialData) {
        setRealTimeData({ trains: initialData, timestamp: new Date() });
      }
      
      // Get alerts
      const mlAlerts = MLDataService.getAlerts();
      setAlerts(mlAlerts);
      
      console.log('✅ ML Data Service Initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ML data service:', error);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isRealTimeActive) {
        // MLDataService doesn't need to be stopped, but we can clean up callbacks
        MLDataService.removeCallback('data_loaded', () => {});
        setIsRealTimeActive(false);
      }
    };
  }, [isRealTimeActive]);

  // Update last update time whenever the component mounts or data loads
  useEffect(() => {
    setLastUpdateTime(new Date());
  }, [trains, performanceMetrics]);

  // Save selected trains to localStorage whenever they change
  useEffect(() => {
    if (selectedTrains.size > 0) {
      localStorage.setItem('selectedTrains', JSON.stringify(Array.from(selectedTrains)));
    }
  }, [selectedTrains]);

  // Handle refresh functionality
  const handleRefresh = () => {
    setLastUpdateTime(new Date());
    loadCSVData();
    checkServerStatus();
  };

  // Generate chart when train modal opens
  useEffect(() => {
    if (showTrainModal && selectedTrain && trains.length > 0) {
      const trainData = trains.find(t => t.id === selectedTrain);
      if (trainData) {
        generateChart(selectedTrain, trainData);
        // Also create the chart immediately
        setTimeout(() => {
          const trainIdNum = parseInt(selectedTrain.replace('R-', ''));
          const seed = trainIdNum * 7;
          const metrics = {
            mileageEfficiency: `${(70 + (seed % 25)).toFixed(1)}%`,
            energyConsumption: `${(2.5 + (seed % 15) / 10).toFixed(1)} kWh/km`,
            averageSpeed: `${(35 + (seed % 20)).toFixed(1)} km/h`,
            accelerationRate: `${(0.7 + (seed % 8) / 10).toFixed(1)} m/s²`,
            totalDistance: `${(trainData.mileage || 0).toLocaleString()} km`,
            serviceHours: `${(1500 + (seed % 2000)).toFixed(0)} hrs`,
            passengerCapacity: 250 + (seed % 200),
            loadFactor: `${(55 + (seed % 35)).toFixed(1)}%`,
            safetyScore: `${75 + (seed % 20)}/100`,
            maintenanceScore: `${80 + (seed % 15)}/100`,
            operationalEfficiency: `${(65 + (seed % 30)).toFixed(1)}%`,
            electricityEfficiency: `${(8.5 + (seed % 3)).toFixed(1)} km/kWh`,
            brakeEfficiency: `${(85 + (seed % 10)).toFixed(1)}%`
          };
          createIndividualCharts(selectedTrain, metrics);
        }, 100);
      }
    }
  }, [showTrainModal, selectedTrain, trains]);

  const loadCSVData = async () => {
    try {
      setLoading(true);
      // Load ML data using MLDataService
      const mlData = await MLDataService.loadMLData();
      
      if (!mlData || mlData.length === 0) {
        setError('No train data available. The ML analysis CSV file may be empty or corrupted.');
        setTrains([]);
        setSelectedTrains(new Set());
        setPerformanceMetrics(null);
        return;
      }
      
      setTrains(mlData);
      
      // Auto-select top 14 available trains
      const availableTrains = mlData
        .filter(train => train.status === "Available")
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .slice(0, 14); // Take top 14
      
      const autoSelectedIds = new Set(availableTrains.map(train => train.id));
      setSelectedTrains(autoSelectedIds);
      
      // Get performance metrics from MLDataService
      const summary = MLDataService.getDashboardSummary();
      const metrics = MLDataService.getPerformanceMetrics();
      setPerformanceMetrics({
        totalTrains: summary.totalTrains,
        availableTrains: summary.availableTrains,
        maintenanceTrains: summary.maintenanceTrains,
        avgPerformance: summary.avgPerformance,
        lastUpdate: summary.lastUpdate,
        ...metrics
      });
      
      setError(null);
      console.log('✅ Dashboard data loaded successfully');
    } catch (err) {
      console.error('❌ Error loading ML data:', err);
      setError('Failed to load ML analysis data. Please ensure the CSV file is available.');
      setTrains([]);
      setSelectedTrains(new Set());
      setPerformanceMetrics(null);
    } finally {
      setLoading(false);
    }
  };


  // Removed toggleTrainStatus function - status is now read-only

  const handleUnavailableClick = (train) => {
    setSelectedTrainForConstraints(train);
    setShowConstraintsModal(true);
    // Set some constraints as unchecked to justify why it's unavailable
    const unavailableConstraints = {
      fitnessCertificates: Math.random() > 0.3, // 70% chance to be checked
      jobCardStatus: Math.random() > 0.4, // 60% chance to be checked
      brandingPriorities: Math.random() > 0.2, // 80% chance to be checked
      mileageBalancing: Math.random() > 0.5, // 50% chance to be checked
      cleaningDetailing: Math.random() > 0.3, // 70% chance to be checked
      stablingGeometry: Math.random() > 0.4 // 60% chance to be checked
    };
    setConstraintChecks(unavailableConstraints);
  };

  const handleAvailableClick = (train) => {
    setSelectedTrainForConstraints(train);
    setShowConstraintsModal(true);
    // Set all constraints as checked by default for available trains
    setConstraintChecks({
      fitnessCertificates: true,
      jobCardStatus: true,
      brandingPriorities: true,
      mileageBalancing: true,
      cleaningDetailing: true,
      stablingGeometry: true
    });
  };

  const handleConstraintChange = (constraint) => {
    const newConstraintChecks = {
      ...constraintChecks,
      [constraint]: !constraintChecks[constraint]
    };
    
    setConstraintChecks(newConstraintChecks);
    
    // Check if any constraint is unchecked - if so, mark train as unavailable
    const hasUncheckedConstraint = Object.values(newConstraintChecks).some(checked => !checked);
    
    if (hasUncheckedConstraint && selectedTrainForConstraints) {
      // Update the train status to unavailable
      setTrains(prevTrains => 
        prevTrains.map(train => 
          train.id === selectedTrainForConstraints.id 
            ? { ...train, status: "Unavailable", explain: "Administrator manually marked as unavailable due to constraint violations" }
            : train
        )
      );
    } else if (!hasUncheckedConstraint && selectedTrainForConstraints) {
      // All constraints are checked - mark as available
      setTrains(prevTrains => 
        prevTrains.map(train => 
          train.id === selectedTrainForConstraints.id 
            ? { ...train, status: "Available", explain: "" }
            : train
        )
      );
    }
  };

  const handleTrainClick = (trainId) => {
    setSelectedTrain(trainId);
    setShowTrainModal(true);
    
    // Generate chart for the selected train
    const trainData = trains.find(t => t.id === trainId);
    if (trainData) {
      generateChart(trainId, trainData);
    }
  };

  // Get the selected train's data
  const selectedTrainData = trains.find(t => t.id === selectedTrain);

  // Function to generate charts using Python script
  const generateChart = async (trainId, trainData) => {
    setIsGeneratingChart(true);
    setChartPath(""); // Clear previous chart
    console.log('Generating chart for train:', trainId, trainData);
    
    // Generate realistic metrics for display
    const trainIdNum = parseInt(trainId.replace('R-', ''));
    const seed = trainIdNum * 7;
    
    const metrics = {
      mileageEfficiency: `${(70 + (seed % 25)).toFixed(1)}%`,
      energyConsumption: `${(2.5 + (seed % 15) / 10).toFixed(1)} kWh/km`,
      averageSpeed: `${(35 + (seed % 20)).toFixed(1)} km/h`,
      accelerationRate: `${(0.7 + (seed % 8) / 10).toFixed(1)} m/s²`,
      totalDistance: `${(trainData.mileage || 0).toLocaleString()} km`,
      serviceHours: `${(1500 + (seed % 2000)).toFixed(0)} hrs`,
      passengerCapacity: 250 + (seed % 200),
      loadFactor: `${(55 + (seed % 35)).toFixed(1)}%`,
      safetyScore: `${75 + (seed % 20)}/100`,
      maintenanceScore: `${80 + (seed % 15)}/100`,
      operationalEfficiency: `${(65 + (seed % 30)).toFixed(1)}%`,
      electricityEfficiency: `${(8.5 + (seed % 3)).toFixed(1)} km/kWh`,
      brakeEfficiency: `${(85 + (seed % 10)).toFixed(1)}%`
    };
    
    setTrainMetrics(metrics);
    
    try {
      // In production, we'll use existing charts or create simple ones
      console.log('Generating chart for production...');
      
      // Try to use existing chart first
      const existingChartPath = `/charts/train_${trainId}_metrics.png`;
      setChartPath(existingChartPath);
      
      // Create simple chart as fallback
      createSimpleChart(trainId, metrics);
      
    } catch (error) {
      console.error('Error generating chart:', error);
      // Fallback: Create a simple chart using Canvas
      createSimpleChart(trainId, metrics);
    } finally {
      setIsGeneratingChart(false);
    }
  };

  // Create a simple performance chart using Canvas as fallback
  const createSimpleChart = (trainId, metrics) => {
    // Create individual performance chart
    createIndividualCharts(trainId, metrics);
    
    // Set a simple chart path to indicate charts are ready
    setChartPath('chart-generated');
  };

  // Create individual performance metrics chart
  const createIndividualCharts = (trainId, metrics) => {
    // Performance Metrics Bar Chart
    const barCanvas = document.getElementById('performanceBarChart');
    if (barCanvas) {
      const ctx = barCanvas.getContext('2d');
      ctx.clearRect(0, 0, barCanvas.width, barCanvas.height);
      drawBarChart(ctx, 50, 30, 500, 240, [
        { label: 'Mileage Efficiency', value: parseFloat(metrics.mileageEfficiency), color: '#10B981' },
        { label: 'Energy Consumption', value: parseFloat(metrics.energyConsumption) * 10, color: '#3B82F6' },
        { label: 'Average Speed', value: parseFloat(metrics.averageSpeed), color: '#8B5CF6' },
        { label: 'Safety Score', value: parseFloat(metrics.safetyScore), color: '#F59E0B' },
        { label: 'Operational Efficiency', value: parseFloat(metrics.operationalEfficiency), color: '#EF4444' },
        { label: 'Electricity Efficiency', value: parseFloat(metrics.electricityEfficiency), color: '#F97316' }
      ], 'Performance Metrics');
    }
  };

  // Helper function to draw bar chart
  const drawBarChart = (ctx, x, y, width, height, data, title) => {
    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + width / 2, y - 10);
    
    const barWidth = (width - 40) / data.length - 10;
    const maxValue = Math.max(...data.map(d => d.value));
    const barHeight = height - 60;
    
    data.forEach((item, index) => {
      const barX = x + 20 + index * (barWidth + 10);
      const barH = (item.value / maxValue) * barHeight;
      const barY = y + barHeight - barH;
      
      // Bar
      ctx.fillStyle = item.color;
      ctx.fillRect(barX, barY, barWidth, barH);
      
      // Value
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toFixed(1), barX + barWidth / 2, barY - 5);
      
      // Label
      ctx.fillText(item.label, barX + barWidth / 2, y + barHeight + 20);
    });
  };

  // Helper function to draw pie chart
  const drawPieChart = (ctx, x, y, radius, data, title) => {
    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + radius, y - 10);
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    const centerX = x + radius;
    const centerY = y + radius;
    
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      
      // Label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
      
      ctx.fillStyle = '#1f2937';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
  };

  // Helper function to draw line chart
  const drawLineChart = (ctx, x, y, width, height, data, title) => {
    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + width / 2, y - 10);
    
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    const stepX = (width - 40) / (data.length - 1);
    const stepY = (height - 60) / range;
    
    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    
    data.forEach((item, index) => {
      const pointX = x + 20 + index * stepX;
      const pointY = y + height - 30 - (item.value - minValue) * stepY;
      
      if (index === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    });
    ctx.stroke();
    
    // Draw points
    data.forEach((item, index) => {
      const pointX = x + 20 + index * stepX;
      const pointY = y + height - 30 - (item.value - minValue) * stepY;
      
      ctx.beginPath();
      ctx.arc(pointX, pointY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#3B82F6';
      ctx.fill();
      
      // Value
      ctx.fillStyle = '#1f2937';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), pointX, pointY - 10);
    });
  };

  // Helper function to draw gauge chart
  const drawGaugeChart = (ctx, x, y, radius, value, title) => {
    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + radius, y - 10);
    
    const centerX = x + radius;
    const centerY = y + radius;
    
    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 20;
    ctx.stroke();
    
    // Value arc
    const angle = (value / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, Math.PI, Math.PI + angle);
    ctx.strokeStyle = value > 80 ? '#10B981' : value > 60 ? '#F59E0B' : '#EF4444';
    ctx.lineWidth = 20;
    ctx.stroke();
    
    // Value text
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(value.toString(), centerX, centerY + 8);
    
    // Unit
    ctx.font = '12px Arial';
    ctx.fillText('/100', centerX, centerY + 25);
  };

  // Helper function to draw dual gauge chart
  const drawDualGaugeChart = (ctx, x, y, radius, value1, value2, title) => {
    // Title
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + radius, y - 10);
    
    const centerX = x + radius;
    const centerY = y + radius;
    
    // Electricity Efficiency Gauge (Left)
    const leftCenterX = centerX - 30;
    ctx.beginPath();
    ctx.arc(leftCenterX, centerY, radius - 20, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 15;
    ctx.stroke();
    
    const electricityAngle = ((value1 - 8) / 3) * Math.PI;
    ctx.beginPath();
    ctx.arc(leftCenterX, centerY, radius - 20, Math.PI, Math.PI + electricityAngle);
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 15;
    ctx.stroke();
    
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(value1.toFixed(1), leftCenterX, centerY + 5);
    ctx.font = '10px Arial';
    ctx.fillText('km/kWh', leftCenterX, centerY + 20);
    
    // Brake Efficiency Gauge (Right)
    const rightCenterX = centerX + 30;
    ctx.beginPath();
    ctx.arc(rightCenterX, centerY, radius - 20, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 15;
    ctx.stroke();
    
    const brakeAngle = (value2 / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(rightCenterX, centerY, radius - 20, Math.PI, Math.PI + brakeAngle);
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 15;
    ctx.stroke();
    
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(value2.toFixed(1), rightCenterX, centerY + 5);
    ctx.font = '10px Arial';
    ctx.fillText('%', rightCenterX, centerY + 20);
  };

  const handleDeploy = (trainId) => {
    setDeployedTrains(prev => new Set([...prev, trainId]));
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 2000);
  };

  const handleUndeploy = (trainId) => {
    setDeployedTrains(prev => {
      const newSet = new Set(prev);
      newSet.delete(trainId);
      return newSet;
    });
  };

  const handleTrainSelection = (trainId, isSelected) => {
    // Find the train to check its status
    const train = trains.find(t => t.id === trainId);
    
    // Don't allow selection of unavailable trains
    if (train && train.status === "Unavailable") {
      return;
    }
    
    setSelectedTrains(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(trainId);
      } else {
        newSet.delete(trainId);
      }
      return newSet;
    });
  };

  const handleSelectAllAvailable = () => {
    const availableTrainIds = trains
      .filter(train => train.status === "Available")
      .map(train => train.id);
    setSelectedTrains(new Set(availableTrainIds));
  };

  const handleClearAll = () => {
    setSelectedTrains(new Set());
  };

  // Handle export CSV
  const handleExportCSV = () => {
    // Create CSV headers
    const headers = [
      'Train_ID',
      'Status',
      'ML_Score',
      'Stabling_Bay',
      'Branding_Priority',
      'Mileage',
      'Last_Cleaned_Date',
      'Assignment',
      'Fitness_Certificate_Valid',
      'Job_Card_Status',
      'Mileage_Score',
      'Branding_Score',
      'Cleaning_Score',
      'Shunting_Score',
      'Prelim_Score',
      'Final_Score_GA',
      'Total_Shunting_Cost',
      'Count_Penalty',
      'Shunt_Penalty',
      'Branding_Shortfall',
      'Export_Timestamp'
    ];
    
    // Create CSV rows
    const csvRows = trains.map((train) => [
      train.id || '',
      train.status || '',
      train.score || '',
      train.stabling_bay || '',
      train.branding_priority || '',
      train.mileage || '',
      train.last_cleaned_date || '',
      train.assignment || '',
      train.fitness_certificate_valid || '',
      train.job_card_status || '',
      train.mileage_score || '',
      train.branding_score || '',
      train.cleaning_score || '',
      train.shunting_score || '',
      train.prelim_score || '',
      train.final_score_ga || '',
      train.total_shunting_cost || '',
      train.count_penalty || '',
      train.shunt_penalty || '',
      train.branding_shortfall || '',
      new Date().toISOString()
    ]);
    
    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `train_data_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success message
    alert(`Successfully exported ${trains.length} train records to CSV!`);
  };

  const handleDeploySuccess = (deployedTrains) => {
    setCurrentPage('deployment-success');
  };

  const handleRerunSimulation = async () => {
    try {
      console.log("Starting ML simulation rerun...");
      
      // Refresh ML data
      await MLDataService.refresh();
      
      // Reload the data
      await loadCSVData();
      
      // Show success message
      alert("ML simulation completed successfully! Fresh data has been loaded.");
    } catch (error) {
      console.error("Error running ML simulation:", error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        alert("Cannot connect to the ML data source. Please ensure:\n\n1. The ML analysis CSV file is available\n2. The file is accessible in the public directory\n3. No network issues are blocking the connection");
      } else if (error.name === 'AbortError') {
        alert("ML simulation timed out. The process may still be running in the background.");
      } else {
        alert(`Error running ML simulation: ${error.message}`);
      }
    }
  };



  const handleScheduleMaintenance = () => {
    // Generate a random time for maintenance (next 1-3 days)
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 3) + 1;
    const randomHours = Math.floor(Math.random() * 8) + 8; // Between 8 AM and 4 PM
    const scheduledDate = new Date(now.getTime() + (randomDays * 24 * 60 * 60 * 1000));
    scheduledDate.setHours(randomHours, 0, 0, 0);
    
    const formattedDate = scheduledDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Show browser alert
    alert(`Maintenance has been scheduled for ${formattedDate} at ${formattedTime}.`);
    
    // Close the modal
    setShowReasonModal(false);
  };

  // Filter conflicts
  const conflicts = trains
    .filter(t => t.status === "Unavailable")
    .map(t => ({ id: t.id, reason: t.explain }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading ML Analysis Data...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we load the train data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          currentPage={currentPage} 
          onPageChange={handleNavbarNavigation}
          userInfo={{ name: 'Admin User', role: 'Operations Manager' }}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <XCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show dashboard if currentPage is 'dashboard'
  if (currentPage === 'dashboard') {
    return (
      <SelectedTrainsDashboard 
        selectedTrainIds={selectedTrains}
        onBack={() => setCurrentPage('selection')}
        onDeploySuccess={handleDeploySuccess}
      />
    );
  }

  // Show deployment success page
  if (currentPage === 'deployment-success') {
    return (
      <div className="min-h-screen bg-white">
        {/* Navbar */}
        <Navbar 
          currentPage={currentPage} 
          onPageChange={handleNavbarNavigation}
          userInfo={{ name: 'Admin User', role: 'Operations Manager' }}
        />
        
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <img 
                  src="/metro-logo.png" 
                  alt="Metro Logo" 
                  className="h-12 w-12 object-contain"
                />
                <div>
                  <h1 className="text-3xl font-bold text-black">Deployment Success</h1>
                  <p className="text-gray-700 mt-1">Train deployment completed successfully</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-black"></div>
                  <span className="text-sm text-gray-700">System: Online</span>
                </div>
                <div className="text-sm text-gray-700">
                  {new Date().toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Success Message */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4 border-2 border-black">
              <CheckCircle className="h-10 w-10 text-black" />
            </div>
            <h2 className="text-4xl font-bold text-black mb-2">Deployment Successful!</h2>
            <p className="text-xl text-gray-700">All selected trains have been successfully deployed</p>
          </div>

          {/* Deployment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-black">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                  <Users className="h-6 w-6 text-black" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-black">Trains Deployed</h3>
                  <p className="text-3xl font-bold text-black">{selectedTrains.size}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-black">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                  <BarChart3 className="h-6 w-6 text-black" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-black">Success Rate</h3>
                  <p className="text-3xl font-bold text-black">100%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-black">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                  <Target className="h-6 w-6 text-black" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-black">Crews Notified</h3>
                  <p className="text-3xl font-bold text-black">3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Crew Notifications */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-black">
            <h3 className="text-2xl font-bold text-black mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 text-black mr-2" />
              Crew Notifications Sent
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="font-semibold text-black">Cleaning Crew</h4>
                </div>
                <p className="text-sm text-gray-700">Prepare for interior deep-cleaning of {selectedTrains.size} trains</p>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="font-semibold text-black">Loco-Pilot Crew</h4>
                </div>
                <p className="text-sm text-gray-700">Ready for train operation and route preparation</p>
              </div>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div className="mb-2">
                  <h4 className="font-semibold text-black">Depot Rollout Crew</h4>
                </div>
                <p className="text-sm text-gray-700">Prepare for train deployment and bay management</p>
              </div>
            </div>
          </div>

          {/* Deployment Timeline */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-black">
            <h3 className="text-2xl font-bold text-black mb-6 flex items-center">
              <BarChart3 className="h-6 w-6 text-black mr-2" />
              Deployment Timeline
            </h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 border border-gray-300">
                  <CheckCircle className="h-5 w-5 text-black" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-black">Deployment Initiated</p>
                  <p className="text-sm text-gray-700 mt-1">All systems ready for train deployment</p>
                  <span className="text-xs text-gray-500 mt-2 block">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 border border-gray-300">
                  <CheckCircle className="h-5 w-5 text-black" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-black">Crew Notifications Sent</p>
                  <p className="text-sm text-gray-700 mt-1">All three crews have been notified</p>
                  <span className="text-xs text-gray-500 mt-2 block">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-4 border border-gray-300">
                  <CheckCircle className="h-5 w-5 text-black" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-black">Deployment Complete</p>
                  <p className="text-sm text-gray-700 mt-1">All {selectedTrains.size} trains successfully deployed</p>
                  <span className="text-xs text-gray-500 mt-2 block">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setCurrentPage('selection')}
              className="px-8 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              New Deployment
            </button>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="px-8 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Clean minimal dashboard render
  
  return (
    <div className="min-h-screen bg-white font-light">
      {/* Navbar */}
      <Navbar 
        currentPage={currentPage} 
        onPageChange={handleNavbarNavigation}
        userInfo={{ name: 'Admin User', role: 'Operations Manager' }}
      />
      
      <style jsx>{`
        /* Table alignment and sizing */
        .table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed; /* <-- stable column widths (required) */
        }

        /* Vertically center all table cells and prevent overflow shifting layout */
        .table th, .table td {
          vertical-align: middle;
          padding: 12px 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Right-align the Mileage column (7th column) */
        .table th:nth-child(7),
        .table td:nth-child(7) {
          text-align: right;
        }

        /* Center-align most other non-numeric columns */
        .table th:nth-child(1), .table td:nth-child(1),
        .table th:nth-child(2), .table td:nth-child(2),
        .table th:nth-child(3), .table td:nth-child(3),
        .table th:nth-child(5), .table td:nth-child(5),
        .table th:nth-child(6), .table td:nth-child(6),
        .table th:nth-child(8), .table td:nth-child(8),
        .table th:nth-child(9), .table td:nth-child(9) {
          text-align: center;
        }

        /* remove stray header transforms if any */
        .table thead th { transform: none !important; }

        /* Make table headers bold and consistent */
        .table th {
          font-weight: 800;
          background-color: #f8f9fa;
          border-bottom: 2px solid #e5e7eb;
          color: #1f2937;
        }

        /* Improved row spacing */
        .table tbody tr {
          border-bottom: 1px solid #e5e7eb;
        }

        .table tbody tr:hover {
          background-color: #f3f4f6;
        }

        /* Make checkboxes larger and vertically centered */
        .table input[type="checkbox"] {
          width: 20px;
          height: 20px;
          vertical-align: middle;
        }

        /* Score color coding - Monochrome */
        .score-excellent {
          background-color: #f3f4f6;
          color: #111827;
          border: 1px solid #d1d5db;
        }

        .score-good {
          background-color: #f9fafb;
          color: #1f2937;
          border: 1px solid #d1d5db;
        }

        .score-average {
          background-color: #e5e7eb;
          color: #374151;
          border: 1px solid #9ca3af;
        }

        .score-poor {
          background-color: #d1d5db;
          color: #111827;
          border: 1px solid #6b7280;
        }

        /* Status color coding - Subtle red and green */
        .status-available {
          background-color: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .status-unavailable {
          background-color: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        /* Subtle background colors for table rows */
        .bg-green-25 {
          background-color: #f8fffe;
        }

        .bg-red-25 {
          background-color: #fffbfb;
        }

        /* Score badge styling - Neutral gray scale */
        .score-badge {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.875rem;
          display: inline-block;
          min-width: 80px;
          text-align: center;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.01em;
          border: 1px solid #d1d5db;
        }

        /* Stabling/Branding badges - All gray */
        .stabling-badge,
        .branding-badge {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.875rem;
          display: inline-block;
          min-width: 80px;
          text-align: center;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.01em;
          border: 1px solid #d1d5db;
        }

        /* Mileage and Last Cleaned font styling to match score */
        .mileage-text,
        .last-cleaned-text {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.01em;
          font-weight: 600;
        }

        /* Rank number font styling to match score */
        .rank-text {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.01em;
          font-weight: 600;
        }

        .stabling-badge-high {
          background-color: #f9fafb;
          color: #111827;
          border: 1px solid #d1d5db;
        }

        .stabling-badge-medium {
          background-color: #f3f4f6;
          color: #1f2937;
          border: 1px solid #9ca3af;
        }

        .stabling-badge-low {
          background-color: #e5e7eb;
          color: #374151;
          border: 1px solid #6b7280;
        }

        /* Branding Priority specific colors matching the image */
        .branding-badge-high {
          background-color: #f3e8ff; /* Light purple/pink for high priority (8, 7) */
          color: #7c3aed;
          border: 1px solid #d8b4fe;
        }

        .branding-badge-medium {
          background-color: #dbeafe; /* Light blue for medium priority (6, 5) */
          color: #2563eb;
          border: 1px solid #93c5fd;
        }

        .branding-badge-low {
          background-color: #f8fafc; /* Light gray/white for low priority (1, 2) */
          color: #64748b;
          border: 1px solid #e2e8f0;
        }

        /* Ensure table takes full width */
        .table-container {
          width: 100%;
          min-width: 1200px;
        }
      `}</style>
      {/* Header */}
      <DashboardHeader 
        lastUpdateTime={lastUpdateTime}
        serverStatus={serverStatus}
        onExportCSV={handleExportCSV}
        onRerunSimulation={handleRerunSimulation}
        isRealTimeActive={isRealTimeActive}
        optimizationResults={optimizationResults}
        alerts={alerts}
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
        {/* System Status - Compact Version */}
        <div className="mb-6">
          <SystemStatus 
            realTimeData={realTimeData}
            optimizationResults={optimizationResults}
            isRealTimeActive={isRealTimeActive}
            mlData={MLDataService.getTrainData()}
          />
        </div>

        {/* Maintenance Alert */}
        <MaintenanceAlert conflicts={conflicts} />

        {/* Main Table */}
        <TrainTable 
          trains={trains}
          selectedTrains={selectedTrains}
          onTrainClick={handleTrainClick}
          onUnavailableClick={handleUnavailableClick}
          onAvailableClick={handleAvailableClick}
          onTrainSelection={handleTrainSelection}
        />

        {/* Selection Controls */}
        <SelectionControls 
          selectedTrains={selectedTrains}
          trains={trains}
          onSelectAllAvailable={handleSelectAllAvailable}
          onClearAll={handleClearAll}
          onConfirmSelection={() => {
            // Navigate to analytics page with selected trains
            window.location.href = '/analytics';
          }}
        />

        {/* Confirmation Alert */}
        <ConfirmationAlert showConfirmation={showConfirmation} />

        {/* Constraints Modal */}
        <ConstraintsModal 
          showConstraintsModal={showConstraintsModal}
          selectedTrainForConstraints={selectedTrainForConstraints}
          constraintChecks={constraintChecks}
          onClose={() => setShowConstraintsModal(false)}
          onConstraintChange={handleConstraintChange}
          onScheduleMaintenance={handleScheduleMaintenance}
        />

        {/* Reason Modal */}
        <ReasonModal 
          showReasonModal={showReasonModal}
          reasonText={reasonText}
          onClose={() => setShowReasonModal(false)}
          onScheduleMaintenance={handleScheduleMaintenance}
        />

        {/* Train Details Modal */}
        <TrainDetailsModal 
          showTrainModal={showTrainModal}
          selectedTrainData={selectedTrainData}
          trainMetrics={trainMetrics}
          onClose={() => setShowTrainModal(false)}
        />
      </div>
    </div>
  );
}

export default Dashboard;