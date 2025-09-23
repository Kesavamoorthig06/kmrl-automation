import React from 'react';
import { useParams } from 'react-router-dom';
import OperationStaff from '../components/workers/OperationStaff';
import Technical from '../components/workers/Technical';
import YardOperations from '../components/workers/YardOperations';
import BrandingOfficer from '../components/workers/BrandingOfficer';
import CleaningCrew from '../components/workers/CleaningCrew';

function WorkerPage() {
  const { workerType } = useParams();

  // Map worker types to their React components
  const workerComponentMap = {
    'operation-staff': OperationStaff,
    'technical': Technical,
    'yard': YardOperations,
    'ops-interface': OperationStaff, // Using OperationStaff for ops-interface
    'branding-officer': BrandingOfficer,
    'cleaning': CleaningCrew
  };

  const WorkerComponent = workerComponentMap[workerType];

  if (!WorkerComponent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Worker Type</h2>
          <p className="text-gray-600 mb-4">The worker type "{workerType}" is not recognized.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800 underline">
            ← Back to Login
          </a>
        </div>
      </div>
    );
  }

  return <WorkerComponent />;
}

export default WorkerPage;
