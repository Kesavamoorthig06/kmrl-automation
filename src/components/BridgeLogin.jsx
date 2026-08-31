import React, { useEffect, useState } from 'react';

/**
 * BridgeLogin — WhatsApp bridge-auth page using the same KMRL Login UI
 * (blurred metro background, header bar, teal card) but stripped to just
 * Employee ID + Password.  On success creates a WhatsApp session so the
 * chatbot becomes authenticated.
 */
export default function BridgeLogin() {
  const [token, setToken] = useState(null);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // ── Read ?token= from URL on mount ─────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    if (t) setToken(t);
  }, []);

  // ── Derive the WhatsApp bot API base URL ───────────────────────
  const apiBase =
    import.meta.env.VITE_BRIDGE_API_URL ||
    window.__BRIDGE_API_URL__ ||
    `${window.location.protocol}//${window.location.hostname}:8300`;

  function showMessage(text, type) {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage({ text: '', type: '' }), 4000);
  }

  // ── Submit credentials ─────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!employeeId.trim() || !password.trim()) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/bridge/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, employee_id: employeeId.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        showMessage(data.error || 'Invalid credentials. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Bridge login error:', err);
      showMessage('Network error — could not reach the server.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // ── CSS — same as Login.jsx ────────────────────────────────────
  const css = `
    * { box-sizing: border-box; }
    html,body { height:100%; margin:0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }

    .bg { position: fixed; inset: 0; background: center/cover no-repeat url('/bg_kmrl.jpg'); filter: grayscale(70%) brightness(80%) blur(2px); z-index: 0; }
    .bg::after { content: ""; position: absolute; inset:0; background: rgba(0,0,0,0.25); }

    .header { position: relative; z-index: 3; height: 88px; background: linear-gradient(180deg,#0b4aa1,#083a86); display:flex; align-items:center; justify-content:center; padding: 0 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.25); }
    .header .brand { display:flex; flex-direction:column; align-items:center; text-align:center; }
    .header .logo { width:48px; height:36px; object-fit:contain; margin-bottom:6px; }
    .header h1 { margin:0; color:#fff; font-size:22px; letter-spacing:1px; font-weight:700; }

    .page { position:relative; z-index:2; min-height: calc(100vh - 88px); display:flex; align-items:center; justify-content:center; padding: 24px; }

    .card { width: 360px; max-width: calc(100% - 48px); background: linear-gradient(180deg, rgba(13,138,199,0.96), rgba(9,133,175,0.95)); border-radius: 28px; padding: 28px 26px; box-shadow: 0 18px 40px rgba(4,26,46,0.45); color: #fff; display:flex; flex-direction:column; gap:16px; align-items:stretch; backdrop-filter: blur(3px); }
    .form-title { font-size: 22px; font-weight:700; text-align:center; margin: 8px 0 4px; }
    .input-group { display:flex; flex-direction:column; gap:8px; }
    label { font-weight:600; font-size:14px; color: rgba(255,255,255,0.95); margin-left:2px; }
    .required::after { content: " *"; color:#ff7b7b; font-weight:800; }
    input[type="text"], input[type="password"] { width:100%; padding:14px 16px; border-radius:12px; border: none; background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.98); font-size:15px; outline:none; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
    input::placeholder { color: rgba(255,255,255,0.7); font-weight:400; }
    .submit-btn { margin-top:6px; padding:14px 18px; border-radius: 18px; border:none; font-weight:700; font-size:16px; cursor:pointer; color:white; background: linear-gradient(90deg,#0f6b51,#0b5346); box-shadow: 0 8px 24px rgba(11,83,70,0.34); }
    .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .status-message { display:none; padding:10px 12px; border-radius:10px; font-weight:600; text-align:center; margin-bottom:4px; }
    .status-message.success { background: rgba(255,255,255,0.08); color:#e6ffef; display:block; }
    .status-message.error { background: rgba(255,255,255,0.08); color:#ffdede; display:block; }
    .footer { position:fixed; bottom:16px; left:0; right:0; text-align:center; color:rgba(255,255,255,0.9); font-size:12px; z-index:2; pointer-events:none; }

    .whatsapp-badge { display:inline-flex; align-items:center; gap:6px; background: rgba(255,255,255,0.12); padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 4px; }

    .success-card { text-align:center; gap: 18px; }
    .success-check { font-size: 52px; margin-bottom: 4px; color: #e6ffef; }
    .success-info { background: rgba(255,255,255,0.12); border-radius: 14px; padding: 16px 20px; text-align: left; }
    .success-info p { margin: 5px 0; font-size: 14px; color: rgba(255,255,255,0.95); }
    .success-info strong { font-weight: 700; }
    .success-divider { width: 60%; height: 1px; background: rgba(255,255,255,0.2); margin: 4px auto; }
    .success-return { font-size: 14px; line-height: 1.7; color: rgba(255,255,255,0.95); text-align: center; margin: 0; }
    .whatsapp-hint { display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 18px; border-radius:12px; background:rgba(255,255,255,0.15); font-size:14px; font-weight:600; color:#fff; cursor:pointer; text-decoration:none; }

    .invalid-card { text-align:center; gap: 12px; }
    .invalid-icon { font-size: 48px; color: #fbbf24; }

    @media (min-width: 900px) { .card { width:420px; padding:36px; border-radius:26px; } .header { height:110px; } .header .logo { width:60px; height:44px; } .form-title { font-size:26px; } }
    @media (max-width:420px) { .card { width:100%; padding:20px; border-radius:18px; } .header { height:78px; } }
  `;

  // ── No token → invalid access page ─────────────────────────────
  if (!token) {
    return (
      <div>
        <style>{css}</style>
        <div className="bg" aria-hidden="true"></div>
        <header className="header" role="banner">
          <div className="brand">
            <img src="/metro-logo.png" alt="KMRL" className="logo" />
            <h1>KMRL METRO</h1>
          </div>
        </header>
        <main className="page" role="main">
          <div className="card invalid-card">
            <div className="invalid-icon">&#9888;</div>
            <div className="form-title">Invalid Link</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
              This page can only be accessed via<br />the WhatsApp login link.<br /><br />
              Send <strong>"login"</strong> in WhatsApp<br />to get a new link.
            </p>
          </div>
        </main>
        <div className="footer">© 2025 Kochi Metro Rail Limited. All rights reserved.</div>
      </div>
    );
  }

  // ── Success state ──────────────────────────────────────────────
  if (result) {
    return (
      <div>
        <style>{css}</style>
        <div className="bg" aria-hidden="true"></div>
        <header className="header" role="banner">
          <div className="brand">
            <img src="/metro-logo.png" alt="KMRL" className="logo" />
            <h1>KMRL METRO</h1>
          </div>
        </header>
        <main className="page" role="main">
          <div className="card success-card">
            <div className="success-check">&#10004;</div>
            <div className="form-title">Login Successful!</div>
            <div className="success-info">
              <p><strong>Name:</strong> {result.name}</p>
              <p><strong>ID:</strong> {result.employee_id}</p>
              <p><strong>Role:</strong> {result.role}</p>
            </div>
            <div className="success-divider"></div>
            <p className="success-return">
              Your WhatsApp session is now active.<br />
              <strong>Return to WhatsApp</strong> and send any message.
            </p>
            <a href="https://wa.me/" className="whatsapp-hint" target="_blank" rel="noopener noreferrer">
              <span style={{ fontSize: 20 }}>💬</span>
              <span>Open WhatsApp</span>
            </a>
          </div>
        </main>
        <div className="footer">© 2025 Kochi Metro Rail Limited. All rights reserved.</div>
      </div>
    );
  }

  // ── Login form (same layout as Login.jsx, no QR row) ───────────
  return (
    <div>
      <style>{css}</style>
      <div className="bg" aria-hidden="true"></div>

      <header className="header" role="banner">
        <div className="brand">
          <img src="/metro-logo.png" alt="KMRL" className="logo" />
          <h1>KMRL METRO</h1>
        </div>
      </header>

      <main className="page" role="main">
        <form className="card" onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div className="form-title">Employee Login</div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="whatsapp-badge">
              <span>💬</span> WhatsApp Authentication
            </div>
          </div>

          {statusMessage.text && (
            <div className={`status-message ${statusMessage.type}`} style={{ display: 'block' }}>
              {statusMessage.text}
            </div>
          )}

          <div className="input-group">
            <label className="required">Employee ID</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. KMRL-1001"
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="input-group">
            <label className="required">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="off"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Authenticate'}
          </button>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center', margin: '4px 0 0' }}>
            Link expires in 5 minutes
          </p>
        </form>
      </main>

      <div className="footer">© 2025 Kochi Metro Rail Limited. All rights reserved.</div>
    </div>
  );
}
