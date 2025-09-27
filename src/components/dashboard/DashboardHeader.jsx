import React from 'react';
import { RefreshCw, Activity, Zap, AlertTriangle } from "lucide-react";

const DashboardHeader = ({ 
  lastUpdateTime, 
  serverStatus, 
  onExportCSV, 
  onRerunSimulation,
  isRealTimeActive,
  optimizationResults,
  alerts
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-6">
            <img 
              src="/metro-logo.png" 
              alt="Kochi Metro Logo" 
              className="h-16 w-16 object-contain mt-2"
            />
            <div>
              <h1 className="text-5xl font-extralight text-black tracking-tight leading-tight" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
                Kochi Metro Rail Limited
              </h1>
              <p className="text-lg font-light text-gray-600 mt-4 tracking-wide" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
                ML-Powered Train Induction Planning System
              </p>
              <p className="text-sm font-light text-gray-500 mt-2 tracking-wider uppercase" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}>
                Advanced Operations Management Platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Status Indicators - Top Corner */}
            <div className="flex items-center space-x-3">
              {/* IoT Sensors Status */}
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  isRealTimeActive ? 'bg-gray-600' : 'bg-gray-400'
                }`}></div>
                <span className="text-xs text-gray-500">IoT</span>
              </div>
              
              {/* System Status */}
              <div className="flex items-center space-x-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  serverStatus === 'connected' ? 'bg-gray-600' : 
                  serverStatus === 'disconnected' ? 'bg-gray-400' : 'bg-gray-500'
                }`}></div>
                <span className="text-xs text-gray-500">System</span>
              </div>
              
              {/* Alerts Indicator */}
              {alerts.length > 0 && (
                <div className="flex items-center space-x-1">
                  <AlertTriangle className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{alerts.length}</span>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end space-x-4 mb-2">
                <button
                  onClick={onExportCSV}
                  className="flex items-center px-4 py-2 bg-white text-black border border-black rounded-sm hover:bg-black hover:text-white transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10"
                  style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.1em'}}
                >
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium tracking-wider uppercase">
                    Export CSV
                  </span>
                </button>
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-light text-gray-500 tracking-wide" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
                    Last Updated
                  </p>
                  <button
                    onClick={onRerunSimulation}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Re-run ML simulation and refresh data"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium text-black mt-1" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
                {lastUpdateTime.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
              <p className="text-xs font-light text-gray-400 mt-1" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
                Click refresh icon to re-run simulation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
