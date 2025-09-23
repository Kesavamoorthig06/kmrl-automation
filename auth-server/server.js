require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'kmrl_metro_secret_key_2025';

// Initialize SQLite Database
const db = new sqlite3.Database('./kmrl_auth.db');

// Create tables if they don't exist
db.serialize(() => {
  // Workers table
  db.run(`CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // QR Codes table
  db.run(`CREATE TABLE IF NOT EXISTS qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    redirect_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Login sessions table
  db.run(`CREATE TABLE IF NOT EXISTS login_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    worker_id TEXT NOT NULL,
    qr_code TEXT NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT 1
  )`);

  // Insert sample data
  const sampleWorkers = [
    {
      worker_id: 'EMP001',
      name: 'John Doe',
      department: 'Operations',
      password: 'demo123',
      qr_code: '23it279'
    },
    {
      worker_id: 'TECH001',
      name: 'Jane Smith',
      department: 'Technical',
      password: 'demo123',
      qr_code: 'TECH001'
    },
    {
      worker_id: 'YARD001',
      name: 'Mike Johnson',
      department: 'Yard Operations',
      password: 'demo123',
      qr_code: 'YARD001'
    },
    {
      worker_id: 'OPS001',
      name: 'Sarah Wilson',
      department: 'Operations',
      password: 'demo123',
      qr_code: 'OPS001'
    },
    {
      worker_id: 'BRAND001',
      name: 'David Brown',
      department: 'Branding',
      password: 'demo123',
      qr_code: 'BRAND001'
    },
    {
      worker_id: 'CLEAN001',
      name: 'Lisa Davis',
      department: 'Cleaning',
      password: 'demo123',
      qr_code: 'CLEAN001'
    }
  ];

  const sampleQRCodes = [
    { code: 'DEFAULT', type: 'admin', description: 'Default Admin Access', redirect_url: '/' },
    { code: '23it279', type: 'operation', description: 'Operation Staff Access', redirect_url: 'operation staff.html' },
    { code: 'TECH001', type: 'technical', description: 'Technical Department Access', redirect_url: 'technical.html' },
    { code: 'YARD001', type: 'yard', description: 'Yard Operations Access', redirect_url: 'yard.html' },
    { code: 'OPS001', type: 'operations', description: 'Metro Operations Interface', redirect_url: 'kochi_metro_ops_interface.html' },
    { code: 'BRAND001', type: 'branding', description: 'Branding Officer Access', redirect_url: 'branding_officer.html' },
    { code: 'CLEAN001', type: 'cleaning', description: 'Cleaning Crew Access', redirect_url: 'cleaning.html' }
  ];

  // Insert sample workers
  sampleWorkers.forEach(worker => {
    const passwordHash = bcrypt.hashSync(worker.password, 10);
    db.run(
      `INSERT OR IGNORE INTO workers (worker_id, name, department, password_hash, qr_code) 
       VALUES (?, ?, ?, ?, ?)`,
      [worker.worker_id, worker.name, worker.department, passwordHash, worker.qr_code]
    );
  });

  // Insert sample QR codes
  sampleQRCodes.forEach(qr => {
    db.run(
      `INSERT OR IGNORE INTO qr_codes (code, type, description, redirect_url) 
       VALUES (?, ?, ?, ?)`,
      [qr.code, qr.type, qr.description, qr.redirect_url]
    );
  });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'KMRL Auth Server is running',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
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
    
    // Check if QR code exists and is valid
    db.get(
      `SELECT * FROM qr_codes WHERE code = ? AND is_active = 1`,
      [finalQrCode],
      async (err, qrDetails) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

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

        // Generate JWT token with provided worker ID
        const token = jwt.sign(
          { 
            workerId: workerId,
            name: workerId, // Use workerId as name since we accept any username
            department: qrDetails.type || 'General',
            qrCode: qrCode
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Create session
        const sessionId = uuidv4();
        db.run(
          `INSERT INTO login_sessions (session_id, worker_id, qr_code, ip_address, user_agent) 
           VALUES (?, ?, ?, ?, ?)`,
          [sessionId, workerId, finalQrCode, req.ip, req.get('User-Agent')],
          (err) => {
            if (err) {
              console.error('Session creation error:', err);
            }
          }
        );

        // Return success response
        res.json({
          message: 'Login successful',
          token: token,
          sessionId: sessionId,
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
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify QR Code endpoint
app.post('/api/auth/verify-qr', (req, res) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR Code is required' });
    }

    db.get(
      `SELECT * FROM qr_codes WHERE code = ? AND is_active = 1`,
      [qrCode],
      (err, qrDetails) => {
        if (err) {
          console.error('QR code verification error:', err);
          return res.status(500).json({ message: 'Internal server error' });
        }

        if (!qrDetails) {
          return res.status(404).json({ 
            message: 'Invalid or inactive QR Code' 
          });
        }

        res.json({
          valid: true,
          qrCode: {
            code: qrDetails.code,
            type: qrDetails.type,
            description: qrDetails.description,
            redirectUrl: qrDetails.redirect_url
          }
        });
      }
    );
  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get worker profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    worker: req.user
  });
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  const { sessionId } = req.body;
  
  if (sessionId) {
    db.run(
      `UPDATE login_sessions SET is_active = 0 WHERE session_id = ?`,
      [sessionId],
      (err) => {
        if (err) {
          console.error('Logout error:', err);
        }
      }
    );
  }

  res.json({ message: 'Logout successful' });
});

// Get all QR codes (for admin)
app.get('/api/qr-codes', authenticateToken, (req, res) => {
  db.all(
    `SELECT code, type, description, redirect_url, is_active, created_at 
     FROM qr_codes ORDER BY created_at DESC`,
    (err, rows) => {
      if (err) {
        console.error('QR codes fetch error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.json({ qrCodes: rows });
    }
  );
});

// Get login sessions (for admin)
app.get('/api/sessions', authenticateToken, (req, res) => {
  db.all(
    `SELECT s.session_id, s.worker_id, s.qr_code, s.login_time, s.ip_address, 
            w.name, w.department, q.description as qr_description
     FROM login_sessions s
     JOIN workers w ON s.worker_id = w.worker_id
     JOIN qr_codes q ON s.qr_code = q.code
     WHERE s.is_active = 1
     ORDER BY s.login_time DESC
     LIMIT 100`,
    (err, rows) => {
      if (err) {
        console.error('Sessions fetch error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }

      res.json({ sessions: rows });
    }
  );
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Serve cleaning page
app.get('/cleaning.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/cleaning.html'));
});

// Serve operation staff page
app.get('/operation staff.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/operation staff.html'));
});

// Serve technical page
app.get('/technical.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/technical.html'));
});

// Serve yard page
app.get('/yard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/yard.html'));
});

// Serve operations interface page
app.get('/kochi_metro_ops_interface.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/kochi_metro_ops_interface.html'));
});

// Serve branding officer page
app.get('/branding_officer.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/branding_officer.html'));
});

// Serve dashboard page
app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/workers/dashboard.html'));
});

// Serve static files from public directory
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', req.path));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚇 KMRL Auth Server running on http://localhost:${PORT}`);
  console.log(`📱 Login page: http://localhost:${PORT}/login`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down KMRL Auth Server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});
