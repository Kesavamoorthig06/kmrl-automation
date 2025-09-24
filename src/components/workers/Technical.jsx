import React, { useState } from 'react';

function Technical() {
  const [formData, setFormData] = useState({
    equipmentId: '',
    issueType: 'electrical',
    severity: 'medium',
    description: '',
    solution: '',
    parts: '',
    technician: ''
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
      alert('Technical report submitted successfully!');
      setFormData({
        equipmentId: '',
        issueType: 'electrical',
        severity: 'medium',
        description: '',
        solution: '',
        parts: '',
        technician: ''
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              🔧
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Technical Department Portal</h1>
            <p className="text-gray-600 text-lg">Kochi Metro Rail Limited</p>
          </div>

          {/* Status Card */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8 border-l-4 border-green-600">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Technical Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Active Issues:</span>
                <span className="font-bold text-gray-800">3</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Resolved Today:</span>
                <span className="font-bold text-gray-800">5</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Pending:</span>
                <span className="font-bold text-gray-800">2</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 font-medium">System Health:</span>
                <span className="font-bold text-green-600">Good</span>
              </div>
            </div>
          </div>

          {/* Technical Report Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Technical Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipment ID</label>
                <input
                  type="text"
                  name="equipmentId"
                  value={formData.equipmentId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter Equipment ID"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                <select
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="electrical">Electrical</option>
                  <option value="mechanical">Mechanical</option>
                  <option value="software">Software</option>
                  <option value="communication">Communication</option>
                  <option value="safety">Safety</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Technician</label>
                <input
                  type="text"
                  name="technician"
                  value={formData.technician}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Technician Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issue Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Describe the technical issue in detail"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Solution Applied</label>
              <textarea
                name="solution"
                value={formData.solution}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="3"
                placeholder="Describe the solution or repair work done"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parts Used</label>
              <textarea
                name="parts"
                value={formData.parts}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows="2"
                placeholder="List any parts or components used"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitted}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                {submitted ? 'Submitting...' : 'Submit Report'}
              </button>
              
              <button
                type="button"
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Request Parts
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm mb-2">© 2025 Kochi Metro Rail Limited. All rights reserved.</p>
            <a href="/login" className="text-green-600 hover:text-green-800 text-sm">← Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Technical;
