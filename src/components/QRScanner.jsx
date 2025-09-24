import React, { useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScan, onError, onClose, validQRCodes = [] }) => {
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const healthCheckIntervalRef = useRef(null);
  const [isScanning, setIsScanning] = useState(true); // Start scanning by default
  const [error, setError] = useState(null);
  const [lastScannedData, setLastScannedData] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('starting'); // Start with 'starting' status

  useEffect(() => {
    if (videoRef.current && isScanning) {
      setCameraStatus('starting');
      
      // Initialize QR Scanner
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR Code detected:', result);
          setLastScannedData(result.data);
          
          // Check if QR code is valid
          if (validQRCodes.length > 0 && !validQRCodes.includes(result.data)) {
            setError(`Invalid QR Code: "${result.data}". Please use a valid KMRL QR code.`);
            setTimeout(() => setError(null), 3000);
            return;
          }
          
          // Valid QR code detected - close scanner and trigger redirect
              handleClose();
              onScan(result);
        },
        {
          onDecodeError: (error) => {
            // Ignore decode errors as they're common during scanning
            console.log('Decode error (normal during scanning):', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      // Start scanning
      qrScannerRef.current.start().then(() => {
        setCameraStatus('active');
        setError(null);
        
        // Start health check interval
        startHealthCheck();
      }).catch((err) => {
        console.error('Failed to start QR scanner:', err);
        setError('Failed to start camera. Please check permissions.');
        setCameraStatus('error');
        onError && onError(err);
      });
    }

    return () => {
      stopHealthCheck();
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, [isScanning, onScan, onError, validQRCodes]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopHealthCheck();
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const startHealthCheck = () => {
    // Check camera health every 3 seconds
    healthCheckIntervalRef.current = setInterval(() => {
      if (videoRef.current && qrScannerRef.current) {
        const video = videoRef.current;
        
        // Check if video is playing and has dimensions
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          setCameraStatus('active');
        } else {
          console.warn('Camera stream appears to be inactive, attempting restart...');
          setCameraStatus('error');
          setError('Camera connection lost. Attempting to reconnect...');
          restartCamera();
        }
      }
    }, 3000);
  };

  const stopHealthCheck = () => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
  };

  const restartCamera = async () => {
    try {
      if (qrScannerRef.current) {
        await qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
      
      setCameraStatus('starting');
      setError(null);
      
      // Small delay before restarting
      setTimeout(() => {
        if (videoRef.current && isScanning) {
          qrScannerRef.current = new QrScanner(
            videoRef.current,
            (result) => {
              console.log('QR Code detected:', result);
              setLastScannedData(result.data);
              
              if (validQRCodes.length > 0 && !validQRCodes.includes(result.data)) {
                setError(`Invalid QR Code: "${result.data}". Please use a valid KMRL QR code.`);
                setTimeout(() => setError(null), 3000);
                return;
              }
              
              handleClose();
              onScan(result);
            },
            {
              onDecodeError: (error) => {
                console.log('Decode error (normal during scanning):', error);
              },
              highlightScanRegion: true,
              highlightCodeOutline: true,
            }
          );

          qrScannerRef.current.start().then(() => {
            setCameraStatus('active');
            setError(null);
            startHealthCheck();
          }).catch((err) => {
            console.error('Failed to restart camera:', err);
            setError('Failed to restart camera. Please try again.');
            setCameraStatus('error');
          });
        }
      }, 1000);
    } catch (err) {
      console.error('Error restarting camera:', err);
      setError('Failed to restart camera. Please try again.');
      setCameraStatus('error');
    }
  };

  const handleClose = () => {
    setIsScanning(false);
    setCameraStatus('stopped');
    stopHealthCheck();
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
    }
    onClose && onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-sm shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">QR Code Scanner</h3>
            <div className="flex items-center mt-1">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                cameraStatus === 'active' ? 'bg-green-500' :
                cameraStatus === 'starting' ? 'bg-yellow-500' :
                cameraStatus === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`}></div>
              <span className="text-xs text-gray-600">
                {cameraStatus === 'active' ? 'Camera Active' :
                 cameraStatus === 'starting' ? 'Starting Camera...' :
                 cameraStatus === 'error' ? 'Camera Error' :
                 'Camera Stopped'}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center text-2xl transition-all duration-200 hover:scale-110"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gray-50 text-gray-800 rounded-sm border border-gray-300 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="relative">
          {isScanning ? (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-gray-200 rounded-sm"
                style={{ objectFit: 'cover' }}
              />
              <div className="absolute inset-0 border-2 border-black rounded-sm pointer-events-none">
                <div className="absolute top-3 left-3 w-8 h-8 border-t-3 border-l-3 border-black rounded-tl-sm"></div>
                <div className="absolute top-3 right-3 w-8 h-8 border-t-3 border-r-3 border-black rounded-tr-sm"></div>
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-3 border-l-3 border-black rounded-bl-sm"></div>
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-3 border-r-3 border-black rounded-br-sm"></div>
              </div>
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-sm flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-sm flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">Camera not started</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex space-x-3">
          {cameraStatus === 'error' && (
            <button
              onClick={restartCamera}
              className="flex-1 px-6 py-3 bg-white text-orange-600 border border-orange-300 rounded-sm hover:bg-orange-50 hover:text-orange-700 hover:border-orange-400 transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500/10 transform hover:-translate-y-0.5"
              style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}
            >
              <span className="font-medium tracking-wider uppercase">
                Restart Camera
              </span>
            </button>
          )}
          <button
            onClick={handleClose}
            className={`${cameraStatus === 'error' ? 'flex-1' : 'w-full'} px-6 py-3 bg-white text-black border border-gray-400 rounded-sm hover:bg-gray-800 hover:text-white hover:border-gray-800 transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-500/10 transform hover:-translate-y-0.5`}
            style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', letterSpacing: '0.15em'}}
          >
            <span className="font-medium tracking-wider uppercase">
              Close
            </span>
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-500 text-center">
          <p>Point your camera at a QR code to scan</p>
          {lastScannedData && (
            <div className="mt-2 p-2 bg-gray-50 border border-gray-300 rounded-sm">
              <p className="text-gray-800">
                <strong>Last scanned:</strong> {lastScannedData}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
