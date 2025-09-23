import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import AuthService from '../services/AuthService';

function LoginPage() {
  const [formData, setFormData] = useState({
    workerId: '',
    qrCode: '',
    password: ''
  });
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '', show: false });
  const [showQRScanner, setShowQRScanner] = useState(false);
  const navigate = useNavigate();

  // QR Code redirection mapping for different worker types
  const redirectionMap = {
    '23it279': '/workers/operation-staff',
    'TECH001': '/workers/technical',
    'YARD001': '/workers/yard',
    'OPS001': '/workers/ops-interface',
    'BRAND001': '/workers/branding-officer',
    'CLEAN001': '/workers/cleaning',
    'ADMIN001': '/dashboard'
  };

  // Worker ID mapping for direct access
  const workerIdMap = {
    'admin': '/dashboard',
    'clean': '/workers/cleaning',
    'brand': '/workers/branding-officer',
    'tech': '/workers/technical',
    'operation': '/workers/operation-staff'
  };

  const showStatusMessage = (message, type) => {
    setStatusMessage({ text: message, type, show: true });
    setTimeout(() => {
      setStatusMessage({ text: '', type: '', show: false });
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQRScan = async (result) => {
    console.log('QR Code scanned:', result);
    const scannedData = result.data;
    
    setShowQRScanner(false);
    showStatusMessage('Verifying QR code...', 'info');
    
    try {
      // Verify QR code with API
      const verification = await AuthService.verifyQRCode(scannedData);
      
      if (verification.success) {
        // Set the QR code in form data
        setFormData(prev => ({ ...prev, qrCode: scannedData }));
        showStatusMessage(`QR Code verified! Please enter your credentials to continue.`, 'success');
      } else {
        showStatusMessage(`Invalid QR Code: "${scannedData}". ${verification.error}`, 'error');
      }
    } catch (error) {
      showStatusMessage(`QR Code verification failed: ${error.message}`, 'error');
    }
  };

  const handleQRScanError = (error) => {
    console.error('QR Scan error:', error);
    showStatusMessage('Failed to scan QR code. Please try again.', 'error');
  };

  const handleQRScannerClose = () => {
    setShowQRScanner(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { workerId, qrCode, password } = formData;

    // Validation
    if (!workerId.trim()) {
      showStatusMessage('Please enter your Employee ID.', 'error');
      return;
    }

    if (!password.trim()) {
      showStatusMessage('Please enter your password.', 'error');
      return;
    }

    // Show loading message
    showStatusMessage('Authenticating...', 'info');

    try {
      // Attempt login with API
      const loginResult = await AuthService.login(workerId, password, qrCode);
      
      if (loginResult.success) {
        showStatusMessage('Login successful! Redirecting...', 'success');
        
        // Determine destination based on user role or QR code
        let destination = '/dashboard'; // Default to dashboard
        
        if (loginResult.qrCode) {
          // Use QR code redirection if available
          const qrDestination = redirectionMap[loginResult.qrCode.code];
          if (qrDestination) {
            destination = qrDestination;
          }
        } else if (workerIdMap[workerId.toLowerCase()]) {
          // Use worker ID mapping
          destination = workerIdMap[workerId.toLowerCase()];
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(destination);
        }, 1500);
      } else {
        showStatusMessage(`Login failed: ${loginResult.error}`, 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showStatusMessage(`Login error: ${error.message}`, 'error');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(/bg_kmrl.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-70"></div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 p-8 hover:shadow-3xl transition-shadow duration-300">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/metro-logo.png" 
                alt="KMRL Logo" 
                className="h-16 w-16"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">KMRL Metro</h1>
            <p className="text-gray-600 text-sm">Employee Access Portal</p>
          </div>

          {/* Status Message */}
          {statusMessage.show && (
            <div className={`mb-6 p-4 rounded-xl text-center font-medium border ${
              statusMessage.type === 'success' ? 'bg-gray-50 text-gray-800 border-gray-300' :
              statusMessage.type === 'error' ? 'bg-gray-50 text-gray-800 border-gray-300' :
              'bg-gray-50 text-gray-800 border-gray-300'
            }`}>
              {statusMessage.text}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="workerId" className="block text-sm font-semibold text-gray-700 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                id="workerId"
                name="workerId"
                value={formData.workerId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 hover:border-gray-400 hover:shadow-md transition-all duration-200 bg-white"
                placeholder="Enter your employee ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                QR Code Access
              </label>
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-sm shadow-sm bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-2 transform hover:-translate-y-0.5"
                    style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}
                  >
                    <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span>Scan QR Code</span>
                  </button>
              
              {formData.qrCode && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-sm text-emerald-800 font-medium">
                    ✓ QR Code: {formData.qrCode}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 hover:border-gray-400 hover:shadow-md transition-all duration-200 bg-white"
                placeholder="Enter your password"
                required
              />
            </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-white text-black border border-black rounded-sm hover:bg-black hover:text-white transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-black/10 transform hover:-translate-y-0.5"
                  style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}
                >
                  <span className="font-medium tracking-wider uppercase">
                    Sign In
                  </span>
                </button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            © 2025 Kochi Metro Rail Limited. All rights reserved.
          </p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onError={handleQRScanError}
          onClose={handleQRScannerClose}
          validQRCodes={Object.keys(redirectionMap)}
        />
      )}
    </div>
  );
}

export default LoginPage;
