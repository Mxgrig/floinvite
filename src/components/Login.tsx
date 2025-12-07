/**
 * Login Component
 * Simple password-based authentication
 * Protects all tiers
 * Features: Password setup/verification, video background with looping
 */

import { useState } from 'react';
import './Login.css';
import { LoopingVideo } from './LoopingVideo';

interface LoginProps {
  onLoginSuccess: () => void;
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

export function Login({ onLoginSuccess, onNavigate, currentPage = 'landing' }: LoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Check if password hash exists in localStorage to determine setup status
  const [isSetup] = useState(() => {
    return !!localStorage.getItem('app_password_hash');
  });
  // Allow user to explicitly choose flow (override auto-detection)
  const [userFlow, setUserFlow] = useState<'new' | 'returning' | null>(isSetup ? 'returning' : null);

  const handleNavClick = (link: string) => {
    if (onNavigate) {
      onNavigate(link);
    }
  };

  const hashPassword = (pwd: string): string => {
    // Simple hash for Phase 1 (not production-grade)
    return btoa(pwd);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    if (userFlow === 'new') {
      // New user: create password
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        setLoading(false);
        return;
      }

      try {
        const hash = hashPassword(password);
        localStorage.setItem('app_password_hash', hash);
        onLoginSuccess();
      } catch (err) {
        setError('Failed to set password. Please try again.');
      }
    } else if (userFlow === 'returning') {
      // Returning user: verify password
      const savedHash = localStorage.getItem('app_password_hash');
      const hash = hashPassword(password);

      if (hash === savedHash) {
        onLoginSuccess();
      } else {
        setError('Incorrect password. Please try again.');
      }
    }

    setLoading(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset password? You will need to create a new password.')) {
      localStorage.removeItem('app_password_hash');
      localStorage.removeItem('auth_token');
      setUserFlow('new');
      setPassword('');
      setError('');
    }
  };

