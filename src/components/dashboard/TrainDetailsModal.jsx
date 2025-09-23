import React from 'react';
import { X, CheckCircle, TrendingUp, BarChart3, Target, DollarSign, Wrench, Users } from "lucide-react";

const TrainDetailsModal = ({ 
  showTrainModal, 
  selectedTrainData, 
  trainMetrics, 
  onClose 
}) => {
  if (!showTrainModal || !selectedTrainData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gray-800 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">Train Performance Metrics</h3>
              <p className="text-gray-300 mt-1">Detailed analysis for {selectedTrainData.id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Basic Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Status</p>
                  <p className="text-gray-900 font-bold text-lg">{selectedTrainData.status}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-gray-600" />
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Stabling Bay</p>
                  <p className="text-gray-900 font-bold text-lg">{selectedTrainData.stabling_bay}</p>
                </div>
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">ML Score</p>
                  <p className="text-gray-900 font-bold text-lg">{selectedTrainData.score}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {/* Mileage Efficiency */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Target className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Mileage Efficiency</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.mileageEfficiency || '85.2%'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${parseFloat(trainMetrics?.mileageEfficiency || '85.2')}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Above average performance</p>
            </div>

            {/* Energy Consumption */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Energy Efficiency</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.energyConsumption || '3.2 kWh/km'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${Math.min(100, (5 - parseFloat(trainMetrics?.energyConsumption || '3.2')) * 25)}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Optimal energy usage</p>
            </div>

            {/* Safety Score */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Safety Score</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.safetyScore || '92/100'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${parseFloat(trainMetrics?.safetyScore || '92')}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Excellent safety rating</p>
            </div>

            {/* Operational Efficiency */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Operational Efficiency</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.operationalEfficiency || '78.5%'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${parseFloat(trainMetrics?.operationalEfficiency || '78.5')}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Good operational performance</p>
            </div>

            {/* Electricity Efficiency */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Electricity Efficiency</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.electricityEfficiency || '9.8 km/kWh'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${Math.min(100, (parseFloat(trainMetrics?.electricityEfficiency || '9.8') - 8) * 25)}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Efficient electricity consumption</p>
            </div>

            {/* Brake Efficiency */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Wrench className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Brake Efficiency</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.brakeEfficiency || '89.3%'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${parseFloat(trainMetrics?.brakeEfficiency || '89.3')}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Excellent brake performance</p>
            </div>

            {/* Average Speed */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Average Speed</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.averageSpeed || '42.5 km/h'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${Math.min(100, (parseFloat(trainMetrics?.averageSpeed || '42.5') / 60) * 100)}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Optimal speed performance</p>
            </div>

            {/* Acceleration Rate */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Acceleration Rate</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.accelerationRate || '1.2 m/s²'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${Math.min(100, (parseFloat(trainMetrics?.accelerationRate || '1.2') / 2) * 100)}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Smooth acceleration</p>
            </div>
            
            {/* Total Distance */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Target className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Total Distance</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.totalDistance || '45,230 km'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${Math.min(100, (parseFloat(trainMetrics?.totalDistance?.replace(/,/g, '') || '45230') / 100000) * 100)}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Cumulative distance covered</p>
            </div>

            {/* Service Hours */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Service Hours</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.serviceHours || '2,450 hrs'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${Math.min(100, (parseFloat(trainMetrics?.serviceHours || '2450') / 5000) * 100)}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Total operational hours</p>
            </div>

            {/* Passenger Capacity */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Passenger Capacity</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.passengerCapacity || '350'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${Math.min(100, (trainMetrics?.passengerCapacity || 350) / 500 * 100)}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Maximum passenger load</p>
            </div>

            {/* Load Factor */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Load Factor</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.loadFactor || '72.5%'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${parseFloat(trainMetrics?.loadFactor || '72.5')}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Current utilization rate</p>
            </div>

            {/* Maintenance Score */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Wrench className="h-6 w-6 text-gray-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Maintenance Score</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {trainMetrics?.maintenanceScore || '88/100'}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-500" 
                  style={{width: `${parseFloat(trainMetrics?.maintenanceScore || '88')}%`}}
                ></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">Maintenance condition</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainDetailsModal;
