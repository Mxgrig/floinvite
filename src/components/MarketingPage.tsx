/**
 * MarketingPage Component
 * Unified long-scroll marketing page combining all sections:
 * Hero, Stats, Features, Use Cases, How It Works, Trust & Compliance, Pricing, Contact, CTA
 */

import { useState } from 'react';
import {
  TrendingUp,
  Check,
  ClipboardList,
  Bell,
  BookOpen,
  Users,
  Zap,
  Lock,
  Mail,
  MapPin,
  Phone,
  CheckCircle,
  Building2,
  GraduationCap,
  Hammer,
  Calendar,
  Shield,
  Heart,
} from 'lucide-react';
import { PRICING_TIERS } from '../services/pricingService';
import { PaymentService } from '../services/paymentService';
import './MarketingPage.css';

interface MarketingPageProps {
  onNavigate: (page: string) => void;
  onStartCheckIn: () => void;
}

export function MarketingPage({ onNavigate, onStartCheckIn }: MarketingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (tierId: string) => {
    if (tierId === 'starter') {
      onStartCheckIn();
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

  const stats = [
    { value: '30s', label: 'Average Check-in' },
    { value: '100%', label: 'Offline Ready' },
    { value: 'Multi', label: 'Channel Alerts' },
  ];

  const features = [
    {
      icon: ClipboardList,
      title: 'Smart Check-In',
      description:
        'Two-path flow optimized for both walk-ins and expected visitors. Get guests checked in in under 30 seconds.',
    },
    {
      icon: Bell,
      title: 'Instant Alerts',
      description:
        'Hosts get notified immediately when guests arrive. Email, SMS, or WhatsApp - your choice.',
    },
    {
      icon: BookOpen,
      title: 'Complete Records',
      description:
        'Searchable visitor logbook with advanced filtering and export options. CSV, JSON, and more.',
    },
    {
      icon: Users,
      title: 'Host Management',
      description:
        'Easy employee directory with customizable notification preferences and bulk import from CSV.',
    },
  ];

  const useCases = [
    {
      icon: Building2,
      title: 'Offices & Corporate',
      description: 'Streamline visitor check-in across multiple floors and departments',
    },
    {
      icon: GraduationCap,
      title: 'Schools & Universities',
      description: 'Enhance campus security and visitor management with ease',
    },
    {
      icon: Hammer,
      title: 'Construction Sites',
      description: 'Track contractors, suppliers, and site visitors efficiently',
    },
    {
      icon: Calendar,
      title: 'Events & Conferences',
      description: 'Manage large-scale visitor registration and tracking',
    },
    {
      icon: Shield,
      title: 'Security Teams',
      description: 'Complete audit trails and compliance documentation',
    },
    {
      icon: Heart,
      title: 'Hospitals & Healthcare',
      description: 'Secure visitor management with privacy compliance',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Create Account',
      description: 'Sign up in seconds with just a password. No credit card required.',
    },
    {
      number: '2',
      title: 'Set Up Site',
      description: 'Add your business details and import your employee directory via CSV.',
    },
    {
      number: '3',
      title: 'Register Visitors',
      description: 'Guests check in with a two-path flow: walk-ins or expected visitors.',
    },
    {
      number: '4',
      title: 'Monitor & Export',
      description: 'View complete logs, send notifications, and export reports anytime.',
    },
  ];

  const trustPoints = [
    'Secure cloud storage with encryption',
    'Role-based access control',
    'Complete audit trails for compliance',
    'Automatic backup & recovery',
    'GDPR-ready architecture',
    'Password-protected access',
  ];

  return (
    <div className="marketing-page">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER WITH BRANDING */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="marketing-header">
        <div className="container">
          <button
            onClick={() => onNavigate('landing')}
            className="marketing-brand-button"
            title="Back to home"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <h1 className="marketing-brand-text">
              <span className="marketing-brand-flo">flo</span>
              <span className="marketing-brand-invite">invite</span>
            </h1>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="hero-section py-5 py-lg-6 position-relative overflow-hidden">
        <div className="container position-relative">
          <div className="row align-items-center min-vh-75">
            <div className="col-12">
              <div className="badge bg-primary text-white mb-4 d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill">
                <TrendingUp size={16} />
                <span className="fw-semibold">Fast, Simple, Powerful</span>
              </div>

              <h1 className="display-4 fw-bold mb-4 lh-1 text-dark">
                Visitor Management
                <br />
                <span className="text-primary">That Actually Works</span>
              </h1>

              <p className="fs-5 mb-4 lh-base text-secondary">
                Check in guests in seconds, notify hosts instantly, and maintain
                complete visitor records. Built for businesses that care about
                their guests.
              </p>

              <p className="fs-5 mb-4 lh-base text-secondary">
                Whether you're managing a busy office, school, construction site, or special event,
                floinvite streamlines your visitor management process. Get real-time notifications,
                keep complete records, and ensure your guests have the best experience from the moment
                they arrive.
              </p>

              <div className="d-flex gap-3 mb-5 flex-column flex-sm-row">
                <button
                  className="btn btn-primary btn-lg fw-semibold px-4 py-3 d-flex align-items-center gap-2"
                  onClick={onStartCheckIn}
                >
                  Start Free Check-In
                  <span className="fs-5">→</span>
                </button>
                <button
                  className="btn btn-outline-primary btn-lg fw-semibold px-4 py-3"
                  onClick={() => {
                    const pricingSection = document.getElementById('pricing');
                    pricingSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View Pricing
                </button>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex align-items-center gap-3">
                    <Check size={20} className="text-success" />
                    <span className="text-secondary">No credit card required</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex align-items-center gap-3">
                    <Check size={20} className="text-success" />
                    <span className="text-secondary">Works on all devices</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex align-items-center gap-3">
                    <Check size={20} className="text-success" />
                    <span className="text-secondary">Offline ready</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STATS SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="stats-section py-5 bg-light">
        <div className="container">
          <div className="row g-4 justify-content-center">
            {stats.map((stat, index) => (
              <div key={index} className="col-md-4 col-12 text-center">
                <div className="stat-card p-4 rounded-4 bg-white shadow-sm border">
                  <h3 className="display-4 fw-bold text-primary mb-2">{stat.value}</h3>
                  <p className="text-muted mb-0 fw-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HOW IT WORKS SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="how-it-works-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">How It Works</h2>
            <p className="fs-5 text-muted mb-0">Get started in 4 simple steps</p>
          </div>

          <div className="row g-4">
            {steps.map((step, index) => (
              <div key={index} className="col-lg-3 col-md-6 col-12">
                <div className="steps-card card h-100 border-0 shadow-sm position-relative">
                  <div className="step-number badge bg-primary text-white position-absolute top-0 start-50 translate-middle">
                    {step.number}
                  </div>
                  <div className="card-body pt-5 text-center">
                    <h5 className="card-title fw-bold mb-3">{step.title}</h5>
                    <p className="card-text text-muted">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FEATURES SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="features-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Everything You Need</h2>
            <p className="fs-5 text-muted mb-0">Comprehensive features for modern visitor management</p>
          </div>

          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-3 col-md-6 col-12">
                <div className="feature-card card h-100 border-0 shadow-sm hover-lift">
                  <div className="card-body p-4 text-center">
                    <div className="feature-icon mb-3 mx-auto">
                      <feature.icon size={48} className="text-primary" />
                    </div>
                    <h5 className="card-title fw-bold mb-3">{feature.title}</h5>
                    <p className="card-text text-muted small lh-base">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* WHO IT'S FOR SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="use-cases-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Who It's For</h2>
            <p className="fs-5 text-muted mb-0">Perfect for any organization managing visitors</p>
          </div>

          <div className="row g-4">
            {useCases.map((useCase, index) => (
              <div key={index} className="col-lg-4 col-md-6 col-12">
                <div className="usecase-card card h-100 border-0 shadow-sm">
                  <div className="card-body p-4 text-center">
                    <div className="usecase-icon mb-3 mx-auto">
                      <useCase.icon size={48} className="text-primary" />
                    </div>
                    <h5 className="card-title fw-bold mb-3">{useCase.title}</h5>
                    <p className="card-text text-muted">{useCase.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TRUST & COMPLIANCE SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="trust-section py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-12 mb-4 mb-lg-0">
              <h2 className="display-5 fw-bold mb-4">Trust & Compliance</h2>
              <p className="fs-5 text-muted mb-4">
                Your visitor data is secure. We prioritize security, compliance, and privacy
                from day one.
              </p>

              <div className="row g-3">
                {trustPoints.map((point, index) => (
                  <div key={index} className="col-12">
                    <div className="d-flex align-items-start gap-3">
                      <Check size={24} className="text-success flex-shrink-0 mt-1" />
                      <span className="text-secondary">{point}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-lg-6 col-12">
              <div className="trust-image-container">
                <div className="trust-badge p-4 bg-white rounded-4 shadow-sm">
                  <div className="text-center">
                    <Lock size={64} className="text-primary mb-3" />
                    <h5 className="fw-bold">Enterprise Security</h5>
                    <p className="text-muted">
                      Your data is encrypted, backed up, and protected by industry-standard security
                      practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PRICING SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="pricing-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-primary mb-3">Plans & Pricing</span>
            <h2 className="display-5 fw-bold mb-3">Simple, Transparent Pricing</h2>
            <p className="fs-5 text-muted mb-4 mx-auto" style={{ maxWidth: '600px' }}>
              All plans include powerful visitor management. Notifications set them apart.
            </p>

            <div className="btn-group mb-5" role="group">
              <input
                type="radio"
                className="btn-check"
                name="billing"
                id="monthly"
                checked={billingCycle === 'month'}
                onChange={() => setBillingCycle('month')}
              />
              <label className="btn btn-outline-primary fw-semibold" htmlFor="monthly">
                Monthly
              </label>

              <input
                type="radio"
                className="btn-check"
                name="billing"
                id="yearly"
                checked={billingCycle === 'year'}
                onChange={() => setBillingCycle('year')}
              />
              <label className="btn btn-outline-primary fw-semibold" htmlFor="yearly">
                Yearly <span className="badge bg-success ms-2">Save 20%</span>
              </label>
            </div>
          </div>

          <div className="row g-4">
            {PRICING_TIERS.map((tier) => {
              const notificationFeatures = tier.features.filter((f) => f.category === 'notifications');

              return (
                <div key={tier.id} className="col-lg-4 col-md-6 col-12">
                  <div
                    className={`card h-100 border-0 shadow ${
                      tier.highlighted ? 'shadow-lg border-primary border-2' : ''
                    }`}
                  >
                    {tier.highlighted && (
                      <div className="position-absolute top-0 start-50 translate-middle-x">
                        <span className="badge bg-primary px-3 py-2">
                          <CheckCircle size={14} className="me-1" style={{ display: 'inline' }} />
                          Recommended
                        </span>
                      </div>
                    )}

                    <div className="card-body">
                      <h2 className="card-title fw-bold mb-2">{tier.name}</h2>
                      <p className="card-text text-muted mb-4">{tier.description}</p>

                      <div className="mb-4">
                        {tier.id !== 'enterprise' ? (
                          <>
                            <span className="display-4 fw-bold">${tier.price}</span>
                            <span className="text-muted">/month</span>
                            {billingCycle === 'year' && (
                              <div className="text-muted mt-2">${(tier.price * 12 * 0.8).toFixed(0)}/year</div>
                            )}
                          </>
                        ) : (
                          <span className="display-5 fw-bold">Custom pricing</span>
                        )}
                      </div>

                      <button
                        className={`btn ${
                          tier.buttonColor === 'primary' ? 'btn-primary' : 'btn-outline-primary'
                        } btn-lg w-100 fw-semibold mb-4`}
                        onClick={() => handleUpgrade(tier.id)}
                        disabled={loading && selectedTier === tier.id}
                      >
                        {loading && selectedTier === tier.id ? 'Processing...' : tier.buttonText}
                      </button>

                      <div className="border-top pt-4">
                        {tier.features.filter((f) => f.category === 'core' && f.included).length > 0 && (
                          <div className="mb-3">
                            <h6 className="fw-bold text-muted mb-2">Core Features</h6>
                            <ul className="list-unstyled">
                              {tier.features
                                .filter((f) => f.category === 'core' && f.included)
                                .map((feature, idx) => (
                                  <li key={idx} className="mb-2">
                                    <span className="text-success">✓</span> {feature.text}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                        {notificationFeatures.length > 0 && (
                          <div className="mb-3">
                            <h6 className="fw-bold text-muted mb-2">Notifications</h6>
                            <ul className="list-unstyled">
                              {notificationFeatures.map((feature, idx) => (
                                <li key={idx} className={`mb-2 ${feature.included ? '' : 'text-muted'}`}>
                                  <span className={feature.included ? 'text-success' : 'text-danger'}>
                                    {feature.included ? '✓' : '✗'}
                                  </span>{' '}
                                  {feature.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {tier.features.filter((f) => f.category === 'data').length > 0 && (
                          <div className="mb-3">
                            <h6 className="fw-bold text-muted mb-2">Data & Storage</h6>
                            <ul className="list-unstyled">
                              {tier.features
                                .filter((f) => f.category === 'data')
                                .map((feature, idx) => (
                                  <li key={idx} className={`mb-2 ${feature.included ? '' : 'text-muted'}`}>
                                    <span className={feature.included ? 'text-success' : 'text-danger'}>
                                      {feature.included ? '✓' : '✗'}
                                    </span>{' '}
                                    {feature.text}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                        {tier.features.filter((f) => f.category === 'support' && f.included).length > 0 && (
                          <div>
                            <h6 className="fw-bold text-muted mb-2">Support</h6>
                            <ul className="list-unstyled">
                              {tier.features
                                .filter((f) => f.category === 'support' && f.included)
                                .map((feature, idx) => (
                                  <li key={idx} className="mb-2">
                                    <span className="text-success">✓</span> {feature.text}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* CONTACT SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="contact-section py-5 bg-light">
        <div className="container">
          <h2 className="display-5 fw-bold text-center mb-5">Get in Touch</h2>

          <div className="row g-4 mb-5">
            <div className="col-lg-4 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body">
                  <div className="mb-3">
                    <Mail size={40} className="text-primary" />
                  </div>
                  <h5 className="card-title fw-bold">Email</h5>
                  <p>
                    <a href="mailto:admin@floinvite.com" className="text-decoration-none">
                      admin@floinvite.com
                    </a>
                  </p>
                  <p className="text-muted small">We'll respond within 24 hours</p>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body">
                  <div className="mb-3">
                    <Phone size={40} className="text-primary" />
                  </div>
                  <h5 className="card-title fw-bold">Phone</h5>
                  <p>
                    <a href="tel:02045295067" className="text-decoration-none">
                      020 4529 5067
                    </a>
                  </p>
                  <p className="text-muted small">Mon-Fri, 9:00 AM - 5:00 PM GMT</p>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 col-12">
              <div className="card h-100 border-0 shadow-sm text-center">
                <div className="card-body">
                  <div className="mb-3">
                    <MapPin size={40} className="text-primary" />
                  </div>
                  <h5 className="card-title fw-bold">Office</h5>
                  <p>
                    307 Goldfinger Court
                    <br />
                    London, E16 6UN
                    <br />
                    United Kingdom
                  </p>
                  <p className="text-muted small">xtenalyze HQ</p>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-8 col-12 mx-auto">
              <h3 className="fw-bold mb-4">Send us a Message</h3>
              <form
                className="contact-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you for your message! We will get back to you soon at admin@floinvite.com');
                }}
              >
                <div className="mb-3">
                  <label htmlFor="name" className="form-label fw-semibold">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="form-control form-control-lg"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    Your Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-control form-control-lg"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="subject" className="form-label fw-semibold">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="form-control form-control-lg"
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="message" className="form-label fw-semibold">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    className="form-control form-control-lg"
                    placeholder="Tell us about your inquiry..."
                    rows={5}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-lg fw-semibold w-100">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FINAL CTA SECTION */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="cta-section py-5 position-relative overflow-hidden">
        <img
          src="/heroimg.png"
          alt="Background"
          className="cta-background"
        />
        <div className="cta-overlay"></div>
        <div className="container text-center position-relative">
          <div className="cta-content mx-auto" style={{ maxWidth: '600px' }}>
            <h2 className="display-5 fw-bold mb-3 text-white">
              Ready to transform your visitor management?
            </h2>
            <p className="fs-5 mb-4 text-white">
              Join businesses that have simplified their check-in process and improved guest experience.
            </p>
            <button
              className="btn btn-primary btn-lg fw-semibold px-5 py-3 d-inline-flex align-items-center gap-2"
              onClick={onStartCheckIn}
            >
              Get Started Free
              <span className="fs-5">→</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