  // Show choice screen if user hasn't selected a flow
  if (userFlow === null) {
    return (
      <div className="login-container">
        {/* Navigation Bar */}
        <nav className="login-navbar">
          <div className="login-navbar-content">
            {/* Logo & Brand */}
            <button className="login-navbar-brand" onClick={() => handleNavClick('landing')}>
              <div className="login-navbar-logo">
                <img src="/logo.png" alt="floinvite" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>floinvite</span>
            </button>

            {/* Navigation Links */}
            <div className="login-navbar-links">
              <button className={`login-navbar-link ${currentPage === 'pricing' ? 'active' : ''}`} onClick={() => handleNavClick('pricing')}>
                Pricing
              </button>
              <button className={`login-navbar-link ${currentPage === 'features' ? 'active' : ''}`} onClick={() => handleNavClick('features')}>
                Features
              </button>
              <button className={`login-navbar-link ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => handleNavClick('contact')}>
                Contact
              </button>
            </div>
          </div>
        </nav>

        {/* Background Video with Overlay */}
        <LoopingVideo source="/login.mp4" />
        <div className="login-background" />

        {/* Two Column Layout */}
        <div className="login-content">
          {/* Left: Product Info */}
          <div className="login-left">
            <div className="product-info">
              <h2 className="product-headline">Visitor Management That Just Works</h2>
              <p className="product-description">
                Check in guests, notify hosts, and track visitors in seconds. No hardware. No training. No hassle.
              </p>

              <div className="product-features">
                <div className="feature">
                  <div className="feature-title">30-second check-ins</div>
                  <p>Walk-ins and expected visitors processed instantly</p>
                </div>
                <div className="feature">
                  <div className="feature-title">Instant host alerts</div>
                  <p>Email notifications sent automatically on arrival</p>
                </div>
                <div className="feature">
                  <div className="feature-title">Complete records</div>
                  <p>Searchable logbook with CSV/JSON exports</p>
                </div>
                <div className="feature">
                  <div className="feature-title">Works offline</div>
                  <p>Check-in works without internet connection</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="login-right">
            <div className="login-card">
              {/* Logo */}
              <button
                className="login-logo-button"
                onClick={() => setUserFlow(null)}
                type="button"
                title="Back to choices"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '0.5rem'
                }}
              >
                <div className="login-logo">
                  <img src="/logo.png" alt="floinvite" />
                </div>
              </button>

              {/* Title */}
              <h1 className="login-title">floinvite</h1>
              <p className="login-subtitle">Visitor Management</p>

              {/* Choice Buttons */}
              <div className="login-choices">
                <button
                  className="login-choice-button login-choice-primary"
                  onClick={() => setUserFlow('new')}
                  disabled={loading}
                >
                  <div className="choice-label">First Time?</div>
                  <div className="choice-desc">Create a password</div>
                </button>
                <button
                  className="login-choice-button login-choice-secondary"
                  onClick={() => setUserFlow('returning')}
                  disabled={loading}
                >
                  <div className="choice-label">Returning?</div>
                  <div className="choice-desc">Sign in</div>
                </button>
              </div>

              {/* Footer */}
              <p className="login-footer">
                Secure login • Password protected
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login form for selected flow
  return (
    <div className="login-container">
      {/* Navigation Bar */}
      <nav className="login-navbar">
        <div className="login-navbar-content">
          {/* Logo & Brand */}
          <button className="login-navbar-brand" onClick={() => handleNavClick('landing')}>
            <div className="login-navbar-logo">
              <img src="/logo.png" alt="floinvite" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>floinvite</span>
          </button>

          {/* Navigation Links */}
          <div className="login-navbar-links">
            <button className={`login-navbar-link ${currentPage === 'pricing' ? 'active' : ''}`} onClick={() => handleNavClick('pricing')}>
              Pricing
            </button>
            <button className={`login-navbar-link ${currentPage === 'features' ? 'active' : ''}`} onClick={() => handleNavClick('features')}>
              Features
            </button>
            <button className={`login-navbar-link ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => handleNavClick('contact')}>
              Contact
            </button>
          </div>
        </div>
      </nav>

      {/* Background Video with Overlay */}
      <LoopingVideo source="/login.mp4" />
      <div className="login-background" />

      {/* Login Card */}
      <div className="login-card">
        {/* Logo */}
        <button
          className="login-logo-button"
          onClick={() => {
            setUserFlow(null);
            setPassword('');
            setError('');
          }}
          type="button"
          title="Back to choices"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}
        >
          <div className="login-logo">
            <img src="/logo.png" alt="floinvite" />
          </div>
        </button>

        {/* Title */}
        <h1 className="login-title">floinvite</h1>
        <p className="login-subtitle">Visitor Management</p>

        {/* Welcome Message */}
        <p className="login-message">
          {userFlow === 'new'
            ? 'Create a password to secure your account'
            : 'Welcome back! Enter your password to continue'
          }
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Password Input */}
          <div className="password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={userFlow === 'new' ? 'Create a password (4+ characters)' : 'Enter your password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="login-input"
              autoFocus
              disabled={loading}
              autoComplete={userFlow === 'new' ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              tabIndex={-1}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          {/* Error Message */}
          {error && <p className="login-error">{error}</p>}

          {/* Password Requirements for new users */}
          {userFlow === 'new' && !error && (
            <p className="login-requirement">
              Minimum 4 characters for security
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading || !password}
          >
            {loading ? 'Processing...' : userFlow === 'new' ? 'Create Password' : 'Sign In'}
          </button>
        </form>

        {/* Change Option Link */}
        <button
          type="button"
          className="login-reset"
          onClick={() => {
            setUserFlow(null);
            setPassword('');
            setError('');
          }}
        >
          {userFlow === 'new' ? 'Already have a password? Sign in' : 'First time? Create password'}
        </button>

        {/* Password Reset - Only for returning users */}
        {userFlow === 'returning' && (
          <button
            type="button"
            className="login-reset login-reset-secondary"
            onClick={handleReset}
          >
            Forgot password? Reset
          </button>
        )}

        {/* Footer */}
        <p className="login-footer">
          Secure login • Password protected
        </p>
      </div>
    </div>
  );
}
