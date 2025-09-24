import React, { useState } from 'react';

function BrandingOfficer() {
  const [formData, setFormData] = useState({
    campaign: '',
    location: '',
    type: 'poster',
    status: 'active',
    description: '',
    materials: '',
    budget: ''
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
      alert('Branding campaign report submitted successfully!');
      setFormData({
        campaign: '',
        location: '',
        type: 'poster',
        status: 'active',
        description: '',
        materials: '',
        budget: ''
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
            <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              🎨
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Branding Officer Portal</h1>
            <p className="text-gray-600 text-lg">Kochi Metro Rail Limited</p>
          </div>

          {/* Status Card */}
          <div className="bg-gray-50 p-6 rounded-lg mb-8 border-l-4 border-purple-600">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Branding Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Active Campaigns:</span>
                <span className="font-bold text-gray-800">5</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Completed:</span>
                <span className="font-bold text-gray-800">12</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Pending:</span>
                <span className="font-bold text-gray-800">3</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600 font-medium">Brand Health:</span>
                <span className="font-bold text-green-600">Excellent</span>
              </div>
            </div>
          </div>

          {/* Branding Campaign Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Branding Campaign Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  name="campaign"
                  value={formData.campaign}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter campaign name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Station or area"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="poster">Poster</option>
                  <option value="banner">Banner</option>
                  <option value="digital">Digital Display</option>
                  <option value="announcement">Announcement</option>
                  <option value="event">Event</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
                placeholder="Describe the branding campaign details"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Materials Used</label>
              <textarea
                name="materials"
                value={formData.materials}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="2"
                placeholder="List materials and resources used"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget (₹)</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter budget amount"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={submitted}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 transition-colors"
              >
                {submitted ? 'Submitting...' : 'Submit Report'}
              </button>
              
              <button
                type="button"
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Request Materials
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm mb-2">© 2025 Kochi Metro Rail Limited. All rights reserved.</p>
            <a href="/login" className="text-purple-600 hover:text-purple-800 text-sm">← Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandingOfficer;
