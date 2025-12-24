/**
 * TierSelectionPage Component
 * Choose between Starter and Professional tier during signup
 * Professional tier redirects to Stripe checkout
 */

import { useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { LoopingVideo } from './LoopingVideo';
import './TierSelectionPage.css';

interface TierSelectionPageProps {
  onTierSelected: (tier: 'starter' | 'professional') => void;
  onNavigate: (page: string) => void;
}

export function TierSelectionPage({ onTierSelected, onNavigate }: TierSelectionPageProps) {
  const [loading, setLoading] = useState(false);

  const handleStarterSelect = () => {
    setLoading(true);
    // Simulate delay
    setTimeout(() => {
      onTierSelected('starter');
      setLoading(false);
    }, 300);
  };

  const handleProfessionalSelect = () => {
    setLoading(true);
    // Both tiers proceed to account creation - no payment required upfront
    setTimeout(() => {
      onTierSelected('professional');
      setLoading(false);
    }, 300);
  };

  const features = {
    shared: [
      { name: 'Unlimited guest check-ins', icon: '✓' },
      { name: 'Host management', icon: '✓' },
      { name: 'Visitor logbook & search', icon: '✓' },
      { name: 'Email notifications', icon: '✓' },
      { name: 'Expected guest lookup', icon: '✓' }
    ],
    professional: [
      { name: 'Returning visitor tracking', icon: '✓' },
      { name: 'SMS & WhatsApp notifications', icon: '✓' },
      { name: 'Cloud backup & export', icon: '✓' },
      { name: 'CSV & JSON export', icon: '✓' },
      { name: 'Email support', icon: '✓' }
    ]
  };

  return (
    <div className="tier-selection-page">
      <LoopingVideo source="/login.mp4" fallbackColor="#0b1220" />
      <div className="tier-overlay"></div>

      <div className="tier-container">
        <div className="tier-header">
          <button
            className="tier-brand"
            onClick={() => onNavigate('landing')}
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img src="/xmas-logo.png" alt="floinvite" className="tier-logo" />
            <span className="tier-brand-name brand-wordmark">
              <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
            </span>
          </button>

          <h1 className="tier-title">Choose Your Plan</h1>
          <p className="tier-subtitle">
            Select the perfect plan for your visitor management needs
          </p>
        </div>

        <div className="tier-cards-grid">
          {/* Starter Tier Card */}
          <div className="tier-card starter">
            <div className="tier-card-header">
              <h2 className="tier-card-name">Starter</h2>
              <div className="tier-card-price">
                <span className="price-amount">$5</span>
                <span className="price-period">/month</span>
              </div>
              <p className="tier-card-description">
                Perfect for small teams
              </p>
            </div>

            <div className="tier-features">
              <h3 className="features-title">Included in Starter</h3>
              <ul className="features-list">
                {features.shared.map((feature, idx) => (
                  <li key={idx} className="feature-item">
                    <span className="feature-icon">✓</span>
                    <span className="feature-name">{feature.name}</span>
                  </li>
                ))}
              </ul>

              <h3 className="features-title locked-title">Professional Only</h3>
              <ul className="features-list locked">
                {features.professional.map((feature, idx) => (
                  <li key={idx} className="feature-item locked">
                    <span className="feature-icon">✗</span>
                    <span className="feature-name">{feature.name}</span>
                  </li>
                ))}
              </ul>

              <div className="tier-usage-limit">
                <p className="usage-limit-text">
                  💡 <strong>Free for the first 20 items</strong><br />
                  <small>Then $5/month after 20 items (includes expected guests)</small>
                </p>
              </div>
            </div>

            <button
              className="tier-button tier-button-secondary"
              onClick={handleStarterSelect}
              disabled={loading}
              type="button"
            >
              {loading ? 'Loading...' : 'Continue with Starter'}
            </button>
          </div>

          {/* Professional Tier Card */}
          <div className="tier-card professional recommended">
            <div className="tier-badge">RECOMMENDED</div>

            <div className="tier-card-header">
              <h2 className="tier-card-name">Professional</h2>
              <div className="tier-card-price">
                <span className="price-amount">$10</span>
                <span className="price-period">/month</span>
              </div>
              <p className="tier-card-description">
                For growing teams & enterprises
              </p>
            </div>

            <div className="tier-features">
              <h3 className="features-title">Everything in Starter, plus</h3>
              <ul className="features-list">
                {features.shared.map((feature, idx) => (
                  <li key={idx} className="feature-item">
                    <span className="feature-icon">✓</span>
                    <span className="feature-name">{feature.name}</span>
                  </li>
                ))}

                {features.professional.map((feature, idx) => (
                  <li key={idx} className="feature-item highlight">
                    <span className="feature-icon highlight">✓</span>
                    <span className="feature-name">{feature.name}</span>
                  </li>
                ))}
              </ul>

              <div className="tier-value-prop">
                <p className="value-prop-text">
                  ⭐ <strong>Unlimited everything</strong><br />
                  <small>No usage limits • Advanced features • Priority support</small>
                </p>
              </div>
            </div>

            <button
              className="tier-button tier-button-primary"
              onClick={handleProfessionalSelect}
              disabled={loading}
              type="button"
            >
              {loading ? 'Loading...' : (
                <>
                  Continue with Professional
                  <ArrowRight size={18} style={{ marginLeft: '8px' }} />
                </>
              )}
            </button>

            <p className="tier-secure-checkout">
              💡 Upgrade anytime in settings if you need more features
            </p>
          </div>
        </div>

        <div className="tier-footer">
          <p className="tier-footer-text">
            Already have an account?
            <button
              className="tier-footer-link"
              onClick={() => onNavigate('signin')}
              type="button"
            >
              Sign in
            </button>
          </p>
          <p className="tier-footer-note">
            Start free with Starter tier. Upgrade to Professional anytime when you need advanced features.
          </p>
        </div>
      </div>
    </div>
  );
}
