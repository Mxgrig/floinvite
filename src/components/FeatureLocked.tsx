/**
 * Feature Locked Component
 * Shows when user tries to access a feature they don't have access to
 */

import { Lock } from 'lucide-react';
import { PaymentService } from '../services/paymentService';
import { getFeatureName, getUpgradeRecommendation, SubscriptionTier } from '../utils/featureGating';
import './FeatureLocked.css';

interface FeatureLockedProps {
  feature: string;
  tier: SubscriptionTier;
  onUpgrade?: () => void;
}

export const FeatureLocked = ({ feature, tier, onUpgrade }: FeatureLockedProps) => {
  const featureName = getFeatureName(feature);
  const message = getUpgradeRecommendation(tier, feature);

  const handleUpgrade = async () => {
    try {
      await PaymentService.createCheckoutSession('professional', 'month');
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Failed to start checkout. Please try again.');
    }
    onUpgrade?.();
  };

  return (
    <div className="feature-locked-container">
      <div className="feature-locked-content">
        <Lock className="feature-locked-icon" size={48} />
        <h3 className="feature-locked-title">{featureName} Locked</h3>
        <p className="feature-locked-message">{message}</p>

        {tier === 'starter' && (
          <button className="feature-locked-upgrade" onClick={handleUpgrade}>
            Upgrade to Professional
          </button>
        )}

        {tier === 'professional' && (
          <button className="feature-locked-contact" onClick={() => window.location.href = 'mailto:admin@floinvite.com'}>
            Contact Sales
          </button>
        )}

        {tier === 'enterprise' && (
          <button className="feature-locked-support" onClick={() => window.location.href = 'mailto:admin@floinvite.com'}>
            Contact Support
          </button>
        )}
      </div>
    </div>
  );
};
