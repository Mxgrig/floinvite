/**
 * SessionResumePage Component
 * Resume an inactive session with password re-entry
 */

import { useState } from 'react';
import { LoopingVideo } from './LoopingVideo';
import './AuthPage.css';

interface SessionResumePageProps {
  onLoginSuccess: () => void;
  onNavigate: (page: string) => void;
  userEmail?: string;
}

export function SessionResumePage({
  onLoginSuccess,
  onNavigate,
  userEmail = 'user@company.com',
}: SessionResumePageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    // Simulate password verification
    setTimeout(() => {
      onLoginSuccess();
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-page">
      <LoopingVideo source="/sessionlogin.mp4" fallbackColor="#0b1220" />

      <div className="auth-overlay"></div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-brand">
            <img src="/logo.png" alt="Floinvite" className="auth-logo" />
            <span className="auth-brand-name">Floinvite</span>
          </div>

          <h1 className="auth-title">Resume Session</h1>

          <p className="auth-subtitle">
            Your session has expired due to inactivity. Enter your password to continue.
          </p>

          <div className="session-user-info">
            <p className="session-user-email">{userEmail}</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                disabled={loading}
                autoFocus
                style={{ color: '#ffffff' }}
              />
            </div>

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={loading}
            >
              {loading ? 'Resuming...' : 'Resume Session'}
            </button>
          </form>

          <button
            className="auth-link"
            onClick={() => onNavigate('signin')}
          >
            Sign in as different user
          </button>

          <div className="auth-footer">
            <span className="auth-footer-text">For your security, we logged you out after 15 minutes of inactivity.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
