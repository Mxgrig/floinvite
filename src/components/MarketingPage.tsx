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
import { usePersistedState } from '../utils/hooks';
import { STORAGE_KEYS } from '../utils/constants';
import { AppSettings } from '../types';
import { DEFAULT_LABELS, LABEL_PRESETS, LabelPresetKey, getLabelSettings } from '../utils/labelUtils';
import './MarketingPage.css';

interface MarketingPageProps {
  onNavigate: (page: string) => void;
  onStartCheckIn: () => void;
}

export function MarketingPage({ onNavigate, onStartCheckIn }: MarketingPageProps) {
  const [settings, setSettings] = usePersistedState<AppSettings>(STORAGE_KEYS.settings, {
    businessName: 'My Company',
    notificationEmail: 'admin@floinvite.com',
    kioskMode: false,
    labelPreset: 'default',
    labelSettings: DEFAULT_LABELS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const labels = getLabelSettings(settings);
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [contactError, setContactError] = useState('');

  const startFree = () => {
    onStartCheckIn();
  };

  const handleIndustryPreset = (preset: LabelPresetKey) => {
    const presetLabels = LABEL_PRESETS[preset]?.labels || DEFAULT_LABELS;
    setSettings({
      ...settings,
      labelPreset: preset,
      labelSettings: presetLabels,
      updatedAt: new Date().toISOString()
    });
  };

  const handleContactChange = (field: keyof typeof contactForm, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    setContactStatus('sending');

    const payload = {
      to: 'admin@floinvite.com',
      subject: `Contact: ${contactForm.subject} (${contactForm.name})`,
      body: [
        'New contact message from floinvite.com',
        '',
        `Name: ${contactForm.name}`,
        `Email: ${contactForm.email}`,
        `Subject: ${contactForm.subject}`,
        '',
        contactForm.message
      ].join('\n'),
      emailType: 'admin'
    };

    try {
      const response = await fetch('/api/send-email.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Message failed to send.');
      }
      setContactStatus('success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setContactStatus('error');
      setContactError(err instanceof Error ? err.message : 'Message failed to send.');
    }
  };

  const stats = [
    { value: '30s', label: `Average ${labels.checkIn.toLowerCase()}` },
    { value: '100%', label: 'Browser-based' },
    { value: 'Export', label: 'Anytime' },
  ];

  const features = [
    {
      icon: ClipboardList,
      title: `30-Second ${labels.checkIn}`,
      description:
        `Fast two-path flow for ${labels.walkIn.toLowerCase()} and ${labels.expected.toLowerCase()}.`,
    },
    {
      icon: Bell,
      title: 'Arrival Notifications',
      description:
        `Notify ${labels.hostPlural.toLowerCase()} immediately when someone arrives.`,
    },
    {
      icon: BookOpen,
      title: 'Exportable Records',
      description:
        `Searchable ${labels.logbook.toLowerCase()} with exports on demand.`,
    },
    {
      icon: Users,
      title: 'On-Site Accountability',
      description:
        `Know who is on site right now, with a clean live list.`,
    },
  ];

  const useCases = [
    {
      icon: Building2,
      title: 'Events & Venues',
      description: `Check in ${labels.personPlural.toLowerCase()} in seconds. Export ${labels.logbook.toLowerCase()} lists for invoicing.`,
    },
    {
      icon: GraduationCap,
      title: 'Construction & Contractors',
      description: 'Track crew on-site. Daily accountability for payroll.',
    },
    {
      icon: Hammer,
      title: 'Small Offices',
      description: "Better than a clipboard. Know who's here.",
    },
    {
      icon: Calendar,
      title: 'Staffing Coordinators',
      description: 'Quick intake for temp workers. Compliance-ready records.',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Start Free',
      description: 'Sign up in seconds and start checking in immediately.',
    },
    {
      number: '2',
      title: 'Set Up Your Site',
      description: `Configure your site and import your ${labels.hostPlural.toLowerCase()} list in minutes.`,
    },
    {
      number: '3',
      title: 'Run Check-ins',
      description: `Capture ${labels.personPlural.toLowerCase()} and notify ${labels.hostPlural.toLowerCase()} with a simple two-path flow.`,
    },
    {
      number: '4',
      title: 'Export Anytime',
      description: 'Generate exports whenever you need a record.',
    },
  ];

  const trustPoints = [
    'Secure, ISO-ready data handling',
    'Audit-ready record retrieval',
    'GDPR & Privacy compliant',
    'Instant PDF/CSV exports',
  ];

  return (
    <main className="marketing-page">
      {/* HEADER WITH BRANDING */}
      <header className="marketing-header">
        <div className="container">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); onNavigate('landing'); }}
            className="marketing-brand-button"
            title="Back to home"
            aria-label="Floinvite home"
            style={{
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            <h1 className="marketing-brand-text brand-wordmark">
              <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
            </h1>
          </a>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section py-5 py-lg-6 position-relative overflow-hidden">
        <div className="container position-relative">
          <div className="row align-items-center min-vh-75">
            <div className="col-lg-7 col-12">
              <div className="badge bg-primary text-white mb-4 d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill">
                <TrendingUp size={16} />
                <span className="fw-semibold">Fast, Simple, Powerful</span>
              </div>

              <h1 className="display-4 fw-bold mb-4 lh-1 text-dark">
                30 Seconds to {labels.checkIn}
                <br />
                <span className="text-primary">Zero Hardware, SME Efficient</span>
              </h1>

              <div className="hero-copy">
                <p className="fs-5 mb-4 lh-base text-secondary">
                  The fastest way for SMEs to manage site access. Zero hardware kiosks, zero training, and zero complexity. Audit-ready in minutes.
                </p>

                <p className="fs-5 mb-4 lh-base text-secondary">
                  An access management platform for modern businesses: venues, contractors, small offices,
                  and staffing coordinators who need speed over complexity.
                </p>

                <div className="mb-4">
                  <label className="form-label fw-semibold text-secondary">Industry template</label>
                  <select
                    className="form-select"
                    value={(settings.labelPreset || 'default') as LabelPresetKey}
                    onChange={(e) => handleIndustryPreset(e.target.value as LabelPresetKey)}
                    style={{ maxWidth: '320px' }}
                  >
                    {(['default', 'construction', 'healthcare', 'events', 'education'] as LabelPresetKey[]).map((key) => (
                      <option key={key} value={key}>
                        {LABEL_PRESETS[key].name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="hero-cta-row">
                  <button
                    className="btn btn-primary btn-lg fw-semibold px-4 py-3 d-flex align-items-center gap-2"
                    onClick={startFree}
                  >
                    Start Free
                    <span className="fs-5">&gt;</span>
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
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex align-items-center gap-3">
                    <Check size={20} className="text-success" />
                    <span className="text-secondary">No software to install</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex align-items-center gap-3">
                    <Check size={20} className="text-success" />
                    <span className="text-secondary">Works on any browser</span>
                  </div>
                </div>
                <div className="col-12">
                  <div className="d-flex align-items-center gap-3">
                    <Check size={20} className="text-success" />
                    <span className="text-secondary">Export anytime</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-5 col-12 mt-4 mt-lg-0">
              <div className="hero-panel">
                <div className="hero-panel-header">
                  Built for fast check-ins
                </div>
                <div className="hero-panel-list">
                  <div className="hero-panel-item">
                    <div className="hero-panel-icon">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h6>Two-path flow</h6>
                      <p>{labels.walkIn} or {labels.expected.toLowerCase()}.</p>
                    </div>
                  </div>
                  <div className="hero-panel-item">
                    <div className="hero-panel-icon">
                      <Bell size={20} />
                    </div>
                    <div>
                      <h6>Instant {labels.hostSingular.toLowerCase()} alerts</h6>
                      <p>Email notifications in real time.</p>
                    </div>
                  </div>
                  <div className="hero-panel-item">
                    <div className="hero-panel-icon">
                      <Shield size={20} />
                    </div>
                    <div>
                      <h6>Live on-site list</h6>
                      <p>Know who is here right now.</p>
                    </div>
                  </div>
                </div>
                <div className="hero-panel-footer">
                  Start free, upgrade anytime
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
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

      {/* HOW IT WORKS SECTION */}
      <section className="how-it-works-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">How It Works</h2>
            <p className="fs-5 text-muted mb-0">Start in minutes</p>
          </div>

          <div className="row g-4 steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="col-lg-3 col-md-6 col-12">
                <div className="steps-card card h-100 border-0 shadow-sm">
                  <div className="step-number">{step.number}</div>
                  <div className="step-content">
                    <h5 className="card-title fw-bold">{step.title}</h5>
                    <p className="card-text text-muted">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Everything You Need</h2>
            <p className="fs-5 text-muted mb-0">Simple, fast site access management</p>
          </div>

          <div className="row g-4 justify-content-center">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-3 col-md-6 col-12">
                <div className="feature-card card h-100 border-0 shadow-sm hover-lift">
                  <div className="card-body p-4">
                    <div className="feature-card-header">
                      <div className="feature-icon">
                        <feature.icon size={24} className="text-primary" />
                      </div>
                      <h5 className="card-title fw-bold">{feature.title}</h5>
                    </div>
                    <p className="card-text text-muted lh-base">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPETITIVE COMPARISON SECTION */}
      <section className="comparison-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">The Floinvite Difference</h2>
            <p className="fs-5 text-muted mb-0">Why SMEs choose us over "Enterprise" legacy systems</p>
          </div>

          <div className="table-responsive shadow-sm rounded-4">
            <table className="table table-bordered align-middle mb-0 bg-white">
              <thead className="table-light">
                <tr>
                  <th className="py-3 px-4" style={{ width: '40%' }}>Feature</th>
                  <th className="py-3 px-4 text-center" style={{ width: '30%' }}>Floinvite</th>
                  <th className="py-3 px-4 text-center text-muted" style={{ width: '30%' }}>Traditional Systems</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-4" style={{ width: '40%' }}><strong>Hardware Required</strong></td>
                  <td className="py-3 px-4 text-center text-primary fw-bold" style={{ width: '30%' }}>None (Zero)</td>
                  <td className="py-3 px-4 text-center" style={{ width: '30%' }}>iPad & Kiosk Kiosks required</td>
                </tr>
                <tr>
                  <td className="py-3 px-4" style={{ width: '40%' }}><strong>Setup Time</strong></td>
                  <td className="py-3 px-4 text-center text-primary fw-bold" style={{ width: '30%' }}>&lt; 2 Minutes</td>
                  <td className="py-3 px-4 text-center" style={{ width: '30%' }}>Hours to Days</td>
                </tr>
                <tr>
                  <td className="py-3 px-4" style={{ width: '40%' }}><strong>Monthly Pricing</strong></td>
                  <td className="py-3 px-4 text-center text-primary fw-bold" style={{ width: '30%' }}>From $29/mo</td>
                  <td className="py-3 px-4 text-center" style={{ width: '30%' }}>Starting at $100+/mo</td>
                </tr>
                <tr>
                  <td className="py-3 px-4" style={{ width: '40%' }}><strong>SME Optimization</strong></td>
                  <td className="py-3 px-4 text-center text-primary fw-bold" style={{ width: '30%' }}>Primary Focus</td>
                  <td className="py-3 px-4 text-center" style={{ width: '30%' }}>Enterprise-first (Too complex)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4" style={{ width: '40%' }}><strong>Audit Readiness</strong></td>
                  <td className="py-3 px-4 text-center text-primary fw-bold" style={{ width: '30%' }}>Instant Exports</td>
                  <td className="py-3 px-4 text-center" style={{ width: '30%' }}>Often behind paywalls</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <section className="use-cases-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Who It's For</h2>
            <p className="fs-5 text-muted mb-0">Fast-moving teams that need speed and clarity</p>
          </div>

          <div className="row g-4">
            {useCases.map((useCase, index) => (
              <div key={index} className="col-lg-3 col-md-6 col-12">
                <div className="usecase-card card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <div className="usecase-card-header">
                      <div className="usecase-icon">
                        <useCase.icon size={22} className="text-primary" />
                      </div>
                      <h5 className="card-title fw-bold">{useCase.title}</h5>
                    </div>
                    <p className="card-text text-muted">{useCase.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST & COMPLIANCE SECTION */}
      <section className="trust-section py-5 bg-light">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-12 mb-4 mb-lg-0">
              <h2 className="display-5 fw-bold mb-4">Trust & Security</h2>
              <p className="fs-5 text-muted mb-4">
                Keep it simple. Your {labels.personSingular.toLowerCase()} data stays secure and accessible.
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
                    <h5 className="fw-bold">Secure by Default</h5>
                    <p className="text-muted">
                      Your {labels.personSingular.toLowerCase()} data stays protected without extra setup.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="pricing-section py-5" aria-labelledby="pricing-heading">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-primary mb-3">Plans & Pricing</span>
            <h2 id="pricing-heading" className="display-5 fw-bold mb-3">Simple, Transparent Pricing</h2>
            <p className="fs-5 text-muted mb-4 mx-auto" style={{ maxWidth: '600px' }}>
              Start free. Data for your first 20 records included.
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
                    className={`card h-100 border-0 shadow ${tier.highlighted ? 'shadow-lg border-primary border-2' : ''
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
                            <div className="pricing-price">
                              <span className="price-value">${tier.price}</span>
                              <span className="price-period">/month</span>
                            </div>
                            {billingCycle === 'year' && (
                              <div className="price-yearly">${(tier.price * 12 * 0.8).toFixed(0)}/year</div>
                            )}
                          </>
                        ) : (
                          <span className="pricing-price-alt">Custom pricing</span>
                        )}
                      </div>

                      <button
                        className={`btn ${tier.buttonColor === 'primary' ? 'btn-primary' : 'btn-outline-primary'
                          } btn-lg w-100 fw-semibold mb-4`}
                        onClick={startFree}
                      >
                        Start Free
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
                                    {feature.text}
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
                                    {feature.included ? 'Included' : 'Not included'}
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
                                      {feature.included ? 'Included' : 'Not included'}
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
                                    {feature.text}
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

      {/* CONTACT SECTION */}
      <section id="contact" className="contact-section py-5 bg-light" aria-labelledby="contact-heading">
        <div className="container">
          <h2 id="contact-heading" className="display-5 fw-bold text-center mb-5">Questions?</h2>

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
              <h3 className="fw-bold mb-4">Send us a message</h3>
              <form
                className="contact-form"
                onSubmit={handleContactSubmit}
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
                    value={contactForm.name}
                    onChange={(e) => handleContactChange('name', e.target.value)}
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
                    value={contactForm.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
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
                    value={contactForm.subject}
                    onChange={(e) => handleContactChange('subject', e.target.value)}
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
                    value={contactForm.message}
                    onChange={(e) => handleContactChange('message', e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg fw-semibold w-100"
                  disabled={contactStatus === 'sending'}
                >
                  {contactStatus === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
                {contactStatus === 'success' && (
                  <div className="contact-status contact-status-success" aria-live="polite">
                    Thanks! Your message has been sent.
                  </div>
                )}
                {contactStatus === 'error' && (
                  <div className="contact-status contact-status-error" aria-live="polite">
                    {contactError || 'Message failed to send. Please try again.'}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="cta-section py-5 position-relative overflow-hidden">
        <img
          src="/heroimg.png"
          alt="Busy office reception desk with people being greeted"
          className="cta-background"
        />
        <div className="cta-overlay"></div>
        <div className="container text-center position-relative">
          <div className="cta-content mx-auto" style={{ maxWidth: '600px' }}>
            <h2 className="display-5 fw-bold mb-3 text-white">
              Ready to move faster?
            </h2>
            <p className="fs-5 mb-4 text-white">
              Start free. Data for your first 20 {labels.personPlural.toLowerCase()}/{labels.hostPlural.toLowerCase()} included.
            </p>
            <button
              className="btn btn-primary btn-lg fw-semibold px-5 py-3 d-inline-flex align-items-center gap-2"
              onClick={startFree}
            >
              Start Free
              <span className="fs-5">&gt;</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

