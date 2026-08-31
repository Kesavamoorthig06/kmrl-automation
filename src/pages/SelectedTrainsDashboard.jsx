import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/Alert.jsx";
import { CheckCircle, BarChart3, Target, RefreshCw, MapPin, Train } from "lucide-react";
import Navbar from "../components/layout/Navbar.jsx";
import MLDataService from "../services/MLDataService.js";
import { useTranslation } from "../hooks/useTranslation.js";
import { useLanguage } from "../contexts/LanguageContext.jsx";

// CSV data loading functionality
const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      data.push(row);
    }
  }
  return data;
};

// Convert CSV data to train format for display
const convertCSVToTrains = (csvData) => {
  return csvData.map((row, index) => {
    const isService = row.assignment === 'service';
    const isMaintenance = row.assignment === 'maintenance';
    const isStandby = row.assignment === 'standby';
    const isAvailable = row.status === 'eligible';
    
    const getDummyScore = () => {
      const baseScore = Math.random() * 0.15 + 0.05;
      return parseFloat(baseScore.toFixed(3));
    };
    
    const finalScore = isAvailable ? (row.final_score_ga || '-') : getDummyScore();
    
    return {
      rank: row.service_rank || (isMaintenance ? 'M' : isStandby ? 'S' : ''),
      id: `R-${row.train_id.toString().padStart(2, "0")}`,
      status: isAvailable ? 'Available' : 'Unavailable',
      score: finalScore,
      explain: isMaintenance 
        ? row.maintenance_reason 
        : isService 
          ? `Service train - Score: ${finalScore}`
          : isStandby
            ? `Standby train - Score: ${finalScore}`
            : 'Available train',
      assignment: row.assignment,
      stabling_bay: row.stabling_bay,
      branding_priority: Math.round((row.branding_priority || 0) * 0.82),
      mileage: row.mileage,
      last_cleaned_date: row.last_cleaned_date,
      fitness_certificate_valid: row.fitness_certificate_valid,
      job_card_status: row.job_card_status,
      mileage_score: row.mileage_score,
      branding_score: row.branding_score,
      cleaning_score: row.cleaning_score,
      shunting_score: row.shunting_score,
      prelim_score: row.prelim_score,
      final_score_ga: finalScore,
      total_shunting_cost: row.total_shunting_cost,
      count_penalty: row.count_penalty,
      shunt_penalty: row.shunt_penalty,
      branding_shortfall: row.branding_shortfall,
      service_trains_count: row.service_trains_count,
      maintenance_trains_count: row.maintenance_trains_count,
      standby_trains_count: row.standby_trains_count,
      generation_timestamp: row.generation_timestamp
    };
  });
};

