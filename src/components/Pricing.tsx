import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { PRICING_TIERS } from '../services/pricingService';
import { PaymentService } from '../services/paymentService';
import PageLayout from './PageLayout';
import './Pricing.css';

interface PricingProps {
  onNavigate?: (page: string) => void;
}

export const Pricing = ({ onNavigate }: PricingProps) => {
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Inject pricing schema markup for SEO
  useEffect(() => {
    const offers = PRICING_TIERS.map((tier) => ({
      '@type': 'Offer',
      'name': tier.name,
      'description': tier.description,
      'price': tier.id === 'enterprise' ? '0' : tier.price.toString(),
      'priceCurrency': 'USD',
      'url': 'https://floinvite.com/pricing'
    }));

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'AggregateOffer',
      'name': 'Floinvite Pricing Plans',
      'description': 'Flexible pricing plans for visitor management software',
      'url': 'https://floinvite.com/pricing',
      'priceCurrency': 'USD',
      'offers': offers
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

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
    <div className="pricing-page-wrapper">
      {/* Navbar for unauthenticated users */}
      <nav className="legal-navbar">
        <div className="legal-navbar-content">
          {/* Logo & Brand */}
          <button className="legal-navbar-brand" onClick={() => onNavigate?.('landing')}>
            <div className="legal-navbar-logo">
              <img src="/xmas-logo.png" alt="floinvite" />
            </div>
            <span className="brand-wordmark">
              <span className="brand-wordmark-flo">flo</span>
              <span className="brand-wordmark-invite">invite</span>
            </span>
          </button>

          {/* Navigation Links */}
          <div className="legal-navbar-links">
            <button className="legal-navbar-link legal-navbar-link-active" onClick={() => onNavigate?.('pricing')}>
              Pricing
            </button>
            <button className="legal-navbar-link" onClick={() => onNavigate?.('features')}>
              Features
            </button>
            <button className="legal-navbar-link" onClick={() => onNavigate?.('contact')}>
              Contact
            </button>
          </div>
        </div>
      </nav>

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
                <div className="recommended-badge">
                  <CheckCircle size={16} style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                  Recommended
                </div>
              )}

              {/* Card Header */}
              <div className="card-header">
                <h2>{tier.name}</h2>
                <p className="description">{tier.description}</p>
              </div>

              {/* Price */}
              {tier.id !== 'enterprise' && (
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
              )}
              {tier.id === 'enterprise' && (
                <div className="price-section">
                  <div className="price">
                    <span className="amount">Custom pricing</span>
                  </div>
                </div>
              )}

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
                {tier.features.filter((f) => f.category === 'core' && f.included).length > 0 && (
                  <div className="feature-section">
                    <h4 className="section-heading">Core Features</h4>
                    <ul className="feature-text-list">
                      {tier.features
                        .filter((f) => f.category === 'core' && f.included)
                        .map((feature, idx) => (
                          <li key={idx}>✓ {feature.text}</li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Notifications */}
                {notificationFeatures.length > 0 && (
                  <div className="feature-section">
                    <h4 className="section-heading">Notifications</h4>
                    <ul className="feature-text-list">
                      {notificationFeatures.map((feature, idx) => (
                        <li key={idx} className={feature.included ? 'included' : 'excluded'}>
                          {feature.included ? '✓' : '✗'} {feature.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Data & Storage */}
                {tier.features.filter((f) => f.category === 'data').length > 0 && (
                  <div className="feature-section">
                    <h4 className="section-heading">Data & Storage</h4>
                    <ul className="feature-text-list">
                      {tier.features
                        .filter((f) => f.category === 'data')
                        .map((feature, idx) => (
                          <li key={idx} className={feature.included ? 'included' : 'excluded'}>
                            {feature.included ? '✓' : '✗'} {feature.text}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Support */}
                {tier.features.filter((f) => f.category === 'support' && f.included).length > 0 && (
                  <div className="feature-section">
                    <h4 className="section-heading">Support</h4>
                    <ul className="feature-text-list">
                      {tier.features
                        .filter((f) => f.category === 'support' && f.included)
                        .map((feature, idx) => (
                          <li key={idx}>✓ {feature.text}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </PageLayout>
    </div>
  );
};
