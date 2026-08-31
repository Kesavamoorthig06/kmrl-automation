import React, { useEffect, useState } from 'react';

const SchedulaneLoadingPage = ({ 
  onLoadingComplete = null,
  loadingDuration = 6000 
}) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('Initializing...');
  
  // Loading status messages that change as progress increases
  const statusMessages = [
    { threshold: 0, message: 'Initializing...' },
    { threshold: 15, message: 'Loading system modules...' },
    { threshold: 30, message: 'Connecting to database...' },
    { threshold: 45, message: 'Fetching train schedules...' },
    { threshold: 60, message: 'Loading real-time data...' },
    { threshold: 75, message: 'Preparing dashboard...' },
    { threshold: 90, message: 'Finalizing setup...' },
    { threshold: 100, message: 'Ready!' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        const newProgress = Math.min(prev + (Math.random() * 2 + 0.5), 100);
        
        // Update status message based on progress
        const currentMessage = statusMessages
          .reverse()
          .find(status => newProgress >= status.threshold);
        
        if (currentMessage) {
          setCurrentStatus(currentMessage.message);
        }
        
        if (newProgress >= 100) {
          clearInterval(interval);
          if (onLoadingComplete) {
            setTimeout(onLoadingComplete, 800);
          }
          return 100;
        }
        
        return newProgress;
      });
    }, 50); // Update every 50ms for smooth real-time animation
    
    return () => clearInterval(interval);
  }, [loadingDuration, onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 dark:opacity-15"
        style={{
          backgroundImage: "url('/bg_kmrl.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-8 text-center">
        
        {/* KMRL Logo */}
        <div className="mb-12 flex justify-center">
          <img 
            src="/metro-logo.png"
            alt="KMRL Logo"
            className="h-32 w-auto object-contain opacity-95"
            style={{
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15)) drop-shadow(0 0 0 1px rgba(255, 255, 255, 0.2))',
              WebkitFilter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15)) drop-shadow(0 0 0 1px rgba(255, 255, 255, 0.2))'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* SCHEDULANE Title */}
        <div className="mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-wide drop-shadow-lg">
            SCHEDULANE
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-lg font-medium drop-shadow-md">
            Auto-Selecting the Best Trains. Every Morning.
          </p>
        </div>

        {/* Status Message */}
        <div className="mb-12">
          <p className="text-gray-600 dark:text-gray-400 text-base font-medium drop-shadow-md">
            {currentStatus}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="mb-8">
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500 dark:from-gray-400 dark:via-gray-300 dark:to-gray-400 h-3 rounded-full transition-all duration-500 ease-out relative shadow-sm"
              style={{ 
                width: `${Math.min(100, loadingProgress)}%`,
                boxShadow: loadingProgress < 100 ? '0 0 12px rgba(107, 114, 128, 0.4)' : 'none'
              }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              
              {/* Pulse effect at the end of progress bar */}
              {loadingProgress > 0 && loadingProgress < 100 && (
                <div 
                  className="absolute right-0 top-0 w-1 h-3 bg-gray-700 dark:bg-gray-200 animate-pulse-fast"
                ></div>
              )}
            </div>
          </div>
        </div>

        {/* Custom CSS for animations */}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          @keyframes pulse-slow {
            0%, 100% {
              opacity: 0.8;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
          }
          
          @keyframes pulse-fast {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }
          
          .animate-shimmer {
            animation: shimmer 2.5s infinite;
          }
          
          .animate-pulse-slow {
            animation: pulse-slow 2s infinite;
          }
          
          .animate-pulse-fast {
            animation: pulse-fast 1s infinite;
          }
        `}</style>

        {/* Percentage Display */}
        <div className="text-center">
          <div className="text-xl font-bold text-gray-800 dark:text-gray-200 transition-all duration-300 drop-shadow-md">
            <span className="inline-block animate-pulse-slow">
              {Math.floor(loadingProgress)}%
            </span>
          </div>
        </div>
        
      </div>
      
    </div>
  );
};

export default SchedulaneLoadingPage;