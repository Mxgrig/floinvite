/**
 * CreateAccountPage Component
 * User registration with full account details
 */

import { useState } from 'react';
import { LoopingVideo } from './LoopingVideo';
import './AuthPage.css';

interface CreateAccountPageProps {
  onLoginSuccess: () => void;
  onNavigate: (page: string) => void;
  onLoginSuccessNavigate?: (page: string) => void;
  selectedTier?: 'starter' | 'professional' | null;
  setUserTier?: (tier: 'starter' | 'professional' | 'enterprise') => void;
  currentPage?: string;
}

export function CreateAccountPage({
  onLoginSuccess,
  onNavigate,
  onLoginSuccessNavigate,
  selectedTier = 'starter',
  setUserTier,
}: CreateAccountPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password || !confirmPassword || !company) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the terms of service');
      setLoading(false);
      return;
    }

    // Simulate account creation
    setTimeout(() => {
      // Store account data
      localStorage.setItem('floinvite_account', JSON.stringify({
        email,
        company,
        phone,
        tier: selectedTier,
        createdAt: new Date().toISOString(),
      }));

      // Set user tier based on selection
      if (setUserTier) {
        setUserTier(selectedTier as 'starter' | 'professional');
      }

      onLoginSuccess();
      onLoginSuccessNavigate?.('settings');
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
            <img src="/xmas-logo.png" alt="floinvite" className="auth-logo" />
            <span className="auth-brand-name brand-wordmark">
              <span className="brand-wordmark-flo">flo</span>
              <span className="brand-wordmark-invite">invite</span>
            </span>
          </button>

          <h1 className="auth-title">Get Started</h1>

          <p className="auth-subtitle">
            Create your account to manage visitor check-ins
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address *</label>
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
              <label htmlFor="company" className="form-label">Company Name *</label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Your company"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password *</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-checkbox">
              <input
                id="termsAccepted"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="checkbox-input"
                disabled={loading}
              />
              <label htmlFor="termsAccepted" className="checkbox-label">
                I accept the terms of service
              </label>
            </div>

            <button
              type="submit"
              className="auth-button auth-button-primary"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <span className="auth-footer-text">Already have an account?</span>
            <button
              className="auth-footer-link"
              onClick={() => onNavigate('signin')}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
