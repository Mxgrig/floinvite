import { useState } from 'react';
import { PRICING_TIERS } from '../services/pricingService';
import { PaymentService } from '../services/paymentService';
import PageLayout from './PageLayout';
import './Pricing.css';

export const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (tierId: string) => {
    if (tierId === 'starter') {
      window.location.href = '/app/dashboard';
      return;
    }

    setSelectedTier(tierId);
    setLoading(true);
    try {
      await PaymentService.createCheckoutSession(tierId, billingCycle);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate checkout. Please try again.');
      setLoading(false);
    }
  };


  return (
    <PageLayout
      eyebrow="Plans & pricing"
      title="Simple, Transparent Pricing"
      subtitle="All plans include powerful visitor management. Notifications set them apart."
    >
      <div className="pricing-content">

      {/* Billing Toggle */}
      <div className="billing-toggle">
        <button
          className={billingCycle === 'month' ? 'active' : ''}
          onClick={() => setBillingCycle('month')}
        >
          Monthly
        </button>
        <button
          className={billingCycle === 'year' ? 'active' : ''}
          onClick={() => setBillingCycle('year')}
        >
          Yearly
          <span className="badge">Save 20%</span>
        </button>
      </div>

      {/* Pricing Cards */}
      <div className="pricing-grid">
        {PRICING_TIERS.map((tier) => {
          const notificationFeatures = tier.features.filter(
            (f) => f.category === 'notifications'
          );

          return (
            <div
              key={tier.id}
              className={`pricing-card ${tier.highlighted ? 'highlighted' : ''}`}
            >
              {tier.highlighted && (
                <div className="recommended-badge">⭐ Recommended</div>
              )}

              {/* Card Header */}
              <div className="card-header">
                <h2>{tier.name}</h2>
                <p className="description">{tier.description}</p>
              </div>

              {/* Price */}
              <div className="price-section">
                <div className="price">
                  <span className="currency">$</span>
                  <span className="amount">{tier.price}</span>
                  <span className="period">/month</span>
                </div>
                {billingCycle === 'year' && (
                  <div className="annual-price">
                    ${(tier.price * 12 * 0.8).toFixed(0)}/year
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <button
                className={`cta-button ${tier.buttonColor}`}
                onClick={() => handleUpgrade(tier.id)}
                disabled={loading && selectedTier === tier.id}
              >
                {loading && selectedTier === tier.id
                  ? 'Processing...'
                  : tier.buttonText}
              </button>

              {/* Features List - Organized by Category */}
              <div className="features-list">
                {/* Core Features */}
                <div className="feature-category">
                  <h4 className="category-title">✓ Core Features</h4>
                  <div className="feature-items">
                    {tier.features
                      .filter((f) => f.category === 'core')
                      .slice(0, 3)
                      .map((feature, idx) => (
                        <div key={idx} className="feature-item">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">{feature.text}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* NOTIFICATIONS - HIGHLIGHTED */}
                <div className="feature-category notifications-highlight">
                  <h4 className="category-title">🔔 Visitor Notifications</h4>
                  <div className="feature-items">
                    {notificationFeatures.map((feature, idx) => (
                      <div
                        key={idx}
                        className={`feature-item ${
                          feature.included ? 'included' : 'excluded'
                        }`}
                      >
                        <span className="feature-icon">
                          {feature.included ? '✓' : '✗'}
                        </span>
                        <span className="feature-text">
                          {feature.text}
                          {feature.text.includes('⭐') && (
                            <span className="highlight-badge">KEY</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data & Backup */}
                <div className="feature-category">
                  <h4 className="category-title">💾 Data & Backup</h4>
                  <div className="feature-items">
                    {tier.features
                      .filter((f) => f.category === 'data')
                      .slice(0, 2)
                      .map((feature, idx) => (
                        <div
                          key={idx}
                          className={`feature-item ${
                            feature.included ? 'included' : 'excluded'
                          }`}
                        >
                          <span className="feature-icon">
                            {feature.included ? '✓' : '✗'}
                          </span>
                          <span className="feature-text">{feature.text}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Support */}
                <div className="feature-category">
                  <h4 className="category-title">💬 Support</h4>
                  <div className="feature-items">
                    {tier.features
                      .filter(
                        (f) =>
                          f.category === 'support' &&
                          f.included === true
                      )
                      .map((feature, idx) => (
                        <div key={idx} className="feature-item">
                          <span className="feature-icon">✓</span>
                          <span className="feature-text">{feature.text}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </PageLayout>
  );
};
