import React, { useState } from 'react';
import { User, Lock, ArrowRight, UserPlus, TrendingUp } from 'lucide-react';
import { API_BASE } from '../utils/format';

const LoginPage = ({ onLogin }) => {
  const [mode,     setMode]     = useState('login');   // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      if (password.length < 4)  { setError('Password must be at least 4 characters.'); return; }
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Something went wrong.');
        return;
      }
      // On success both login & register return the username
      onLogin(data.username);
    } catch {
      setError('Cannot connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirm('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="brand-icon">
            <TrendingUp size={28} color="#00f0ff" />
          </div>
          <h1 className="brand-title">StockVista</h1>
          <p className="brand-sub">Indian Stock Market Portfolio Manager</p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => mode !== 'login' && switchMode()}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => mode !== 'register' && switchMode()}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Username */}
          <div className="input-group">
            <User className="input-icon" size={18} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="glass-input"
              autoFocus
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <Lock className="input-icon" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="glass-input"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Confirm password (register only) */}
          {mode === 'register' && (
            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="glass-input"
                autoComplete="new-password"
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-spinner" />
            ) : mode === 'login' ? (
              <><ArrowRight size={18} /> Sign In</>
            ) : (
              <><UserPlus size={18} /> Create Account</>
            )}
          </button>
        </form>

        {/* Demo hint (login mode only) */}
        {mode === 'login' && (
          <div className="demo-credentials">
            <p>Demo Accounts</p>
            <div className="creds-list">
              {['user1 / pass1', 'user2 / pass2', 'user3 / pass3'].map(c => (
                <button
                  key={c}
                  className="cred-chip"
                  onClick={() => {
                    const [u, p] = c.split(' / ');
                    setUsername(u); setPassword(p); setError('');
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse at 20% 50%, rgba(0,240,255,0.05) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 20%, rgba(189,0,255,0.05) 0%, transparent 60%),
                      #0a0e17;
          color: white;
          font-family: 'Inter', sans-serif;
          padding: 1rem;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(16, 20, 35, 0.95);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 24px 60px rgba(0,0,0,0.5);
          backdrop-filter: blur(20px);
        }

        .login-brand {
          text-align: center;
          margin-bottom: 2rem;
        }
        .brand-icon {
          width: 60px; height: 60px; margin: 0 auto 12px;
          background: linear-gradient(135deg, rgba(0,240,255,0.12), rgba(189,0,255,0.12));
          border: 1px solid rgba(0,240,255,0.2);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
        }
        .brand-title {
          font-size: 1.8rem; font-weight: 800; margin: 0 0 4px;
          background: linear-gradient(135deg, #00f0ff, #bd00ff);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .brand-sub {
          color: rgba(255,255,255,0.4); font-size: 0.82rem; margin: 0;
        }

        /* Tabs */
        .auth-tabs {
          display: flex; gap: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 1.5rem;
        }
        .auth-tab {
          flex: 1; padding: 8px;
          border: none; border-radius: 7px;
          background: transparent;
          color: rgba(255,255,255,0.45);
          font-size: 0.88rem; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .auth-tab.active {
          background: rgba(0,240,255,0.1);
          color: #00f0ff;
          font-weight: 700;
        }

        /* Form */
        .login-form { display: flex; flex-direction: column; gap: 1rem; }

        .input-group { position: relative; }
        .input-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%); color: rgba(255,255,255,0.3);
          pointer-events: none;
        }
        .glass-input {
          width: 100%; padding: 12px 12px 12px 42px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: white; font-size: 0.95rem;
          outline: none; transition: all 0.2s;
          box-sizing: border-box;
        }
        .glass-input:focus {
          border-color: #00f0ff;
          background: rgba(0,240,255,0.04);
          box-shadow: 0 0 14px rgba(0,240,255,0.15);
        }
        .glass-input::placeholder { color: rgba(255,255,255,0.25); }

        .error-message {
          color: #ff6b6b; font-size: 0.85rem; text-align: center;
          background: rgba(255,107,107,0.08);
          border: 1px solid rgba(255,107,107,0.2);
          padding: 8px 12px; border-radius: 8px;
        }

        .login-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(135deg, #00f0ff, #bd00ff);
          border: none; border-radius: 10px;
          color: #000; font-weight: 700; font-size: 0.95rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s; margin-top: 4px;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(0,240,255,0.25);
        }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Demo */
        .demo-credentials {
          margin-top: 1.5rem; padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          text-align: center;
        }
        .demo-credentials p {
          font-size: 0.72rem; color: rgba(255,255,255,0.3);
          text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;
        }
        .creds-list { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
        .cred-chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 4px 10px;
          color: rgba(255,255,255,0.5); font-size: 0.75rem;
          cursor: pointer; transition: all 0.15s;
        }
        .cred-chip:hover {
          border-color: rgba(0,240,255,0.3);
          color: #00f0ff;
          background: rgba(0,240,255,0.05);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
