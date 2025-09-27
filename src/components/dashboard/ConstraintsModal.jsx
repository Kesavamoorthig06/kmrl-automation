import React from 'react';
import { X, CheckCircle, XCircle } from "lucide-react";

const ConstraintsModal = ({ 
  showConstraintsModal, 
  selectedTrainForConstraints, 
  constraintChecks, 
  onClose, 
  onConstraintChange, 
  onScheduleMaintenance 
}) => {
  if (!showConstraintsModal || !selectedTrainForConstraints) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${selectedTrainForConstraints.status === "Available" ? "from-green-600 to-green-800" : "from-red-600 to-red-800"} text-white p-6 rounded-t-xl`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">Train Availability Constraints</h3>
              <p className={`${selectedTrainForConstraints.status === "Available" ? "text-green-100" : "text-red-100"} mt-1`}>
                {selectedTrainForConstraints.status === "Available" 
                  ? `Review constraints for ${selectedTrainForConstraints.id}` 
                  : `Constraint violations for ${selectedTrainForConstraints.id}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`text-white transition-colors p-2 rounded-lg ${selectedTrainForConstraints.status === "Available" ? "hover:text-green-200 hover:bg-green-700" : "hover:text-red-200 hover:bg-red-700"}`}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Train Image - Only show for Unavailable trains */}
          {selectedTrainForConstraints.status === "Unavailable" && (
            <div className="mb-6 flex justify-center">
              <div className="relative bg-white rounded-xl p-4 shadow-lg border-2 border-red-200">
                <div className="flex justify-center">
                  <img 
                    src="/train_maintenance_overlay.jpg" 
                    alt="Train Maintenance Status" 
                    className="max-w-full h-auto rounded-lg shadow-md"
                    style={{ maxHeight: '350px', objectFit: 'contain' }}
                  />
                </div>
                {/* Maintenance badge */}
                <div className="absolute -top-2 -right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  Maintenance Required
                </div>
                {/* Removed bogie annotation overlay as requested */}
              </div>
            </div>
          )}
          
          {/* Train Info */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{selectedTrainForConstraints.id}</h4>
                <p className="text-gray-600">Status: <span className="text-green-600 font-medium">Available</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">ML Score</p>
                <p className="text-xl font-bold text-green-600">{selectedTrainForConstraints.score}</p>
              </div>
            </div>
          </div>

          {/* Constraints List */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Availability Constraints</h4>
            
            {/* Constraint 1: Fitness Certificates */}
            <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">Fitness Certificates</h5>
                <p className="text-sm text-gray-600 mt-1">Validity windows issued by Rolling-Stock, Signalling and Telecom departments</p>
              </div>
              <div className="ml-4">
                <input
                  type="checkbox"
                  checked={constraintChecks.fitnessCertificates}
                  onChange={() => onConstraintChange('fitnessCertificates')}
                  className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Constraint 2: Job Card Status */}
            <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">Job Card Status</h5>
                <p className="text-sm text-gray-600 mt-1">Open vs. closed work orders exported from IBM Maximo</p>
              </div>
              <div className="ml-4">
                <input
                  type="checkbox"
                  checked={constraintChecks.jobCardStatus}
                  onChange={() => onConstraintChange('jobCardStatus')}
                  className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Constraint 3: Branding Priorities */}
            <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">Branding Priorities</h5>
                <p className="text-sm text-gray-600 mt-1">Contractual commitments that dictate exterior wrap exposure hours</p>
              </div>
              <div className="ml-4">
                <input
                  type="checkbox"
                  checked={constraintChecks.brandingPriorities}
                  onChange={() => onConstraintChange('brandingPriorities')}
                  className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Constraint 4: Mileage Balancing */}
            <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">Mileage Balancing</h5>
                <p className="text-sm text-gray-600 mt-1">Kilometre allocation to equalise bogie, brake-pad and HVAC wear</p>
              </div>
              <div className="ml-4">
                <input
                  type="checkbox"
                  checked={constraintChecks.mileageBalancing}
                  onChange={() => onConstraintChange('mileageBalancing')}
                  className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Constraint 5: Cleaning & Detailing Slots */}
            <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">Cleaning & Detailing Slots</h5>
                <p className="text-sm text-gray-600 mt-1">Available manpower and bay occupancy for interior deep-cleaning</p>
              </div>
              <div className="ml-4">
                <input
                  type="checkbox"
                  checked={constraintChecks.cleaningDetailing}
                  onChange={() => onConstraintChange('cleaningDetailing')}
                  className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Constraint 6: Stabling Geometry */}
            <div className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">Stabling Geometry</h5>
                <p className="text-sm text-gray-600 mt-1">Physical bay positions that minimise nightly shunting and morning turn-out time</p>
              </div>
              <div className="ml-4">
                <input
                  type="checkbox"
                  checked={constraintChecks.stablingGeometry}
                  onChange={() => onConstraintChange('stablingGeometry')}
                  className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className={`mt-6 p-4 border rounded-lg ${selectedTrainForConstraints.status === "Available" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-center">
              {selectedTrainForConstraints.status === "Available" ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mr-2" />
              )}
              <div>
                <h5 className={`font-semibold ${selectedTrainForConstraints.status === "Available" ? "text-green-800" : "text-red-800"}`}>
                  Constraint Summary
                </h5>
                <p className={`text-sm ${selectedTrainForConstraints.status === "Available" ? "text-green-700" : "text-red-700"}`}>
                  {selectedTrainForConstraints.status === "Available" 
                    ? `${Object.values(constraintChecks).filter(Boolean).length} of 6 constraints satisfied`
                    : `${Object.values(constraintChecks).filter(Boolean).length} of 6 constraints satisfied - ${6 - Object.values(constraintChecks).filter(Boolean).length} violations detected`}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
            {selectedTrainForConstraints.status === "Unavailable" && (
              <button
                onClick={() => {
                  onScheduleMaintenance();
                  onClose();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Schedule Maintenance
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Confirm Constraints
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstraintsModal;
