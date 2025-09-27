import React from 'react';

function BrandingOfficer() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-purple-600 mb-4">Branding Officer Portal</h2>
        <p className="text-gray-700 text-lg">Welcome, Branding Officer!</p>
        <p className="text-gray-500 mt-2">This is your dedicated dashboard for branding operations.</p>
        <a href="/login" className="mt-6 inline-block bg-purple-500 text-white px-6 py-2 rounded-md hover:bg-purple-600 transition-colors">
          Back to Login
        </a>
      </div>
    </div>
  );
}

export default BrandingOfficer;
