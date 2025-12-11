/**
 * Features Page Component
 * Comprehensive feature showcase for floinvite
 */

import { ClipboardList, Bell, BookOpen, Users, Clock, Zap, Lock, BarChart3, Download, Mail, Smartphone, Settings } from 'lucide-react';
import './Features.css';

interface FeaturesPageProps {
  onNavigate: (page: string) => void;
}

export function Features({ onNavigate }: FeaturesPageProps) {
  return (
    <div className="features-page">
      {/* Navbar for unauthenticated users */}
      <nav className="legal-navbar">
        <div className="legal-navbar-content">
          {/* Logo & Brand */}
          <button className="legal-navbar-brand" onClick={() => onNavigate('landing')}>
            <div className="legal-navbar-logo">
              <img src="/xmas-logo.png" alt="floinvite" />
            </div>
            <span>floinvite</span>
          </button>

          {/* Navigation Links */}
          <div className="legal-navbar-links">
            <button className="legal-navbar-link" onClick={() => onNavigate('pricing')}>
              Pricing
            </button>
            <button className="legal-navbar-link legal-navbar-link-active" onClick={() => onNavigate('features')}>
              Features
            </button>
            <button className="legal-navbar-link" onClick={() => onNavigate('contact')}>
              Contact
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="features-hero">
        <div className="hero-content">
          <h1 className="hero-title">Powerful Features for Visitor Management</h1>
          <p className="hero-subtitle">
            Everything you need to manage visitors efficiently. From check-in to notifications, we've got you covered.
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="features-grid-section">
        <div className="section-container">
          <h2 className="section-title">Core Features</h2>
          <div className="features-list-container">
            <div className="feature-category">
              <h3>Smart Check-In</h3>
              <ul className="feature-list">
                <li>✓ 30-second average check-in time</li>
                <li>✓ Two-path flow for walk-ins and expected guests</li>
                <li>✓ Works offline out of the box</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Instant Notifications</h3>
              <ul className="feature-list">
                <li>✓ Email notifications sent automatically</li>
                <li>✓ SMS support via carrier gateways</li>
                <li>✓ Customizable notification templates</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Complete Logbook</h3>
              <ul className="feature-list">
                <li>✓ Searchable visitor history</li>
                <li>✓ CSV/JSON export formats</li>
                <li>✓ Filtering by date, host, or visitor</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Host Management</h3>
              <ul className="feature-list">
                <li>✓ CSV bulk import for 100+ hosts</li>
                <li>✓ Per-host notification preferences</li>
                <li>✓ Department and role tracking</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Lightning Fast</h3>
              <ul className="feature-list">
                <li>✓ Real-time search and filtering</li>
                <li>✓ Optimized for mobile and tablet</li>
                <li>✓ Sub-second response times</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Secure by Default</h3>
              <ul className="feature-list">
                <li>✓ Password-protected access</li>
                <li>✓ No cloud data required</li>
                <li>✓ GDPR-ready architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="advanced-features-section">
        <div className="section-container">
          <h2 className="section-title">Advanced Features</h2>
          <div className="features-list-container">
            <div className="feature-category">
              <h3>Expected Guest Tracking</h3>
              <ul className="feature-list">
                <li>✓ Pre-register expected visitors</li>
                <li>✓ Automatic identification during check-in</li>
                <li>✓ Faster processing for returning guests</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Visitor Analytics</h3>
              <ul className="feature-list">
                <li>✓ Insights into visitor patterns</li>
                <li>✓ Identify busiest times</li>
                <li>✓ Host activity reports</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Data Export</h3>
              <ul className="feature-list">
                <li>✓ CSV format export</li>
                <li>✓ JSON format export</li>
                <li>✓ Compliance report generation</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Email Integration</h3>
              <ul className="feature-list">
                <li>✓ Seamless email notifications</li>
                <li>✓ Customizable email templates</li>
                <li>✓ Professional visitor experience</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Mobile Responsive</h3>
              <ul className="feature-list">
                <li>✓ Works on tablets and phones</li>
                <li>✓ Works on desktop browsers</li>
                <li>✓ Responsive design for all screens</li>
              </ul>
            </div>

            <div className="feature-category">
              <h3>Customization</h3>
              <ul className="feature-list">
                <li>✓ Custom business details</li>
                <li>✓ Notification preferences</li>
                <li>✓ Configurable check-in flow</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="features-comparison-section">
        <div className="section-container">
          <h2 className="section-title">Plan Comparison</h2>
          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Starter</th>
                  <th>Professional</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Smart Check-In</td>
                  <td className="check">✓</td>
                  <td className="check">✓</td>
                  <td className="check">✓</td>
                </tr>
                <tr>
                  <td>Email Notifications</td>
                  <td className="check">✓</td>
                  <td className="check">✓</td>
                  <td className="check">✓</td>
                </tr>
                <tr>
                  <td>Visitor Logbook</td>
                  <td className="check">✓</td>
                  <td className="check">✓</td>
                  <td className="check">✓</td>
                </tr>
                <tr>
                  <td>Host Management</td>
                  <td>Up to 10</td>
                  <td>Unlimited</td>
                  <td>Unlimited</td>
                </tr>
                <tr>
                  <td>Expected Guest Import</td>
                  <td className="x">–</td>
                  <td className="check">✓</td>
                  <td className="check">✓</td>
                </tr>
                <tr>
                  <td>SMS Notifications</td>
                  <td className="x">–</td>
                  <td className="check">✓</td>
                  <td className="check">✓</td>
                </tr>
                <tr>
                  <td>API Access</td>
                  <td className="x">–</td>
                  <td className="x">–</td>
                  <td className="check">✓</td>
                </tr>
                <tr>
                  <td>Custom Branding</td>
                  <td className="x">–</td>
                  <td className="x">–</td>
                  <td className="check">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="features-cta-section">
        <div className="cta-content">
          <h2>Ready to simplify visitor management?</h2>
          <p>Start with our Starter plan - no credit card required</p>
          <div className="cta-buttons">
            <button className="btn btn-primary btn-lg" onClick={() => onNavigate('check-in')}>
              Start Free Check-In
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('pricing')}>
              View Pricing
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
