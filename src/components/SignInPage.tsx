/**
 * SignInPage Component
 * User login with email and password
 */

import { useState } from 'react';
import { getLogoPath } from '../utils/logoHelper';
import { LoopingVideo } from './LoopingVideo';
import './AuthPage.css';

interface SignInPageProps {
  onLoginSuccess: () => void;
  onNavigate: (page: string) => void;
  onLoginSuccessNavigate?: (page: string) => void;
  currentPage?: string;
}

export function SignInPage({
  onLoginSuccess,
  onNavigate,
  onLoginSuccessNavigate,
}: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    // Simulate login
    setTimeout(() => {
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('floinvite_remember_email', email);
      }
      localStorage.setItem('floinvite_user_email', email);

      onLoginSuccess();
      onLoginSuccessNavigate?.('logbook');
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-page">
      <LoopingVideo source="/login.mp4" fallbackColor="#0b1220" />

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

          <h1 className="auth-title">Welcome Back</h1>

          <p className="auth-subtitle">
            Sign in to manage your check-ins
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-checkbox">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox-input"
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="checkbox-label">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button
            className="auth-link"
            onClick={() => onNavigate('marketing')}
          >
            Forgot password?
          </button>

          <div className="auth-footer">
            <span className="auth-footer-text">Don't have an account?</span>
            <button
              className="auth-footer-link"
              onClick={() => onNavigate('createaccount')}
            >
              Create one
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
