import React from 'react';
import { Users, BarChart3, Target, CheckCircle } from 'lucide-react';

const DeploymentStatusCards = ({ selectedTrainsCount, t }) => {
  return (
    <>
      {/* Deployment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-2xl p-6 border border-green-200 dark:border-slate-600 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center">
            <div className="p-4 bg-green-100 dark:bg-slate-700 rounded-xl border border-green-200 dark:border-slate-500 shadow-md">
              <Users className="h-8 w-8 text-green-700 dark:text-green-400" />
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-bold text-green-900 dark:text-white mb-2">{t('trainsDeployed')}</h3>
              <p className="text-4xl font-black text-green-900 dark:text-green-400 drop-shadow-sm">{selectedTrainsCount}</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">Successfully Deployed</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-2xl p-6 border border-blue-200 dark:border-slate-600 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center">
            <div className="p-4 bg-blue-100 dark:bg-slate-700 rounded-xl border border-blue-200 dark:border-slate-500 shadow-md">
              <BarChart3 className="h-8 w-8 text-blue-700 dark:text-blue-400" />
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-bold text-blue-900 dark:text-white mb-2">{t('successRate')}</h3>
              <p className="text-4xl font-black text-blue-900 dark:text-blue-400 drop-shadow-sm">100%</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Perfect Success</p>
            </div>
          </div>
        </div>

        <div className="bg-teal-50 dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-2xl p-6 border border-teal-200 dark:border-slate-600 hover:shadow-xl dark:hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center">
            <div className="p-4 bg-teal-100 dark:bg-slate-700 rounded-xl border border-teal-200 dark:border-slate-500 shadow-md">
              <Target className="h-8 w-8 text-teal-700 dark:text-teal-400" />
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-bold text-teal-900 dark:text-white mb-2">{t('crewsNotified')}</h3>
              <p className="text-4xl font-black text-teal-900 dark:text-teal-400 drop-shadow-sm">3</p>
              <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">All Crews Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Crew Notifications */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg dark:shadow-2xl p-6 mb-8 border border-green-200 dark:border-slate-600 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-300">
        <h3 className="text-2xl font-bold text-green-800 dark:text-white mb-6 flex items-center">
          <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-400 mr-2" />
          {t('crewNotificationsSent')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 dark:bg-slate-700 border border-green-200 dark:border-slate-500 rounded-lg p-4 hover:bg-green-100 dark:hover:bg-slate-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-md">
            <div className="mb-2">
              <h4 className="font-bold text-green-900 dark:text-white text-lg">Cleaning Crew</h4>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">Prepare for interior deep-cleaning of {selectedTrainsCount} trains</p>
          </div>
          <div className="bg-blue-50 dark:bg-slate-700 border border-blue-200 dark:border-slate-500 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-slate-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-md">
            <div className="mb-2">
              <h4 className="font-bold text-blue-900 dark:text-white text-lg">Loco-Pilot Crew</h4>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">Ready for train operation and route preparation</p>
          </div>
          <div className="bg-teal-50 dark:bg-slate-700 border border-teal-200 dark:border-slate-500 rounded-lg p-4 hover:bg-teal-100 dark:hover:bg-slate-600 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-md">
            <div className="mb-2">
              <h4 className="font-bold text-teal-900 dark:text-white text-lg">Depot Rollout Crew</h4>
            </div>
            <p className="text-sm text-teal-700 dark:text-teal-300">Prepare for train deployment and bay management</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeploymentStatusCards;
