/**
 * Login Component
 * Simple password-based authentication
 * Protects all tiers
 */

import { useState } from 'react';
import './Login.css';

export function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Check if password hash exists in localStorage to determine setup status
  const [isSetup, setIsSetup] = useState(() => {
    return !!localStorage.getItem('app_password_hash');
  });

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

    if (!isSetup) {
      // First time setup - set password
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        setLoading(false);
        return;
      }

      try {
        const hash = hashPassword(password);
        localStorage.setItem('app_password_hash', hash);
        setIsSetup(true);
        onLoginSuccess();
      } catch (err) {
        setError('Failed to set password. Please try again.');
      }
    } else {
      // Verify existing password
      const savedHash = localStorage.getItem('app_password_hash');
      const hash = hashPassword(password);

      if (hash === savedHash) {
        onLoginSuccess();
      } else {
        setError('Incorrect password');
      }
    }

    setLoading(false);
  };

  const handleReset = () => {
    if (window.confirm('Reset password? You will need to set a new password.')) {
      localStorage.removeItem('app_password_hash');
      localStorage.removeItem('auth_token');
      setIsSetup(false);
      setPassword('');
      setError('');
    }
  };

  return (
    <div className="login-container">
      {/* Background Image with Overlay */}
      <div className="login-background" />

      {/* Login Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img src="/logo.png" alt="floinvite" />
        </div>

        {/* Title */}
        <h1 className="login-title">floinvite</h1>
        <p className="login-subtitle">Visitor Management</p>

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Password Input */}
          <div className="password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={isSetup ? 'Enter password' : 'Set password (min. 4 characters)'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="login-input"
              autoFocus
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
          {error && <p className="login-error">{error}</p>}

          {/* Sign In Button */}
          <button
            type="submit"
            className="login-button"
            disabled={loading || !password}
          >
            {loading ? 'Loading...' : isSetup ? 'Sign In' : 'Set Password'}
          </button>
        </form>

        {/* Reset Password Link */}
        {isSetup && (
          <button
            type="button"
            className="login-reset"
            onClick={handleReset}
          >
            Reset Password
          </button>
        )}

        {/* Footer */}
        <p className="login-footer">
          {isSetup ? 'Password protected' : 'Set up your password'}
        </p>
      </div>
    </div>
  );
}
