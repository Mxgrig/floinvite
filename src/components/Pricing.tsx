import { useState } from 'react';
import { PRICING_TIERS } from '../services/pricingService';
import { PaymentService } from '../services/paymentService';
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
    <div className="pricing-container">
      {/* Header */}
      <div className="pricing-header">
        <h1>Simple, Transparent Pricing</h1>
        <p>All plans include powerful visitor management. Notifications set them apart.</p>
      </div>

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

      {/* Notification Features Callout */}
      <div className="notifications-callout">
        <div className="callout-content">
          <h3>🔔 Why Notifications Matter</h3>
          <p>
            Instant notifications transform Floinvite from a logbook to a <strong>real-time guest management system</strong>. Your team knows immediately when visitors arrive.
          </p>
          <div className="notification-features">
            <div className="feature-row">
              <span className="level">Starter:</span>
              <span className="desc">View & copy notification templates (manual)</span>
            </div>
            <div className="feature-row highlight-row">
              <span className="level">Professional:</span>
              <span className="desc">
                ✨ <strong>Automatic email + SMS + Slack + Teams alerts</strong>
              </span>
            </div>
            <div className="feature-row">
              <span className="level">Enterprise:</span>
              <span className="desc">
                ✨ All above + Custom webhooks + Delivery guarantees
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <h3>Frequently Asked Questions</h3>

        <div className="faq-grid">
          <div className="faq-item">
            <h4>🔔 How fast are notifications?</h4>
            <p>
              Email arrives within 1-2 seconds. SMS via email gateway is instant. All real-time.
            </p>
          </div>

          <div className="faq-item">
            <h4>📬 Do notifications work offline?</h4>
            <p>
              Check-ins work offline. Notifications queue and send when user comes online.
            </p>
          </div>

          <div className="faq-item">
            <h4>👥 Can multiple hosts get notified?</h4>
            <p>
              Yes! Each guest specifies a host. That host gets notified. Unlimited guests = unlimited notifications.
            </p>
          </div>

          <div className="faq-item">
            <h4>✏️ Can I customize notification messages?</h4>
            <p>
              Professional & Enterprise: Customizable templates with tone options (professional, friendly, casual).
            </p>
          </div>

          <div className="faq-item">
            <h4>🌙 What about quiet hours?</h4>
            <p>
              Professional plan: Per-host quiet hours. No notifications during off-hours.
            </p>
          </div>

          <div className="faq-item">
            <h4>🔗 Can I use webhooks?</h4>
            <p>
              Enterprise only: Custom webhooks for Zapier, IFTTT, or any custom integration.
            </p>
          </div>

          <div className="faq-item">
            <h4>💬 What if hosts prefer SMS over email?</h4>
            <p>
              Professional tier: Each host chooses notification method (email, SMS, Slack, Teams).
            </p>
          </div>

          <div className="faq-item">
            <h4>📊 Can I see notification history?</h4>
            <p>
              Professional & Enterprise: Full notification logs with delivery status and timestamps.
            </p>
          </div>

          <div className="faq-item">
            <h4>🔄 Can I switch plans anytime?</h4>
            <p>
              Yes! Upgrade or downgrade instantly. Changes take effect immediately.
            </p>
          </div>

          <div className="faq-item">
            <h4>💰 Annual vs Monthly?</h4>
            <p>
              Pay annual = save 20%. Both include all features. Downgrade anytime.
            </p>
          </div>

          <div className="faq-item">
            <h4>🆓 Is there a free trial?</h4>
            <p>
              Yes! Starter plan is free forever. Full app access, no notifications.
            </p>
          </div>

          <div className="faq-item">
            <h4>🏢 What about multi-location businesses?</h4>
            <p>
              Professional: Multiple locations. Enterprise: Unlimited. Contact sales for custom pricing.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="trust-section">
        <p>Join 500+ businesses already using Floinvite</p>
        <div className="trust-badges">
          <span className="badge">🔒 End-to-End Encrypted</span>
          <span className="badge">✓ GDPR Compliant</span>
          <span className="badge">🏆 Privacy First</span>
        </div>
      </div>
    </div>
  );
};
