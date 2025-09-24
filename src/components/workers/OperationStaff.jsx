import React, { useState, useEffect } from 'react';

function OperationStaff() {
  const [formData, setFormData] = useState({
    trainId: '',
    status: 'operational',
    incident: '',
    maintenance: '',
    notes: ''
  });
  const [status, setStatus] = useState({
    activeTrains: 8,
    maintenance: 2,
    outOfService: 1,
    systemStatus: 'Operational'
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitted(false);
      alert('Data submitted successfully!');
      setFormData({
        trainId: '',
        status: 'operational',
        incident: '',
        maintenance: '',
        notes: ''
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              🚇
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Operation Staff Portal</h1>
            <p className="text-gray-600 text-lg">Kochi Metro Rail Limited</p>
          </div>

          {/* Status Card */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8 border-l-4 border-blue-600">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Active Trains:</span>
                <span className="font-bold text-gray-800">{status.activeTrains}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Maintenance:</span>
                <span className="font-bold text-gray-800">{status.maintenance}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Out of Service:</span>
                <span className="font-bold text-gray-800">{status.outOfService}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 font-medium">System Status:</span>
                <span className="font-bold text-green-600">{status.systemStatus}</span>
              </div>
            </div>
          </div>

          {/* Data Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Entry</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Train ID</label>
                <input
                  type="text"
                  name="trainId"
                  value={formData.trainId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter Train ID"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="operational">Operational</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="out_of_service">Out of Service</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Incident Report</label>
              <textarea
                name="incident"
                value={formData.incident}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Describe any incidents or issues"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Notes</label>
              <textarea
                name="maintenance"
                value={formData.maintenance}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Maintenance activities or requirements"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Any additional information"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitted}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {submitted ? 'Submitting...' : 'Submit Data'}
              </button>
              
              <button
                type="button"
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Report Incident
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm mb-2">© 2025 Kochi Metro Rail Limited. All rights reserved.</p>
            <a href="/login" className="text-blue-600 hover:text-blue-800 text-sm">← Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OperationStaff;
