/**
 * Create Account Page
 * Simple page with video background and create account form
 */

import { useState } from 'react';
import './CreateAccountPage.css';
import { LoopingVideo } from './LoopingVideo';

interface CreateAccountPageProps {
  onLoginSuccess: () => void;
  onNavigate?: (page: string) => void;
  onLoginSuccessNavigate?: (page: string) => void;
  currentPage?: string;
}

export function CreateAccountPage({ onLoginSuccess, onNavigate, onLoginSuccessNavigate, currentPage = 'landing' }: CreateAccountPageProps) {
  const [name, setName] = useState('');
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
      onLoginSuccess();
      if (onLoginSuccessNavigate) {
        onLoginSuccessNavigate(currentPage === 'check-in' ? 'check-in' : 'hosts');
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="createaccount-page">
      {/* Background Video */}
      <LoopingVideo source="/login.mp4" />
      <div className="createaccount-background" />

      {/* Create Account Card */}
      <div className="createaccount-card">
        {/* Logo and Title */}
        <div className="createaccount-header">
          <button
            className="createaccount-logo-button"
            onClick={() => handleNavClick('landing')}
            type="button"
            title="Back to home"
          >
            <div className="createaccount-logo">
              <img src="/logo.png" alt="floinvite" />
            </div>
          </button>

          <h1 className="createaccount-title">
            <span className="brand-blue">flo</span><span className="brand-green">invite</span>
          </h1>
        </div>
        <p className="createaccount-subtitle">Visitor Management</p>

        {/* Welcome Message */}
        <p className="createaccount-message">Create your account to get started</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="createaccount-form">
          {/* Name Input */}
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            className="createaccount-input"
            autoFocus
            disabled={loading}
            autoComplete="name"
          />

          {/* Email Input */}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            className="createaccount-input"
            disabled={loading}
            autoComplete="email"
          />

          {/* Password Input */}
          <div className="password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password (6+ characters)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="createaccount-input"
              disabled={loading}
              autoComplete="new-password"
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
          {error && <p className="createaccount-error">{error}</p>}

          {/* Password Requirement */}
          {!error && (
            <p className="createaccount-requirement">
              Minimum 6 characters for security
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="createaccount-button"
            disabled={loading || !name || !email || !password}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Links */}
        <button
          type="button"
          className="createaccount-link"
          onClick={() => handleNavClick('landing')}
        >
          Already have an account? Sign in
        </button>

        {/* Footer */}
        <p className="createaccount-footer">
          Secure login • Password protected
        </p>
      </div>
    </div>
  );
}
