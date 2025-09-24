import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QRGenerator = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Define the QR codes for different purposes
  const qrCodeData = [
    {
      id: '23it279',
      title: 'Operation Staff Access',
      description: 'QR Code for Operation Staff Portal',
      data: '23it279',
      color: '#3B82F6'
    },
    {
      id: 'TECH001',
      title: 'Technical Department',
      description: 'QR Code for Technical Portal',
      data: 'TECH001',
      color: '#10B981'
    },
    {
      id: 'YARD001',
      title: 'Yard Operations',
      description: 'QR Code for Yard Operations Portal',
      data: 'YARD001',
      color: '#F59E0B'
    },
    {
      id: 'BRAND001',
      title: 'Branding Officer',
      description: 'QR Code for Branding Officer Portal',
      data: 'BRAND001',
      color: '#8B5CF6'
    },
    {
      id: 'CLEAN001',
      title: 'Cleaning Crew',
      description: 'QR Code for Cleaning Crew Portal',
      data: 'CLEAN001',
      color: '#EF4444'
    }
  ];

  const generateQRCode = async (data, options = {}) => {
    try {
      const defaultOptions = {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };
      
      const qrDataURL = await QRCode.toDataURL(data, { ...defaultOptions, ...options });
      return qrDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const generateAllQRCodes = async () => {
    setLoading(true);
    const generatedCodes = [];

    for (const qrData of qrCodeData) {
      const qrImage = await generateQRCode(qrData.data, {
        color: {
          dark: qrData.color,
          light: '#FFFFFF'
        }
      });
      
      if (qrImage) {
        generatedCodes.push({
          ...qrData,
          image: qrImage
        });
      }
    }

    setQrCodes(generatedCodes);
    setLoading(false);
  };

  const downloadQRCode = (qrCode, filename) => {
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = qrCode.image;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllQRCodes = () => {
    qrCodes.forEach(qrCode => {
      setTimeout(() => {
        downloadQRCode(qrCode, `KMRL_${qrCode.id}_QR`);
      }, 100);
    });
  };

  useEffect(() => {
    generateAllQRCodes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">KMRL QR Code Generator</h1>
          <p className="text-gray-600">Generated QR codes for different metro operations</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Generating QR codes...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <button
                onClick={downloadAllQRCodes}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Download All QR Codes
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {qrCodes.map((qrCode) => (
                <div key={qrCode.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{qrCode.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{qrCode.description}</p>
                    
                    <div className="flex justify-center mb-4">
                      <div className="border-2 border-gray-200 rounded-lg p-4 bg-white">
                        <img 
                          src={qrCode.image} 
                          alt={`QR Code for ${qrCode.title}`}
                          className="w-32 h-32"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">QR Code Data:</p>
                      <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{qrCode.data}</p>
                    </div>

                    <button
                      onClick={() => downloadQRCode(qrCode, `KMRL_${qrCode.id}_QR`)}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Download QR Code
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Testing Instructions</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>1. Download the QR codes</strong> using the buttons above</p>
                <p><strong>2. Print them out</strong> or display them on another device</p>
                <p><strong>3. Use the QR scanner</strong> in the login page to test detection</p>
                <p><strong>4. Each QR code</strong> will redirect to different worker portals:</p>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• <strong>23it279</strong> → Operation Staff Portal</li>
                  <li>• <strong>TECH001</strong> → Technical Portal</li>
                  <li>• <strong>YARD001</strong> → Yard Operations Portal</li>
                  <li>• <strong>BRAND001</strong> → Branding Officer Portal</li>
                  <li>• <strong>CLEAN001</strong> → Cleaning Crew Portal</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-3">Error Handling Testing</h3>
              <div className="text-sm text-red-800 space-y-2">
                <p><strong>Invalid QR Code Testing:</strong></p>
                <ul className="ml-4 mt-2 space-y-1">
                  <li>• <strong>Any QR code not in the valid list</strong> will show an error</li>
                  <li>• <strong>Manual input</strong> of invalid codes will also trigger errors</li>
                  <li>• <strong>Error messages</strong> will appear in red at the top of the form</li>
                  <li>• <strong>Login will be blocked</strong> for invalid QR codes</li>
                </ul>
                <p className="mt-3"><strong>Test with invalid codes:</strong> INVALID001, FAKE123, TEST456, or any other code not in the valid list above.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QRGenerator;
