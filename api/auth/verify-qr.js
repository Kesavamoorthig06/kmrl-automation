// Verify QR Code endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR Code is required' });
    }

    // Simulate QR code validation
    const validQRCodes = {
      'DEFAULT': { type: 'admin', description: 'Default Admin Access', redirect_url: '/' },
      '23it279': { type: 'operation', description: 'Operation Staff Access', redirect_url: 'operation staff.html' },
      'TECH001': { type: 'technical', description: 'Technical Department Access', redirect_url: 'technical.html' },
      'YARD001': { type: 'yard', description: 'Yard Operations Access', redirect_url: 'yard.html' },
      'OPS001': { type: 'operations', description: 'Metro Operations Interface', redirect_url: 'kochi_metro_ops_interface.html' },
      'BRAND001': { type: 'branding', description: 'Branding Officer Access', redirect_url: 'branding_officer.html' },
      'CLEAN001': { type: 'cleaning', description: 'Cleaning Crew Access', redirect_url: 'cleaning.html' }
    };

    const qrDetails = validQRCodes[qrCode];
    
    if (!qrDetails) {
      return res.status(404).json({ 
        message: 'Invalid or inactive QR Code' 
      });
    }

    res.json({
      valid: true,
      qrCode: {
        code: qrCode,
        type: qrDetails.type,
        description: qrDetails.description,
        redirectUrl: qrDetails.redirect_url
      }
    });
  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
