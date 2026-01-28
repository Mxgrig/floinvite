/**
 * Feature Locked Component
 * Shows when user tries to access a feature they don't have access to
 */

import { useState } from 'react';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setErrorMessage(null);
    try {
      await PaymentService.createCheckoutSession('compliance', 'month');
    } catch (error) {
      console.error('Upgrade failed:', error);
      setErrorMessage('Failed to start checkout. Please try again.');
    }
    onUpgrade?.();
  };

  return (
    <div className="feature-locked-container">
      <div className="feature-locked-content">
        <Lock className="feature-locked-icon" size={48} />
        <h3 className="feature-locked-title">{featureName} Locked</h3>
        <p className="feature-locked-message">{message}</p>
        {errorMessage && <p className="feature-locked-error">{errorMessage}</p>}

        {tier === 'starter' && (
          <button className="feature-locked-upgrade" onClick={handleUpgrade}>
            Upgrade to Compliance+
          </button>
        )}

        {tier === 'compliance' && (
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
