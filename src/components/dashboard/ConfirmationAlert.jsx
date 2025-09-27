import React from 'react';
import { CheckCircle } from "lucide-react";
import { useTranslation } from '../../hooks/useTranslation.js';

const ConfirmationAlert = ({ showConfirmation }) => {
  const { t } = useTranslation();
  
  if (!showConfirmation) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">{t('success')}</h3>
            <p className="text-sm text-green-700">{t('trainDeployedSuccessfully')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationAlert;
