/**
 * Sign In Page
 * Simple page with video background and sign-in form
 */

import { useState } from 'react';
import './SignInPage.css';
import { LoopingVideo } from './LoopingVideo';

interface SignInPageProps {
  onLoginSuccess: () => void;
  onNavigate?: (page: string) => void;
  onLoginSuccessNavigate?: (page: string) => void;
  currentPage?: string;
}

export function SignInPage({ onLoginSuccess, onNavigate, onLoginSuccessNavigate, currentPage = 'landing' }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNavClick = (link: string) => {
    if (onNavigate) {
      onNavigate(link);
    }
  };

  const hashPassword = (pwd: string): string => {
    return btoa(pwd);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 300));

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
        onLoginSuccess();
        if (onLoginSuccessNavigate) {
          onLoginSuccessNavigate(currentPage === 'check-in' ? 'check-in' : 'hosts');
        }
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err) {
      setError('Sign in failed. Please try again.');
    }

    setLoading(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset account? You will need to create a new account.')) {
      localStorage.removeItem('user_account');
      localStorage.removeItem('current_user');
      localStorage.removeItem('auth_token');
      setEmail('');
      setPassword('');
      setError('');
    }
  };

  return (
    <div className="signin-page">
      {/* Background Video */}
      <LoopingVideo source="/login.mp4" />
      <div className="signin-background" />

      {/* Sign In Card */}
      <div className="signin-card">
        {/* Logo and Title */}
        <div className="signin-header">
          <button
            className="signin-logo-button"
            onClick={() => handleNavClick('landing')}
            type="button"
            title="Back to home"
          >
            <div className="signin-logo">
              <img src="/logo.png" alt="floinvite" />
            </div>
          </button>

          <h1 className="signin-title">
            <span className="brand-blue">flo</span><span className="brand-green">invite</span>
          </h1>
        </div>
        <p className="signin-subtitle">Visitor Management</p>

        {/* Welcome Message */}
        <p className="signin-message">Welcome back! Sign in to continue</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="signin-form">
          {/* Email Input */}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="signin-input"
            autoFocus
            disabled={loading}
            autoComplete="email"
          />

          {/* Password Input */}
          <div className="password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="signin-input"
              disabled={loading}
              autoComplete="current-password"
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
          {error && <p className="signin-error">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="signin-button"
            disabled={loading || !email || !password}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Links */}
        <button
          type="button"
          className="signin-link"
          onClick={() => handleNavClick('landing')}
        >
          New here? Create account
        </button>

        <button
          type="button"
          className="signin-link signin-link-secondary"
          onClick={handleReset}
        >
          Forgot password? Reset account
        </button>

        {/* Footer */}
        <p className="signin-footer">
          Secure login • Password protected
        </p>
      </div>
    </div>
  );
}
