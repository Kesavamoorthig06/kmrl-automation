import React, { useState, useEffect, useRef } from 'react';

// Backend API URL - Mock for production
const API_BASE_URL = '/api';

function LoginComponent() {
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '', show: false });
  const [formData, setFormData] = useState({
    workerId: '',
    qrCode: '',
    password: ''
  });

  // QR Code redirection mapping
  const redirectionMap = {
    '23it279': 'operation staff.html',
    'TECH001': 'technical.html',
    'YARD001': 'yard.html',
    'OPS001': 'kochi_metro_ops_interface.html',
    'BRAND001': 'branding_officer.html',
    'CLEAN001': 'cleaning.html'
  };

  // Helper functions
  const showStatusMessage = (message, type) => {
    setStatusMessage({ text: message, type, show: true });
  };

  const hideStatusMessage = () => {
    setStatusMessage({ text: '', type: '', show: false });
  };


  // Menu functions
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };


  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.workerId || !formData.password) {
      showStatusMessage('Please fill in all required fields.', 'error');
      return;
    }

    try {
      // Mock login for production - check admin credentials
      if (formData.workerId === 'admin' && formData.password === 'admin') {
        showStatusMessage('Login successful! Redirecting...', 'success');
        // Handle successful login
        setTimeout(() => {
          // Check if admin login - redirect to React App dashboard
          if (formData.workerId === 'admin') {
            window.location.href = '/';
          } else {
            // Redirect based on QR code for other users
            const destinationPage = redirectionMap[formData.qrCode];
            if (destinationPage) {
              window.location.href = destinationPage;
            } else {
              window.location.href = '/';
            }
          }
        }, 1500);
      } else {
        showStatusMessage('Invalid credentials. Please use admin/admin', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showStatusMessage('Login error. Please try again.', 'error');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img 
                src="/metro-logo.png" 
                alt="Kochi Metro" 
                className="h-10 w-10 mr-3"
              />
              <h1 className="text-2xl font-bold text-gray-900">Kochi Metro Rail Limited</h1>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="#" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Home</a>
            <a href="#" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">About</a>
            <a href="#" className="block px-3 py-2 text-gray-700 hover:bg-gray-100">Contact</a>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto">
          {/* Login Card */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Worker Login</h2>
              <p className="text-gray-600">Access your metro operations dashboard</p>
            </div>

            {/* Status Message */}
            {statusMessage.show && (
              <div className={`mb-6 p-4 rounded-lg ${
                statusMessage.type === 'success' ? 'bg-green-100 text-green-800' :
                statusMessage.type === 'error' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {statusMessage.text}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="workerId" className="block text-sm font-medium text-gray-700 mb-2">
                  Worker ID
                </label>
                <input
                  type="text"
                  id="workerId"
                  name="workerId"
                  value={formData.workerId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter admin"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter admin"
                  required
                />
              </div>

              <div>
                <label htmlFor="qrCode" className="block text-sm font-medium text-gray-700 mb-2">
                  QR Code (Optional)
                </label>
                <button
                  type="button"
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md border border-gray-300 cursor-not-allowed"
                  disabled
                >
                  QR Code
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
              >
                Login
              </button>
            </form>

          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              © 2024 Kochi Metro Rail Limited. All rights reserved.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginComponent;