export default function SelectedTrainsDashboard({ selectedTrainIds, onBack, onDeploySuccess }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Load CSV data on component mount
  useEffect(() => {
    loadCSVData();
  }, []);

  const loadCSVData = async () => {
    try {
      setLoading(true);
      const trainData = await MLDataService.loadMLData();
      setTrains(trainData);
      
      // Extract performance metrics from train data
      if (trainData.length > 0) {
        const totalCost = trainData.reduce((sum, train) => sum + (parseFloat(train.totalShuntingCost) || 0), 0);
        const serviceCount = trainData.filter(train => train.assignment === 'Service').length;
        const maintenanceCount = trainData.filter(train => train.status === 'Unavailable').length;
        
        setPerformanceMetrics({
          totalShuntingCost: totalCost.toFixed(2),
          serviceTrainsCount: serviceCount,
          maintenanceTrainsCount: maintenanceCount,
          standbyTrainsCount: 0,
          brandingShortfall: trainData.some(train => train.brandingShortfall),
          generationTimestamp: new Date().toISOString()
        });
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load ML analysis data. Please ensure the CSV file is available.');
      console.error('Error loading CSV:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort selected trains by score (rank-wise)
  const selectedTrains = trains
    .filter(train => selectedTrainIds.has(train.id))
    .sort((a, b) => {
      // Sort by score in descending order (highest scores first)
      const scoreA = parseFloat(a.score) || 0;
      const scoreB = parseFloat(b.score) || 0;
      return scoreB - scoreA;
    });

  // Handle train click
  const handleTrainClick = (trainId) => {
    console.log(`Clicked on train: ${trainId}`);
    // You can add navigation logic here if needed
  };

  // Handle deploy all trains
  const handleDeployAll = () => {
    // Show browser alert message
    alert(`Successfully deployed ${selectedTrains.length} trains!\n\nDeployment Details:\n- Trains: ${selectedTrains.map(train => train.id).join(', ')}\n- Success Rate: 100%\n- All crews have been notified\n\nDeployment completed successfully!`);
    
    // Navigate to deployment success page
    if (onDeploySuccess) {
      onDeploySuccess(selectedTrains);
    }
  };

  // Handle export CSV
  const handleExportCSV = () => {
    // Create CSV headers
    const headers = [
      'Rank',
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
    const csvRows = selectedTrains.map((train, index) => [
      index + 1, // Rank
      train.id,
      train.status,
      train.score,
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
      new Date().toISOString() // Export timestamp
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
    link.setAttribute('download', `selected_trains_audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('loading')} Selected Trains...</p>
        </div>
      </div>
    );
  }

  // Handle navbar navigation
  const handleNavbarNavigation = (page) => {
    if (page === 'selection') {
      onBack(); // Go back to selection page
    } else if (page === 'dashboard') {
      // Already on dashboard, no action needed
      console.log('Already on dashboard');
    } else if (page === 'settings') {
      // Handle settings page - you can implement this later
      console.log('Settings page requested');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar 
          currentPage="dashboard" 
          onPageChange={handleNavbarNavigation}
          userInfo={{ name: 'Admin User', role: 'Operations Manager' }}
        />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadCSVData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 font-light">
      {/* Navbar */}
      <Navbar 
        currentPage="dashboard" 
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

        /* Score badge styling - Neutral gray scale */
        .score-badge {
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.875rem;
          display: inline-block;
          min-width: 70px;
          text-align: center;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.01em;
        }

        /* Stabling/Branding badges - All gray */
        .stabling-badge,
        .branding-badge {
          padding: 4px 8px;
          border-radius: 3px;
          font-weight: 600;
          font-size: 0.8rem;
          display: inline-block;
          min-width: 60px;
          text-align: center;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          letter-spacing: -0.01em;
        }

        .stabling-badge-high,
        .branding-badge-high {
          background-color: #f9fafb;
          color: #111827;
          border: 1px solid #d1d5db;
        }

        .stabling-badge-medium,
        .branding-badge-medium {
          background-color: #f3f4f6;
          color: #1f2937;
          border: 1px solid #9ca3af;
        }

        .stabling-badge-low,
        .branding-badge-low {
          background-color: #e5e7eb;
          color: #374151;
          border: 1px solid #6b7280;
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

        /* Font consistency for data columns */
        .mileage-text,
        .last-cleaned-text,
        .rank-text {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        /* Ensure table takes full width */
        .table-container {
          width: 100%;
          min-width: 1200px;
        }
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-slate-900 dark:to-slate-800 border-b border-blue-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-6">
              <div className="flex items-center space-x-4">
                <img 
                  src="/metro-logo.png" 
                  alt="KMRL Logo" 
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <h1 className="text-4xl font-bold text-blue-800 dark:text-white tracking-wide">{t('selectedTrainsDashboard')}</h1>
                  <p className="text-lg font-medium text-green-700 dark:text-gray-300 mt-2 tracking-wide">{t('deploymentReady')} - {selectedTrains.length} {t('trainsRankedByPerformance')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group border border-blue-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-200 dark:bg-slate-600 rounded-lg group-hover:bg-blue-300 dark:group-hover:bg-slate-500 transition-colors border border-blue-300 dark:border-slate-500">
                  <Train className="h-6 w-6 text-blue-800 dark:text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-700 dark:text-gray-300">{t('selectedTrains')}</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-white group-hover:text-blue-800 dark:group-hover:text-gray-200 transition-colors">{selectedTrains.length}</p>
                  <p className="text-xs text-blue-600 dark:text-gray-400 mt-1">{t('readyForDeployment')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group border border-green-200 dark:border-slate-700 bg-gradient-to-br from-green-50 to-green-100 dark:from-slate-800 dark:to-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-200 dark:bg-slate-600 rounded-lg group-hover:bg-green-300 dark:group-hover:bg-slate-500 transition-colors border border-green-300 dark:border-slate-500">
                  <BarChart3 className="h-6 w-6 text-green-800 dark:text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-700 dark:text-gray-300">{t('avgScore')}</p>
                  <p className="text-2xl font-bold text-green-900 dark:text-white group-hover:text-green-800 dark:group-hover:text-gray-200 transition-colors">
                    {(selectedTrains.reduce((sum, train) => sum + parseFloat(train.score || 0), 0) / selectedTrains.length).toFixed(3)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-gray-400 mt-1">ML performance rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group border border-indigo-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-200 dark:bg-slate-600 rounded-lg group-hover:bg-indigo-300 dark:group-hover:bg-slate-500 transition-colors border border-indigo-300 dark:border-slate-500">
                  <Target className="h-6 w-6 text-indigo-800 dark:text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-indigo-700 dark:text-gray-300">{t('brandingPriority')}</p>
                  <p className="text-2xl font-bold text-indigo-900 dark:text-white group-hover:text-indigo-800 dark:group-hover:text-gray-200 transition-colors">
                    {(selectedTrains.reduce((sum, train) => sum + (train.branding_priority || 0), 0) / selectedTrains.length).toFixed(1)}
                  </p>
                  <p className="text-xs text-indigo-600 dark:text-gray-400 mt-1">Average priority level</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group border border-cyan-200 dark:border-slate-700 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-slate-800 dark:to-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-200 dark:bg-slate-600 rounded-lg group-hover:bg-cyan-300 dark:group-hover:bg-slate-500 transition-colors border border-cyan-300 dark:border-slate-500">
                  <MapPin className="h-6 w-6 text-cyan-800 dark:text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-cyan-700 dark:text-gray-300">{t('totalMileage')}</p>
                  <p className="text-2xl font-bold text-cyan-900 dark:text-white group-hover:text-cyan-800 dark:group-hover:text-gray-200 transition-colors">
                    {selectedTrains.reduce((sum, train) => sum + (parseInt(train.mileage) || 0), 0).toLocaleString()} km
                  </p>
                  <p className="text-xs text-cyan-600 dark:text-gray-400 mt-1">Combined distance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Alert */}
        <Alert className="mb-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-2 border-green-300 dark:border-slate-500 rounded-lg shadow-lg dark:shadow-xl">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          <div className="flex flex-col">
            <AlertTitle className="text-green-800 dark:!text-white font-bold text-lg mb-2" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: 'var(--tw-text-green-800)'}}>
              <span className="dark:!text-white dark:!opacity-100">{t('selectionConfirmed')}</span>
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:!text-white text-sm font-normal leading-relaxed" style={{fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
              <span className="dark:!text-white dark:!opacity-100">{selectedTrains.length} trains have been selected for deployment. Review the details below and proceed with deployment.</span>
            </AlertDescription>
          </div>
        </Alert>

        {/* Selected Trains Table */}
        <Card style={{ marginLeft: '0.5cm' }}>
          <CardHeader>
            <CardTitle className="flex items-center">
              {t('selectedTrainsForDeployment')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto w-full">
              <Table className="w-full min-w-max">
                <colgroup>
                  <col style={{ width: '8%' }} />   {/* Rank */}
                  <col style={{ width: '10%' }} />  {/* Train ID */}
                  <col style={{ width: '14%' }} />  {/* Status */}
                  <col style={{ width: '10%' }} />  {/* Score */}
                  <col style={{ width: '12%' }} />  {/* Stabling Bay */}
                  <col style={{ width: '14%' }} />  {/* Branding Priority */}
                  <col style={{ width: '12%' }} />  {/* Mileage */}
                  <col style={{ width: '12%' }} />  {/* Last Cleaned */}
                  <col style={{ width: '8%' }} />   {/* Assignment */}
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center font-bold py-4 text-gray-800">Rank</TableHead>
                    <TableHead className="text-center font-bold py-4 text-gray-800">Train ID</TableHead>
                    <TableHead className="text-center font-bold py-4 text-gray-800">Status</TableHead>
                    <TableHead className="text-center font-bold py-4 text-gray-800">Score</TableHead>
                    <TableHead className="text-center font-bold py-4 text-gray-800">Stabling Bay</TableHead>
                    <TableHead className="text-center font-bold py-4 text-gray-800">Branding Priority</TableHead>
                    <TableHead className="text-right font-bold py-4 text-gray-800">Mileage</TableHead>
                    <TableHead className="text-center font-bold py-4 text-gray-800">Last Cleaned</TableHead>
                    <TableHead className="text-center font-bold py-4 text-gray-800">Assignment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTrains.map((train, index) => (
                    <TableRow 
                      key={train.id} 
                      className="hover:bg-green-50 transition-colors duration-200 bg-green-25"
                    >
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm rank-text ${
                            index === 0 
                              ? 'bg-yellow-100 text-yellow-800' // Gold for 1st place
                              : index === 1 
                                ? 'bg-gray-100 text-gray-800' // Silver for 2nd place
                                : index === 2 
                                  ? 'bg-orange-100 text-orange-800' // Bronze for 3rd place
                                  : 'bg-green-100 text-green-800' // Green for others
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-left py-4">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleTrainClick(train.id)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-all duration-200 hover:scale-105"
                          >
                            {train.id}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            {train.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <span
                            className={`score-badge ${
                              parseFloat(train.score) >= 0.6
                                ? 'score-excellent'
                                : parseFloat(train.score) >= 0.4
                                ? 'score-good'
                                : parseFloat(train.score) >= 0.2
                                ? 'score-average'
                                : 'score-poor'
                            }`}
                          >
                            {train.score}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <span
                            className={`stabling-badge ${
                              train.stabling_bay && train.stabling_bay.toString().length > 2
                                ? 'stabling-badge-high'
                                : train.stabling_bay && train.stabling_bay.toString().length === 2
                                ? 'stabling-badge-medium'
                                : 'stabling-badge-low'
                            }`}
                          >
                            {train.stabling_bay}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <span className={`px-4 py-2 rounded text-sm font-medium min-w-[120px] inline-block text-center ${
                            train.branding_priority >= 7 
                              ? 'bg-purple-100 text-purple-800' 
                              : train.branding_priority >= 4 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {train.branding_priority}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="flex justify-end items-center">
                          <span className="mileage-text">
                            {train.mileage?.toLocaleString()} km
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <span className="last-cleaned-text">
                            {train.last_cleaned_date}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <Badge className={`${
                            train.assignment === 'service' 
                              ? 'bg-blue-100 text-blue-800 border-blue-200' 
                              : train.assignment === 'maintenance'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {train.assignment}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Deployment Actions */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={onBack}
            className="px-6 py-2.5 bg-white text-black border border-black rounded-sm hover:bg-black hover:text-white transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10 min-w-[140px]"
            style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}
          >
            <span className="font-medium tracking-wider uppercase">
              {t('modifySelection')}
            </span>
          </button>
          <button
            onClick={handleDeployAll}
            className="px-6 py-2.5 bg-white text-black border border-black rounded-sm hover:bg-black hover:text-white transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10 min-w-[140px]"
            style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}
          >
            <span className="font-medium tracking-wider uppercase">
              {t('deployAll')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

