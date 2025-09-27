import React, { useEffect, useRef, useState } from 'react';

// Converted from provided HTML -> JSX with minimal structural changes.
// Note: the page expects the html5-qrcode lib to be available. The component
// creates a script tag to load it from the same CDN the original used.

export default function KMRLLogin() {
  const [currentLang, setCurrentLang] = useState('en');
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const html5QrcodeScannerRef = useRef(null);
  const qrModalRef = useRef(null);
  const hamburgerMenuRef = useRef(null);
  const qrCredentials = useRef({
    brand: { workerId: 'brand', password: 'password', role: 'Branding Officer', redirectUrl: '/branding_officer' },
    clean: { workerId: 'clean', password: 'password', role: 'Cleaning Crew', redirectUrl: '/cleaning' },
    tech: { workerId: 'tech', password: 'password', role: 'Technical Staff', redirectUrl: '/technical' },
    yard: { workerId: 'yard', password: 'password', role: 'Yard Operations', redirectUrl: '/yard' },
    operation: { workerId: 'operation', password: 'password', role: 'Operation Staff', redirectUrl: '/operation_staff' },
    admin: { workerId: 'admin', password: 'password', role: 'Administrator', redirectUrl: '/dashboard' }
  }).current;

  // Simple helper for updating status messages (closable after timeout)
  let statusHideTimer = useRef(null);
  function showMessage(message, type) {
    setStatusMessage({ text: message, type });
    if (statusHideTimer.current) clearTimeout(statusHideTimer.current);
    statusHideTimer.current = setTimeout(() => setStatusMessage({ text: '', type: '' }), 2800);
  }

  // Load html5-qrcode script once
  useEffect(() => {
    if (typeof window.Html5Qrcode === 'undefined') {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
      s.async = true;
      s.onload = () => {
        // library loaded
      };
      document.body.appendChild(s);
      return () => {
        // optional: do not remove script on unmount to allow reuse
      };
    }
  }, []);

  // language translations
  const translations = {
    en: {
      title: 'Employee Login',
      workerId: 'Worker ID',
      qrCode: 'Train/Station QR Code',
      password: 'Password',
      openCamera: 'Open Camera',
      qrPlaceholder: 'QR code value will appear here after scanning',
      workerIdPlaceholder: 'Enter your Worker ID',
      passwordPlaceholder: 'Enter your password',
      login: 'Log-in',
      footer: '© 2024 Kochi Metro Rail Limited. All rights reserved.'
    },
    ml: {
      title: 'ജീവനക്കാരൻ ലോഗിൻ',
      workerId: 'വർക്കർ ഐഡി',
      qrCode: 'ട്രെയിൻ/സ്റ്റേഷൻ QR കോഡ്',
      password: 'പാസ്‌വേഡ്',
      openCamera: 'കാമറ തുറക്കുക',
      qrPlaceholder: 'QR കോഡ് സ്കാൻ ചെയ്ത ശേഷം ഇവിടെ ദൃശ്യമാകും',
      workerIdPlaceholder: 'നിങ്ങളുടെ വർക്കർ ഐഡി നൽകുക',
      passwordPlaceholder: 'നിങ്ങളുടെ പാസ്‌വേഡ് നൽകുക',
      login: 'ലോഗിൻ',
      footer: '© 2024 കൊച്ചി മെട്രോ റെയിൽ ലിമിറ്റഡ്. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.'
    },
    hi: {
      title: 'कर्मचारी लॉगिन',
      workerId: 'वर्कर आईडी',
      qrCode: 'ट्रेन/स्टेशन QR कोड',
      password: 'पासवर्ड',
      openCamera: 'कैमरा खोलें',
      qrPlaceholder: 'QR कोड स्कैन करने के बाद यहां दिखाई देगा',
      workerIdPlaceholder: 'अपना वर्कर आईडी दर्ज करें',
      passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
      login: 'लॉगिन',
      footer: '© 2024 कोच्चि मेट्रो रेल लिमिटेड. सभी अधिकार सुरक्षित।'
    }
  };

  // update language-driven text on the inputs and labels (keeps structure but updates content)
  useEffect(() => {
    const t = translations[currentLang];
    const formTitle = document.querySelector('.form-title');
    if (formTitle) formTitle.textContent = t.title;
    const workerLabel = document.querySelector('label[for="worker-id"]');
    if (workerLabel) workerLabel.textContent = t.workerId;
    const qrLabel = document.querySelector('label[for="qr-code"]');
    if (qrLabel) qrLabel.textContent = t.qrCode;
    const passwordLabel = document.querySelector('label[for="password"]');
    if (passwordLabel) passwordLabel.textContent = t.password;
    const qrBtn = document.getElementById('qr-btn');
    if (qrBtn) {
      // preserve SVG if present
      const svg = qrBtn.querySelector('svg');
      qrBtn.textContent = '';
      if (svg) qrBtn.appendChild(svg);
      qrBtn.append(' ' + t.openCamera);
    }
    const workerInput = document.getElementById('worker-id');
    if (workerInput) workerInput.placeholder = t.workerIdPlaceholder;
    const qrInput = document.getElementById('qr-code');
    if (qrInput) qrInput.placeholder = t.qrPlaceholder;
    const pwdInput = document.getElementById('password');
    if (pwdInput) pwdInput.placeholder = t.passwordPlaceholder;
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.textContent = t.login;
    const footer = document.querySelector('.footer');
    if (footer) footer.textContent = t.footer;
  }, [currentLang]);

  // Hamburger menu toggle
  function toggleHamburgerMenu() {
    const menu = hamburgerMenuRef.current;
    if (!menu) return;
    menu.classList.toggle('show');
  }

  function switchLanguage() {
    // cycle through 'en', 'ml', 'hi'
    setCurrentLang((prev) => {
      if (prev === 'en') return 'ml';
      if (prev === 'ml') return 'hi';
      return 'en';
    });
    // close menu
    const menu = hamburgerMenuRef.current;
    if (menu) menu.classList.remove('show');
  }

  function quickLogin(role) {
    console.log('Quick login for role:', role);
    const credentials = qrCredentials[role];
    if (credentials) {
      showMessage(`Quick login: ${credentials.role}. Redirecting...`, 'success');
      setTimeout(() => {
        window.location.href = credentials.redirectUrl;
      }, 1000);
    }
    // close menu
    const menu = hamburgerMenuRef.current;
    if (menu) menu.classList.remove('show');
  }

  // QR scanner related functions
  function openQRScanner() {
    const modal = qrModalRef.current;
    if (!modal) return;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    const reader = document.getElementById('qr-reader');
    if (reader) reader.innerHTML = '';
    // auto-start immediately
    startQRScanner();
  }

  function closeQRScanner() {
    const modal = qrModalRef.current;
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    if (html5QrcodeScannerRef.current) {
      try {
        html5QrcodeScannerRef.current.clear();
      } catch (e) {
        // ignore
      }
      html5QrcodeScannerRef.current = null;
    }
  }

  function processQRCode(qrData) {
    console.log('Processing QR code:', qrData);
    
    if (!qrData || typeof qrData !== 'string') {
      showMessage('Invalid QR Code format. Please scan a valid employee QR code.', 'error');
      return;
    }
    
    const normalizedQRData = qrData.trim().toLowerCase();
    console.log('Normalized QR data:', normalizedQRData);
    
    const credentials = qrCredentials[normalizedQRData];
    console.log('Found credentials:', credentials);

    if (credentials) {
      showMessage(`QR Code detected! Redirecting to ${credentials.role}...`, 'success');

      // Stop scanner and close modal immediately
      if (html5QrcodeScannerRef.current && html5QrcodeScannerRef.current.stop) {
        html5QrcodeScannerRef.current.stop().then(() => {
          closeQRScanner();
          // Navigate immediately
          setTimeout(() => {
            console.log('Redirecting to:', credentials.redirectUrl);
            window.location.href = credentials.redirectUrl;
          }, 1000);
        }).catch(() => {
          closeQRScanner();
          setTimeout(() => {
            console.log('Redirecting to:', credentials.redirectUrl);
            window.location.href = credentials.redirectUrl;
          }, 1000);
        });
      } else {
        closeQRScanner();
        setTimeout(() => {
          console.log('Redirecting to:', credentials.redirectUrl);
          window.location.href = credentials.redirectUrl;
        }, 1000);
      }
    } else {
      showMessage('Invalid QR Code. Please scan a valid employee QR code.', 'error');
      const qrInput = document.getElementById('qr-code');
      if (qrInput) qrInput.value = normalizedQRData;
      if (html5QrcodeScannerRef.current && html5QrcodeScannerRef.current.stop) {
        html5QrcodeScannerRef.current.stop().then(() => closeQRScanner()).catch(() => closeQRScanner());
      } else {
        closeQRScanner();
      }
    }
  }

  function startQRScanner() {
    // clear previous instance
    if (html5QrcodeScannerRef.current) {
      try { 
        html5QrcodeScannerRef.current.clear(); 
      } catch (e) {}
      html5QrcodeScannerRef.current = null;
    }

    if (typeof window.Html5Qrcode === 'undefined') {
      showMessage('QR Scanner library not loaded. Please refresh the page.', 'error');
      return;
    }

    try {
      const scanner = new window.Html5Qrcode('qr-reader');
      html5QrcodeScannerRef.current = scanner;
      
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }
      };

      scanner.start(
        { facingMode: 'environment' }, 
        config,
        (decodedText, decodedResult) => {
          console.log('QR Code detected:', decodedText);
          processQRCode(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors
        }
      ).catch((err) => {
        console.error('Environment camera failed, trying user camera:', err);
        // Try user camera as fallback
        scanner.start(
          { facingMode: 'user' }, 
          config,
          (decodedText, decodedResult) => {
            console.log('QR Code detected:', decodedText);
            processQRCode(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors
          }
        ).catch((err2) => {
          console.error('Both cameras failed:', err2);
          showMessage('Unable to start camera. Please check camera permissions.', 'error');
        });
      });
    } catch (e) {
      console.error('Scanner initialization failed:', e);
      showMessage('Unable to start QR scanner.', 'error');
    }
  }

  function stopQRScanner() {
    if (!html5QrcodeScannerRef.current) return;
    try {
      html5QrcodeScannerRef.current.stop().then(() => {
        try { html5QrcodeScannerRef.current.clear(); } catch (e) {}
        html5QrcodeScannerRef.current = null;
      });
    } catch (e) {
      html5QrcodeScannerRef.current = null;
    }
  }

  // form submit handler
  // Ensure form fields are empty on mount
  useEffect(() => {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const workerIdField = document.getElementById('worker-id');
      const passwordField = document.getElementById('password');
      const qrField = document.getElementById('qr-code');
      
      // Force clear any values
      if (workerIdField) {
        workerIdField.value = '';
        workerIdField.setAttribute('value', '');
      }
      if (passwordField) {
        passwordField.value = '';
        passwordField.setAttribute('value', '');
      }
      if (qrField) {
        qrField.value = '';
        qrField.setAttribute('value', '');
      }
    }, 100);
  }, []);

  useEffect(() => {
    const form = document.getElementById('loginForm');
    console.log('Form found:', form);
    if (!form) {
      console.log('Form not found!');
      return;
    }

    const submitHandler = function (e) {
      e.preventDefault();
      console.log('Form submitted!');
      
      const workerId = (document.getElementById('worker-id')?.value || '').trim();
      const password = (document.getElementById('password')?.value || '').trim();
      
      console.log('Worker ID:', workerId);
      console.log('Password:', password);

      if (!workerId || !password) {
        showMessage('Please fill in all required fields', 'error');
        return;
      }

      const credentials = qrCredentials[workerId];
      console.log('Found credentials:', credentials);
      console.log('Available credentials:', Object.keys(qrCredentials));
      
      if (credentials && credentials.password === password) {
        showMessage(`Login successful! Welcome ${credentials.role}. Redirecting...`, 'success');
        setTimeout(() => { 
          if (credentials.redirectUrl.startsWith('/')) {
            // React route
            window.location.href = credentials.redirectUrl;
          } else {
            // HTML page
            window.location.href = credentials.redirectUrl;
          }
        }, 1000);
        return;
      }

      const id = workerId.toLowerCase();
      if (id.includes('cleaning') || id.includes('clean')) {
        showMessage('Redirecting to cleaning...', 'success');
        return (window.location.href = '/cleaning');
      } else if (id.includes('branding') || id.includes('brand')) {
        return (window.location.href = '/branding_officer');
      } else if (id.includes('operation') || id.includes('ops')) {
        return (window.location.href = '/operation_staff');
      } else if (id.includes('technical') || id.includes('tech')) {
        return (window.location.href = '/technical');
      } else if (id.includes('yard') || id.includes('depot')) {
        return (window.location.href = '/yard');
      } else {
        showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => (window.location.href = '/cleaning'), 900);
      }
    };

    console.log('Adding event listener to form');
    form.addEventListener('submit', submitHandler);
    return () => {
      console.log('Removing event listener from form');
      form.removeEventListener('submit', submitHandler);
    };
  }, []);

  // attach click to QR button using effect to avoid duplicate listeners
  useEffect(() => {
    const btn = document.getElementById('qr-btn');
    if (!btn) return;
    const handler = (e) => { e.preventDefault(); openQRScanner(); };
    btn.addEventListener('click', handler);
    return () => btn.removeEventListener('click', handler);
  }, []);

  // close modal on escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeQRScanner(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // clicking outside hamburger menu closes it
  useEffect(() => {
    const onDocClick = (event) => {
      const menu = hamburgerMenuRef.current;
      const hamburger = document.querySelector('.hamburger');
      if (!menu || !hamburger) return;
      if (!menu.contains(event.target) && !hamburger.contains(event.target)) {
        menu.classList.remove('show');
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // CSS string (keeps original styling as-is)
  const css = `
    /* Reset-ish */
    * { box-sizing: border-box; }
    html,body { height:100%; margin:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }

    /* background image: full screen, greyed & blurred like screenshot */
    .bg { position: fixed; inset: 0; background: center/cover no-repeat url('/bg_kmrl.jpg'); filter: grayscale(70%) brightness(80%) blur(2px); z-index: 0; }
    .bg::after { content: ""; position: absolute; inset:0; background: rgba(0,0,0,0.25); }

    /* Header - deep blue band with centered title and logo, hamburger left */
    .header { position: relative; z-index: 3; height: 88px; background: linear-gradient(180deg,#0b4aa1,#083a86); display:flex; align-items:center; justify-content:center; padding: 0 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
    .hamburger-container { position: absolute; left: 18px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: row; align-items: center; gap: 8px; }
    .hamburger { color: #fff; font-size: 22px; line-height:1; cursor:pointer; width:34px; height:34px; display:flex; align-items:center; justify-content:center; }
    .quick-access-hint { position: relative; display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.15); padding: 4px 8px; border-radius: 12px; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); }
    .quick-access-hint::before { content: ""; position: absolute; left: -5px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-right: 6px solid rgba(255,255,255,0.6); }
    .pointing-finger { font-size: 14px; animation: point 2s ease-in-out infinite; }
    .quick-access-text { color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    @keyframes point { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(2px); } }

    .hamburger-menu { position: absolute; top: 100%; left: 18px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 8px 0; min-width: 150px; z-index: 1000; display: none; }
    .hamburger-menu.show { display:block; }
    .hamburger-menu-item { padding: 10px 16px; cursor: pointer; color: #333; font-size: 0.9rem; font-weight: 500; transition: background-color 0.2s ease; display:flex; align-items:center; gap:8px; }
    .hamburger-menu-item:hover { background-color: #f5f5f5; }
    .hamburger-menu-divider { height: 1px; background-color: #e0e0e0; margin: 4px 0; }
    .hamburger-menu-section-title { padding: 8px 16px 4px; font-size: 0.8rem; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .quick-access-icon { font-size: 16px; width: 20px; text-align: center; }
    .credential-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .role-name { font-weight: 600; color: #333; font-size: 0.9rem; }
    .credential-text { font-size: 0.75rem; color: #666; font-family: monospace; }

    .header .brand { display:flex; flex-direction:column; align-items:center; text-align:center; }
    .header .logo { width:48px; height:36px; object-fit:contain; margin-bottom:6px; }
    .header h1 { margin:0; color:#fff; font-size:22px; letter-spacing:1px; font-weight:700; }

    /* Center area */
    .page { position:relative; z-index:2; min-height: calc(100vh - 88px); display:flex; align-items:center; justify-content:center; padding: 24px; }

    /* Big rounded login card like screenshot */
    .card { width: 360px; max-width: calc(100% - 48px); background: linear-gradient(180deg, rgba(13,138,199,0.96), rgba(9,133,175,0.95)); border-radius: 28px; padding: 28px 26px; box-shadow: 0 18px 40px rgba(4,26,46,0.45); color: #fff; display:flex; flex-direction:column; gap:16px; align-items:stretch; backdrop-filter: blur(3px); }
    .form-title { font-size: 22px; font-weight:700; text-align:center; margin: 8px 0 4px; }
    .input-group { display:flex; flex-direction:column; gap:8px; }
    label { font-weight:600; font-size:14px; color: rgba(255,255,255,0.95); margin-left:2px; }
    .required::after { content: " *"; color:#ff7b7b; font-weight:800; }
    input[type="text"], input[type="password"] { width:100%; padding:14px 16px; border-radius:12px; border: none; background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.98); font-size:15px; outline:none; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
    input::placeholder { color: rgba(255,255,255,0.7); font-weight:400; }
    #qr-row { display:flex; flex-direction:column; gap:10px; }
    #qr-btn { display:flex; align-items:center; justify-content:center; gap:10px; padding:12px 14px; border-radius:12px; background:#fff; color:#0a7fb3; border:none; cursor:pointer; font-weight:700; font-size:15px; box-shadow: 0 6px 18px rgba(2,18,30,0.15); }
    .camera-icon { width:18px; height:18px; display:inline-block; filter: none; }
    #qr-code { padding:12px 14px; border-radius:12px; border:none; background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.98); font-size:15px; }
    #submitBtn { margin-top:6px; padding:14px 18px; border-radius: 18px; border:none; font-weight:700; font-size:16px; cursor:pointer; color:white; background: linear-gradient(90deg,#0f6b51,#0b5346); box-shadow: 0 8px 24px rgba(11,83,70,0.34); }
    .status-message { display:none; padding:10px 12px; border-radius:10px; font-weight:600; text-align:center; margin-bottom:4px; }
    .status-message.success { background: rgba(255,255,255,0.08); color:#e6ffef; }
    .status-message.error { background: rgba(255,255,255,0.08); color:#ffdede; }
    .footer { position:fixed; bottom:16px; left:0; right:0; text-align:center; color:rgba(255,255,255,0.9); font-size:12px; z-index:2; pointer-events:none; }
    .qr-modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:2000; align-items:center; justify-content:center; }
    .qr-modal-content { width:92%; max-width:520px; background:#fff; border-radius:10px; padding:14px; position:relative; }
    .qr-close { position:absolute; right:10px; top:6px; font-size:24px; cursor:pointer; color:#333; }
    #qr-reader { border: 2px solid #ddd; border-radius: 8px; overflow: hidden; }
    #qr-reader video { width: 100% !important; height: auto !important; }
    #qr-reader canvas { display: none !important; }

    @media (min-width: 900px) { .card { width:420px; padding:36px; border-radius:26px; } .header { height:110px; } .header .logo { width:60px; height:44px; } .form-title { font-size:26px; } .quick-access-text { font-size: 11px; } }
    @media (max-width:420px) { .card { width:100%; padding:20px; border-radius:18px; } .header { height:78px; } .hamburger-container { left:12px; gap:6px; } .quick-access-text { font-size: 9px; } .quick-access-hint { padding: 3px 6px; } }
  `;

  // JSX markup closely mirrors provided HTML structure with small React wiring
  return (
    <div>
      <style>{css}</style>

      <div className="bg" aria-hidden="true"></div>

      <header className="header" role="banner">
        <div className="hamburger-container">
          <div className="hamburger" onClick={toggleHamburgerMenu} aria-hidden="true">☰</div>
          <div className="quick-access-hint" aria-hidden="true">
            <span className="quick-access-text">Quick Access</span>
            <span className="pointing-finger">👈</span>
          </div>
        </div>

        <div className="hamburger-menu" id="hamburgerMenu" ref={hamburgerMenuRef}>
          <div className="hamburger-menu-item" onClick={switchLanguage}>
            <span className="language-icon">🌐</span>
            <span id="languageText">
              {currentLang === 'en' ? 'മലയാളം' : 
               currentLang === 'ml' ? 'हिंदी' : 'English'}
            </span>
          </div>
          
          <div className="hamburger-menu-divider"></div>
          
          <div className="hamburger-menu-section-title">Quick Access</div>
          
          <div className="hamburger-menu-item" onClick={() => quickLogin('brand')}>
            <span className="quick-access-icon">🎨</span>
            <div className="credential-info">
              <span className="role-name">Branding Officer</span>
              <span className="credential-text">brand / password</span>
            </div>
          </div>
          
          <div className="hamburger-menu-item" onClick={() => quickLogin('clean')}>
            <span className="quick-access-icon">🧹</span>
            <div className="credential-info">
              <span className="role-name">Cleaning Crew</span>
              <span className="credential-text">clean / password</span>
            </div>
          </div>
          
          <div className="hamburger-menu-item" onClick={() => quickLogin('tech')}>
            <span className="quick-access-icon">🔧</span>
            <div className="credential-info">
              <span className="role-name">Technical Staff</span>
              <span className="credential-text">tech / password</span>
            </div>
          </div>
          
          <div className="hamburger-menu-item" onClick={() => quickLogin('yard')}>
            <span className="quick-access-icon">🚂</span>
            <div className="credential-info">
              <span className="role-name">Yard Operations</span>
              <span className="credential-text">yard / password</span>
            </div>
          </div>
          
          <div className="hamburger-menu-item" onClick={() => quickLogin('operation')}>
            <span className="quick-access-icon">👨‍💼</span>
            <div className="credential-info">
              <span className="role-name">Operation Staff</span>
              <span className="credential-text">operation / password</span>
            </div>
          </div>
          
          <div className="hamburger-menu-item" onClick={() => quickLogin('admin')}>
            <span className="quick-access-icon">👑</span>
            <div className="credential-info">
              <span className="role-name">Administrator</span>
              <span className="credential-text">admin / password</span>
            </div>
          </div>
        </div>

        <div className="brand">
          <img src="/metro-logo.png" alt="KMRL" className="logo" />
          <h1>KMRL METRO</h1>
        </div>
      </header>

      <main className="page" role="main">
        <form id="loginForm" className="card" autoComplete="off" noValidate>
          <div className="form-title">Employee Login</div>

          <div id="statusMessage" className={`status-message ${statusMessage.type}`} role="status" aria-live="polite" style={{ display: statusMessage.text ? 'block' : 'none' }}>
            {statusMessage.text}
          </div>

          <div className="input-group">
            <label htmlFor="worker-id" className="required">Worker ID</label>
            <input 
              id="worker-id" 
              name="worker-id" 
              required 
              placeholder="Enter your Worker ID" 
              type="text" 
              defaultValue=""
            />
          </div>

          <div id="qr-row" className="input-group">
            <label htmlFor="qr-code" className="required">Train/Station QR Code</label>
            <button type="button" id="qr-btn" aria-haspopup="dialog" aria-controls="qrModal">
              <svg className="camera-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7zM20 6h-3.2l-1.5-2.5A1 1 0 0 0 14.8 3h-5.6a1 1 0 0 0-.9.5L6.8 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z" />
              </svg>
              Open Camera
            </button>
            <input id="qr-code" name="qr-code" readOnly placeholder="QR code value will appear here after scanning" type="text" />
          </div>

          <div className="input-group">
            <label htmlFor="password" className="required">Password</label>
            <input 
              id="password" 
              name="password" 
              required 
              placeholder="Enter your password" 
              type="password" 
              defaultValue=""
            />
          </div>

          <button type="submit" id="submitBtn">Log-in</button>
        </form>
      </main>

      <div className="footer" aria-hidden="true">© 2024 Kochi Metro Rail Limited. All rights reserved.</div>

      <div id="qrModal" className="qr-modal" role="dialog" aria-modal="true" aria-hidden="true" ref={qrModalRef} onClick={(e) => { if (e.target === qrModalRef.current) closeQRScanner(); }}>
        <div className="qr-modal-content">
          <span className="qr-close" onClick={closeQRScanner} title="Close">×</span>
          <h3 style={{ margin: '6px 0 12px', fontFamily: 'inherit' }}>Scan QR Code</h3>
          <div id="qr-reader" style={{ width: '100%', height: '300px' }}></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            <button className="qr-btn" onClick={closeQRScanner} style={{ padding: '10px 14px', borderRadius: 6, background: '#999', color: '#fff', border: 'none', cursor: 'pointer' }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
