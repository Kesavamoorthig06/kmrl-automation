import React, { useState } from 'react';

function CleaningCrew() {
  const [formData, setFormData] = useState({
    area: '',
    shift: 'morning',
    status: 'completed',
    issues: '',
    supplies: '',
    supervisor: ''
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
      alert('Cleaning report submitted successfully!');
      setFormData({
        area: '',
        shift: 'morning',
        status: 'completed',
        issues: '',
        supplies: '',
        supervisor: ''
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              🧹
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Cleaning Crew Portal</h1>
            <p className="text-gray-600 text-lg">Kochi Metro Rail Limited</p>
          </div>

          {/* Status Card */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8 border-l-4 border-orange-600">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Cleaning Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Areas Cleaned:</span>
                <span className="font-bold text-gray-800">12</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Pending:</span>
                <span className="font-bold text-gray-800">3</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Supplies Used:</span>
                <span className="font-bold text-gray-800">85%</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 font-medium">Quality Score:</span>
                <span className="font-bold text-green-600">Excellent</span>
              </div>
            </div>
          </div>

          {/* Cleaning Report Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Cleaning Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Area/Station</label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter area or station name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift</label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="morning">Morning (6AM-2PM)</option>
                  <option value="afternoon">Afternoon (2PM-10PM)</option>
                  <option value="night">Night (10PM-6AM)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="partial">Partial</option>
                  <option value="delayed">Delayed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
                <input
                  type="text"
                  name="supervisor"
                  value={formData.supervisor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Supervisor Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Issues Found</label>
              <textarea
                name="issues"
                value={formData.issues}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows="3"
                placeholder="Describe any issues or problems found during cleaning"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplies Used</label>
              <textarea
                name="supplies"
                value={formData.supplies}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows="2"
                placeholder="List supplies and materials used"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitted}
                className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
              >
                {submitted ? 'Submitting...' : 'Submit Report'}
              </button>
              
              <button
                type="button"
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Request Supplies
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm mb-2">© 2025 Kochi Metro Rail Limited. All rights reserved.</p>
            <a href="/login" className="text-orange-600 hover:text-orange-800 text-sm">← Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CleaningCrew;
