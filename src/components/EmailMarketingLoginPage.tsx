/**
 * Email Marketing Login Page
 * Separate login for email marketing admin
 * Uses video background and simple password-only authentication
 */

import { useState } from 'react';
import { getLogoPath } from '../utils/logoHelper';
import { LoopingVideo } from './LoopingVideo';
import './AuthPage.css';

interface EmailMarketingLoginPageProps {
  onLoginSuccess: () => void;
  onNavigate: (page: string) => void;
}

export function EmailMarketingLoginPage({
  onLoginSuccess,
  onNavigate,
}: EmailMarketingLoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!password) {
      setError('Please enter your password');
      setLoading(false);
      return;
    }

    // Simulate login - accept any password for now
    // In production, this would validate against a backend
    setTimeout(() => {
      localStorage.setItem('floinvite_email_marketing_authenticated', 'true');
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
          <button
            className="auth-brand"
            onClick={() => onNavigate('landing')}
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img src={getLogoPath()} alt="floinvite" className="auth-logo" />
            <span className="auth-brand-name brand-wordmark">
              <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
            </span>
          </button>

          <h1 className="auth-title">Email Marketing</h1>

          <p className="auth-subtitle">
            Admin access to send campaigns
          </p>

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
              />
            </div>

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Access Email Marketing'}
            </button>
          </form>

          <div className="auth-footer">
            <button
              className="auth-footer-link"
              onClick={() => onNavigate('landing')}
              type="button"
              style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailMarketingLoginPage;
