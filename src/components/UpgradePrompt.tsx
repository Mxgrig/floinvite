/**
 * Upgrade Prompt Modal
 * Appears when user exceeds free tier limits (20 hosts/visitors)
 */

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { UsageTracker } from '../utils/usageTracker';
import { PaymentService } from '../services/paymentService';
import './UpgradePrompt.css';

interface UpgradePromptProps {
  onClose?: () => void;
  onUpgrade?: (tier: 'starter' | 'professional') => void;
}

export const UpgradePrompt = ({ onClose, onUpgrade }: UpgradePromptProps) => {
  const [loading, setLoading] = useState(false);
  const usage = UsageTracker.getUsage();
  const percentage = UsageTracker.getUsagePercentage();

  const handleUpgrade = async (tier: 'professional') => {
    setLoading(true);
    try {
      await PaymentService.createCheckoutSession(tier, 'month');
      // Will redirect to Stripe checkout
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Failed to initiate checkout. Please try again.');
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    UsageTracker.dismissUpgradePrompt();
    onClose?.();
  };

  return (
    <div className="upgrade-prompt-overlay">
      <div className="upgrade-prompt-modal">
        {/* Close Button */}
        <button className="upgrade-prompt-close" onClick={handleDismiss} title="Dismiss">
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
          You've reached your free limit of {usage.hostsLimit} hosts/visitors. To continue using Floinvite, choose a paid plan below.
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

        {/* Plan Comparison */}
        <div className="plan-comparison">
          <div className="plan-card current">
            <h3>Starter (Current)</h3>
            <p className="plan-price">$5<span>/month</span></p>
            <p className="plan-subtitle">To continue using</p>
            <ul className="plan-features">
              <li>✓ Up to 20 hosts/visitors</li>
              <li>✓ Email notifications</li>
              <li>✓ Guest logbook & search</li>
              <li>✓ CSV import</li>
            </ul>
          </div>

          <div className="plan-card upgrade">
            <h3>Professional</h3>
            <p className="plan-price">$10<span>/month</span></p>
            <p className="plan-subtitle">Unlock more features</p>
            <ul className="plan-features">
              <li>✓ Unlimited hosts/visitors</li>
              <li>✓ SMS notifications</li>
              <li>✓ CSV export & backup</li>
              <li>✓ Advanced filtering</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="upgrade-prompt-buttons">
          <button className="btn-secondary" onClick={handleDismiss} disabled={loading}>
            Remind Later
          </button>
          <button
            className="btn-primary"
            onClick={() => handleUpgrade('professional')}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Choose a Plan'}
          </button>
        </div>

        {/* Footer Note */}
        <p className="upgrade-prompt-note">
          Select Starter ($5/mo) to continue, or Professional ($10/mo) for unlimited access and extra features. Cancel anytime.
        </p>
      </div>
    </div>
  );
};
