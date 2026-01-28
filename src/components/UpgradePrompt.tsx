/**
 * Upgrade Prompt Modal
 * Appears when user exceeds free tier limits (20 hosts/people)
 */

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { UsageTracker } from '../utils/usageTracker';
import { PaymentService } from '../services/paymentService';
import './UpgradePrompt.css';

interface UpgradePromptProps {
  onClose?: () => void;
  onUpgrade?: (tier: 'starter' | 'compliance') => void;
}

export const UpgradePrompt = ({ onClose, onUpgrade }: UpgradePromptProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'compliance' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const usage = UsageTracker.getUsage();
  const percentage = UsageTracker.getUsagePercentage();

  const handleUpgrade = async (tier: 'starter' | 'compliance') => {
    setLoading(true);
    setSelectedPlan(tier);
    setErrorMessage(null);

    try {
      // Both Starter and Compliance+ require Stripe payment
      // Redirect to Stripe checkout for payment processing
      await PaymentService.createCheckoutSession(tier, 'month');
      // Will redirect to Stripe checkout
    } catch (error) {
      console.error('Upgrade failed:', error);
      setErrorMessage('Failed to initiate checkout. Please try again.');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleDismiss = () => {
    // Do NOT allow dismissal when over limit
    // User must choose a plan
    setErrorMessage('You must choose a plan to continue using Floinvite.');
  };

  return (
    <div className="upgrade-prompt-overlay">
      <div className="upgrade-prompt-modal">
        {/* Close Button - Disabled to enforce payment */}
        <button
          className="upgrade-prompt-close"
          onClick={handleDismiss}
          title="You must choose a plan to continue"
          disabled
        >
          <X size={24} />
        </button>

        {/* Icon */}
        <div className="upgrade-prompt-icon">
          <AlertTriangle size={48} />
        </div>

        {/* Title */}
        <h2 className="upgrade-prompt-title">Free Limit Reached</h2>

        {/* Message */}
        <p className="upgrade-prompt-message">
          You've reached your free limit of {usage.hostsLimit} hosts/people. Continue on Starter for $29/month, or upgrade to Compliance+ for $49/month.
        </p>

        {/* Usage Bar */}
        <div className="usage-bar-container">
          <div className="usage-bar">
            <div className="usage-bar-fill" style={{ width: `${Math.min(100, percentage)}%` }}></div>
          </div>
          <p className="usage-text">
            {usage.totalHosts + usage.totalVisitors} / {usage.hostsLimit} used ({percentage}%)
          </p>
        </div>
        {errorMessage && <p className="upgrade-prompt-error">{errorMessage}</p>}

        {/* Plan Comparison */}
        <div className="plan-comparison">
          <div className="plan-card current">
            <h3>Starter (Continue)</h3>
            <p className="plan-price">$29<span>/month</span></p>
            <p className="plan-subtitle">Everything you need</p>
            <ul className="plan-features">
              <li>Unlimited check-ins</li>
              <li>Email notifications</li>
              <li>Access logbook & search</li>
              <li>90-day data exports</li>
            </ul>
          </div>

          <div className="plan-card upgrade">
            <h3>Compliance+ (Optional)</h3>
            <p className="plan-price">$49<span>/month</span></p>
            <p className="plan-subtitle">Audit-ready + retention</p>
            <ul className="plan-features">
              <li>7-year record retention</li>
              <li>Automatic daily backups</li>
              <li>Full history exports</li>
              <li>Audit-ready reports</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>

        {/* CTA Buttons - User MUST choose a plan */}
        <div className="upgrade-prompt-buttons">
          <button
            className="btn-primary"
            onClick={() => handleUpgrade('starter')}
            disabled={loading || selectedPlan !== null}
          >
            {loading && selectedPlan === 'starter' ? 'Processing...' : 'Pay $29/mo (Starter)'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleUpgrade('compliance')}
            disabled={loading || selectedPlan !== null}
          >
            {loading && selectedPlan === 'compliance' ? 'Processing...' : 'Pay $49/mo (Compliance+)'}
          </button>
        </div>

        {/* Footer Note */}
        <p className="upgrade-prompt-note">
          Select Starter ($29/mo) to continue, or Compliance+ ($49/mo) for audit-ready features with 7-year retention. Cancel anytime.
        </p>
      </div>
    </div>
  );
};
