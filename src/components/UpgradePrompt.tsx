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
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | null>(null);
  const usage = UsageTracker.getUsage();
  const percentage = UsageTracker.getUsagePercentage();

  const handleUpgrade = async (tier: 'starter' | 'professional') => {
    setLoading(true);
    setSelectedPlan(tier);

    try {
      // Both Starter and Professional require Stripe payment
      // Redirect to Stripe checkout for payment processing
      await PaymentService.createCheckoutSession(tier, 'month');
      // Will redirect to Stripe checkout
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Failed to initiate checkout. Please try again.');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleDismiss = () => {
    // Do NOT allow dismissal when over limit
    // User must choose a plan
    alert('You must choose a plan to continue using Floinvite.');
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
          You've reached your free limit of {usage.hostsLimit} hosts/visitors. Continue on Starter for $5/month, or upgrade to Professional for unlimited access.
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
            <h3>Starter (Continue)</h3>
            <p className="plan-price">$5<span>/month</span></p>
            <p className="plan-subtitle">Keep going after 20 items</p>
            <ul className="plan-features">
              <li>✓ Up to 20 hosts/visitors</li>
              <li>✓ Email notifications</li>
              <li>✓ Guest logbook & search</li>
              <li>✓ CSV import</li>
            </ul>
          </div>

          <div className="plan-card upgrade">
            <h3>Professional (Optional)</h3>
            <p className="plan-price">$10<span>/month</span></p>
            <p className="plan-subtitle">Unlimited + advanced features</p>
            <ul className="plan-features">
              <li>✓ Unlimited hosts/visitors</li>
              <li>✓ SMS notifications</li>
              <li>✓ CSV export & backup</li>
              <li>✓ Advanced filtering</li>
              <li>✓ Priority support</li>
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
            {loading && selectedPlan === 'starter' ? 'Processing...' : 'Pay $5/mo (Starter)'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleUpgrade('professional')}
            disabled={loading || selectedPlan !== null}
          >
            {loading && selectedPlan === 'professional' ? 'Processing...' : 'Pay $10/mo (Professional)'}
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
