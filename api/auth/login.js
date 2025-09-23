// Authentication login endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { workerId, qrCode, password } = req.body;

    // Validate input
    if (!workerId || !password) {
      return res.status(400).json({ 
        message: 'Worker ID and Password are required' 
      });
    }

    // Use default QR code if none provided
    const finalQrCode = qrCode || 'DEFAULT';
    
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

    const qrDetails = validQRCodes[finalQrCode];
    
    if (!qrDetails) {
      return res.status(401).json({ 
        message: 'Invalid QR Code' 
      });
    }

    // Check if credentials are correct (admin/admin)
    if (workerId !== 'admin' || password !== 'admin') {
      return res.status(401).json({ 
        message: 'Invalid credentials. Please use admin/admin' 
      });
    }

    // Generate a simple token (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({
      workerId: workerId,
      name: workerId,
      department: qrDetails.type || 'General',
      qrCode: qrCode,
      exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    })).toString('base64');

    // Return success response
    res.json({
      message: 'Login successful',
      token: token,
      sessionId: `session_${Date.now()}`,
      worker: {
        workerId: workerId,
        name: workerId,
        department: qrDetails.type || 'General'
      },
      qrCode: {
        code: finalQrCode,
        type: qrDetails.type,
        description: qrDetails.description,
        redirectUrl: qrDetails.redirect_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
