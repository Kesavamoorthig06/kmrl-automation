import React from 'react';

function OperationStaff() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-3xl font-bold text-blue-600 mb-4">Operation Staff Portal</h2>
        <p className="text-gray-700 text-lg">Welcome, Operation Staff!</p>
        <p className="text-gray-500 mt-2">This is your dedicated dashboard for managing metro operations.</p>
        <a href="/login" className="mt-6 inline-block bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors">
          Back to Login
        </a>
      </div>
    </div>
  );
}

export default OperationStaff;
