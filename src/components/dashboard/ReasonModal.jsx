import React from 'react';
import { X, AlertTriangle } from "lucide-react";

const ReasonModal = ({ 
  showReasonModal, 
  reasonText, 
  onClose, 
  onScheduleMaintenance 
}) => {
  if (!showReasonModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Train Maintenance Analysis</h3>
              <p className="text-gray-600 mt-1 text-sm">Diagnostic Report - Unavailable Train</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Issue Description */}
          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-gray-500 mr-3" />
                <div>
                  <h4 className="text-gray-800 font-medium text-sm">Issue Identified</h4>
                  <p className="text-gray-600 mt-1 text-sm">{reasonText}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Train Image - Centered at Top */}
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-md border border-gray-200 w-full max-w-4xl">
              <h4 className="text-xl font-semibold text-gray-900 mb-4 text-center border-b border-gray-200 pb-3">
                Train Diagnostic Diagram
              </h4>
              <p className="text-sm text-gray-600 text-center mb-6">
                Detailed component analysis showing maintenance requirements and system status
              </p>
              
              {/* Image Container with Perfect Centering */}
              <div className="relative bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                <div className="flex justify-center items-center">
                  <img 
                    src="/annotated_band_1.png" 
                    alt="Train Diagnostic Diagram - Annotated Band Analysis" 
                    className="max-w-full h-auto rounded-lg shadow-sm"
                    style={{ maxHeight: '450px', objectFit: 'contain' }}
                  />
                </div>
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium shadow-lg">
                  Diagnostic View
                </div>
              </div>
            </div>
          </div>

          {/* Component Status Details - Below Image */}
          <div className="space-y-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 text-center border-b border-gray-200 pb-2">
              Component Status Analysis
            </h4>
            
            {/* Working Components */}
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-5">
              <h5 className="font-semibold text-emerald-800 mb-4 text-base border-b border-emerald-200 pb-2">
                Working Components
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center bg-white rounded-md p-3 shadow-sm border border-emerald-100">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                  <span className="text-gray-800 font-medium">Front Nose Section</span>
                </div>
                <div className="flex items-center bg-white rounded-md p-3 shadow-sm border border-emerald-100">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                  <span className="text-gray-800 font-medium">Side Panels</span>
                </div>
                <div className="flex items-center bg-white rounded-md p-3 shadow-sm border border-emerald-100">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                  <span className="text-gray-800 font-medium">Rear Section</span>
                </div>
                <div className="flex items-center bg-white rounded-md p-3 shadow-sm border border-emerald-100">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                  <span className="text-gray-800 font-medium">Undercarriage</span>
                </div>
                <div className="flex items-center bg-white rounded-md p-3 shadow-sm border border-emerald-100">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                  <span className="text-gray-800 font-medium">Connection Joint</span>
                </div>
                <div className="flex items-center bg-white rounded-md p-3 shadow-sm border border-emerald-100">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                  <span className="text-gray-800 font-medium">Windows</span>
                </div>
              </div>
            </div>

            {/* Malfunctioned Components */}
            <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-lg p-5">
              <h5 className="font-semibold text-rose-800 mb-4 text-base border-b border-rose-200 pb-2">
                Malfunctioned Components
              </h5>
              <div className="space-y-3 text-sm">
                <div className="flex items-center bg-white rounded-md p-3 shadow-sm border-l-4 border-rose-500 border border-rose-100">
                  <div className="w-3 h-3 bg-rose-500 rounded-full mr-3"></div>
                  <span className="text-gray-800 font-medium">Roof Communication System</span>
                </div>
                <div className="flex items-center bg-white rounded-md p-3 shadow-sm border-l-4 border-rose-500 border border-rose-100">
                  <div className="w-3 h-3 bg-rose-500 rounded-full mr-3"></div>
                  <span className="text-gray-800 font-medium">Antenna Array</span>
                </div>
              </div>
            </div>

            {/* Maintenance Recommendations */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-5">
              <h5 className="font-semibold text-indigo-800 mb-4 text-base border-b border-indigo-200 pb-2">
                Recommended Actions
              </h5>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-center bg-white rounded-md p-3 shadow-sm border border-indigo-100">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  <span className="font-medium">Inspect and repair communication system</span>
                </li>
                <li className="flex items-center bg-white rounded-md p-3 shadow-sm border border-indigo-100">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  <span className="font-medium">Replace faulty antenna components</span>
                </li>
                <li className="flex items-center bg-white rounded-md p-3 shadow-sm border border-indigo-100">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  <span className="font-medium">Conduct full system diagnostics</span>
                </li>
                <li className="flex items-center bg-white rounded-md p-3 shadow-sm border border-indigo-100">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                  <span className="font-medium">Update maintenance schedule</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-lg p-5 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-slate-200 pb-2">
              Technical Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-md p-3 shadow-sm border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Issue Type</div>
                <div className="text-sm text-gray-900 font-medium">Communication System Failure</div>
              </div>
              <div className="bg-white rounded-md p-3 shadow-sm border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Severity</div>
                <div className="text-sm text-red-600 font-semibold bg-red-50 rounded-md px-2 py-1 inline-block">High</div>
              </div>
              <div className="bg-white rounded-md p-3 shadow-sm border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Estimated Repair Time</div>
                <div className="text-sm text-gray-900 font-medium">4-6 hours</div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold border border-gray-200"
            >
              Close
            </button>
            <button
              onClick={onScheduleMaintenance}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
            >
              Schedule Maintenance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReasonModal;
