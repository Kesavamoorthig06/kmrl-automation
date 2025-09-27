import React from 'react';

function YardOperations() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-yellow-600 mb-4">Yard Operations Portal</h2>
        <p className="text-gray-700 text-lg">Welcome, Yard Operations Team!</p>
        <p className="text-gray-500 mt-2">This is your dedicated dashboard for yard operations.</p>
        <a href="/login" className="mt-6 inline-block bg-yellow-500 text-white px-6 py-2 rounded-md hover:bg-yellow-600 transition-colors">
          Back to Login
        </a>
      </div>
    </div>
  );
}

export default YardOperations;
