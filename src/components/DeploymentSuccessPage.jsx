import React from 'react';
import { CheckCircle, Users, BarChart3, Target } from 'lucide-react';
import Navbar from './Navbar.jsx';

const DeploymentSuccessPage = ({ selectedTrains, onNewDeployment, onViewDashboard }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar 
        currentPage="deployment-success" 
        onPageChange={(page) => {
          if (page === 'selection') {
            onNewDeployment();
          } else if (page === 'dashboard') {
            onViewDashboard();
          }
        }}
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
                <p className="text-3xl font-bold text-black">{selectedTrains.length}</p>
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
              <p className="text-sm text-gray-700">Prepare for interior deep-cleaning of {selectedTrains.length} trains</p>
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
                <p className="text-sm text-gray-700 mt-1">All {selectedTrains.length} trains successfully deployed</p>
                <span className="text-xs text-gray-500 mt-2 block">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={onNewDeployment}
            className="px-8 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            New Deployment
          </button>
          <button
            onClick={onViewDashboard}
            className="px-8 py-3 bg-white text-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors font-medium shadow-lg hover:shadow-xl"
          >
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeploymentSuccessPage;
