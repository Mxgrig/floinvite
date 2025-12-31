/**
 * Login Component
 * Email + Password authentication with Name field
 * Protects all tiers
 * Features: Create account (Name + Email + Password), Sign in (Email + Password)
 */

import { useState } from 'react';
import { getLogoPath } from '../utils/logoHelper';
import './Login.css';
import { LoopingVideo } from './LoopingVideo';

interface LoginProps {
  onLoginSuccess: () => void;
  onNavigate?: (page: string) => void;
  onLoginSuccessNavigate?: (page: string) => void;
  currentPage?: string;
  initialFlow?: 'new' | 'returning';
}

export function Login({ onLoginSuccess, onNavigate, onLoginSuccessNavigate, currentPage = 'landing', initialFlow }: LoginProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Check if user account exists in localStorage
  const [isSetup] = useState(() => {
    return !!localStorage.getItem('user_account');
  });
  // Allow user to explicitly choose flow (override auto-detection)
  // If initialFlow is provided from App, use it; otherwise auto-detect or show choice
  const [userFlow, setUserFlow] = useState<'new' | 'returning' | null>(
    initialFlow ? initialFlow : (isSetup ? 'returning' : null)
  );

  const handleNavClick = (link: string) => {
    if (onNavigate) {
      onNavigate(link);
    }
  };

  const hashPassword = (pwd: string): string => {
    // Simple hash for Phase 1 (not production-grade)
    return btoa(pwd);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate slight delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));

    if (userFlow === 'new') {
      // New user: create account with Name + Email + Password
      if (!name.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }

      if (!email.trim()) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      try {
        const hash = hashPassword(password);
        const userAccount = {
          name: name.trim(),
          email: email.trim(),
          passwordHash: hash,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('user_account', JSON.stringify(userAccount));
        localStorage.setItem('current_user', email.trim());
        localStorage.setItem('floinvite_user_email', email.trim());
        onLoginSuccess();
        if (onLoginSuccessNavigate) {
          // Navigate to the intended page (check-in or logbook)
          onLoginSuccessNavigate(currentPage === 'check-in' ? 'check-in' : 'logbook');
        }
      } catch (err) {
        setError('Failed to create account. Please try again.');
      }
    } else if (userFlow === 'returning') {
      // Returning user: sign in with Email + Password
      if (!email.trim()) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      if (!password) {
        setError('Please enter your password');
        setLoading(false);
        return;
      }

      try {
        const savedAccount = localStorage.getItem('user_account');
        if (!savedAccount) {
          setError('Account not found. Please create an account first.');
          setLoading(false);
          return;
        }

        const account = JSON.parse(savedAccount);
        if (account.email !== email.trim()) {
          setError('Email address not found. Please check and try again.');
          setLoading(false);
          return;
        }

        const hash = hashPassword(password);
        if (hash === account.passwordHash) {
          localStorage.setItem('current_user', email.trim());
          localStorage.setItem('floinvite_user_email', email.trim());
          onLoginSuccess();
          if (onLoginSuccessNavigate) {
            // Navigate to the intended page (check-in or logbook)
            onLoginSuccessNavigate(currentPage === 'check-in' ? 'check-in' : 'logbook');
          }
        } else {
          setError('Incorrect password. Please try again.');
        }
      } catch (err) {
        setError('Sign in failed. Please try again.');
      }
    }

    setLoading(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset account? You will need to create a new account.')) {
      localStorage.removeItem('user_account');
      localStorage.removeItem('current_user');
      localStorage.removeItem('auth_token');
      setUserFlow('new');
      setEmail('');
      setName('');
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
                <img src={getLogoPath()} alt="floinvite" />
              </div>
              <span className="brand-wordmark">
                <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
              </span>
            </button>

            {/* Navigation Links */}
            <div className="login-navbar-links">
              <button className={`login-navbar-link ${currentPage === 'marketing' ? 'active' : ''}`} onClick={() => handleNavClick('marketing')}>
                Learn More
              </button>
              <button className={`login-navbar-link ${currentPage === 'pricing' ? 'active' : ''}`} onClick={() => handleNavClick('pricing')}>
                Pricing
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
                onClick={() => handleNavClick('landing')}
                type="button"
                title="Back to home"
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
                  <img src={getLogoPath()} alt="floinvite" />
                </div>
              </button>

              {/* Title */}
              <h1 className="login-title brand-wordmark">
                <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
              </h1>
              <p className="login-subtitle">Visitor Management</p>

              {/* Choice Buttons */}
              <div className="login-choices">
                <button
                  className="login-choice-button login-choice-primary"
                  onClick={() => setUserFlow('new')}
                  disabled={loading}
                >
                  <div className="choice-label">New User</div>
                  <div className="choice-desc">Create Account</div>
                </button>
                <button
                  className="login-choice-button login-choice-secondary"
                  onClick={() => setUserFlow('returning')}
                  disabled={loading}
                >
                  <div className="choice-label">Existing User</div>
                  <div className="choice-desc">Sign In</div>
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
            {/* Logo and Title on same line */}
            <div className="login-header">
              <button
                className="login-logo-button"
                onClick={() => handleNavClick('landing')}
                type="button"
                title="Back to home"
              >
                <div className="login-logo">
                  <img src={getLogoPath()} alt="floinvite" />
                </div>
              </button>

              {/* Title */}
              <h1 className="login-title brand-wordmark">
                <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
              </h1>
            </div>
            <p className="login-subtitle">Visitor Management</p>

            {/* Welcome Message */}
            <p className="login-message">
              {userFlow === 'new'
                ? 'Create your account to get started'
                : 'Welcome back! Sign in to continue'
              }
            </p>

            {/* Form */}
            <form onSubmit={handleLogin} className="login-form">
              {/* Name Input - Only for new users */}
              {userFlow === 'new' && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError('');
                  }}
                  className="login-input"
                  autoFocus
                  disabled={loading}
                  autoComplete="name"
                />
              )}

              {/* Email Input */}
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="login-input"
                autoFocus={userFlow === 'returning'}
                disabled={loading}
                autoComplete={userFlow === 'new' ? 'email' : 'email'}
              />

              {/* Password Input */}
              <div className="password-input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={userFlow === 'new' ? 'Create a password (6+ characters)' : 'Enter your password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="login-input"
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
                  Minimum 6 characters for security
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="login-button"
                disabled={loading || (userFlow === 'new' ? !name || !email || !password : !email || !password)}
              >
                {loading ? 'Processing...' : userFlow === 'new' ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            {/* Change Option Link */}
            <button
              type="button"
              className="login-reset"
              onClick={() => {
                setUserFlow(null);
                setEmail('');
                setName('');
                setPassword('');
                setError('');
              }}
            >
              {userFlow === 'new' ? 'Already have an account? Sign in' : 'New here? Create account'}
            </button>

            {/* Password Reset - Only for returning users */}
            {userFlow === 'returning' && (
              <button
                type="button"
                className="login-reset login-reset-secondary"
                onClick={handleReset}
              >
                Forgot password? Reset account
              </button>
            )}

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
