import React, { useState } from 'react';

function YardOperations() {
  const [formData, setFormData] = useState({
    trainId: '',
    yardArea: '',
    operation: 'parking',
    status: 'completed',
    issues: '',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    
    setTimeout(() => {
      setSubmitted(false);
      alert('Yard operations report submitted successfully!');
      setFormData({
        trainId: '',
        yardArea: '',
        operation: 'parking',
        status: 'completed',
        issues: '',
        notes: ''
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              🚂
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Yard Operations Portal</h1>
            <p className="text-gray-600 text-lg">Kochi Metro Rail Limited</p>
          </div>

          {/* Status Card */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8 border-l-4 border-yellow-600">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Yard Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Trains in Yard:</span>
                <span className="font-bold text-gray-800">15</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Available Slots:</span>
                <span className="font-bold text-gray-800">8</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Maintenance:</span>
                <span className="font-bold text-gray-800">3</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 font-medium">Yard Status:</span>
                <span className="font-bold text-green-600">Operational</span>
              </div>
            </div>
          </div>

          {/* Yard Operations Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Yard Operations Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Train ID</label>
                <input
                  type="text"
                  name="trainId"
                  value={formData.trainId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Enter Train ID"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yard Area</label>
                <select
                  name="yardArea"
                  value={formData.yardArea}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select Yard Area</option>
                  <option value="north">North Yard</option>
                  <option value="south">South Yard</option>
                  <option value="maintenance">Maintenance Yard</option>
                  <option value="storage">Storage Yard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
                <select
                  name="operation"
                  value={formData.operation}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="parking">Parking</option>
                  <option value="departure">Departure</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="delayed">Delayed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issues/Problems</label>
              <textarea
                name="issues"
                value={formData.issues}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows="3"
                placeholder="Describe any issues or problems encountered"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows="2"
                placeholder="Any additional information or observations"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitted}
                className="flex-1 bg-yellow-600 text-white py-3 px-6 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors"
              >
                {submitted ? 'Submitting...' : 'Submit Report'}
              </button>
              
              <button
                type="button"
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Request Support
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm mb-2">© 2025 Kochi Metro Rail Limited. All rights reserved.</p>
            <a href="/login" className="text-yellow-600 hover:text-yellow-800 text-sm">← Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YardOperations;
