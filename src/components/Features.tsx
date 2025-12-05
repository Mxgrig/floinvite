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
      {/* Hero Section */}
      <section className="features-hero">
        <div className="hero-content">
          <h1 className="hero-title">Powerful Features for Visitor Management</h1>
          <p className="hero-subtitle">
            Everything you need to manage visitors efficiently. From check-in to notifications, we've got you covered.
          </p>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="features-grid-section">
        <div className="section-container">
          <h2 className="section-title">Core Features</h2>
          <div className="features-grid">
            {/* Feature 1: Smart Check-In */}
            <div className="feature-item">
              <div className="feature-icon">
                <ClipboardList size={32} />
              </div>
              <h3>Smart Check-In</h3>
              <p>Two-path visitor check-in flow optimized for speed. Handle walk-ins and expected visitors in seconds with our intuitive interface.</p>
              <ul className="feature-list">
                <li>30-second average check-in time</li>
                <li>Two-path flow for walk-ins and expected guests</li>
                <li>Works offline out of the box</li>
              </ul>
            </div>

            {/* Feature 2: Instant Notifications */}
            <div className="feature-item">
              <div className="feature-icon">
                <Bell size={32} />
              </div>
              <h3>Instant Notifications</h3>
              <p>Hosts are notified the moment a visitor arrives. Email and SMS alerts keep everyone in the loop.</p>
              <ul className="feature-list">
                <li>Email notifications sent automatically</li>
                <li>SMS support via carrier gateways</li>
                <li>Customizable notification templates</li>
              </ul>
            </div>

            {/* Feature 3: Complete Logbook */}
            <div className="feature-item">
              <div className="feature-icon">
                <BookOpen size={32} />
              </div>
              <h3>Complete Logbook</h3>
              <p>Comprehensive visitor records with advanced search and export capabilities. Keep a permanent audit trail.</p>
              <ul className="feature-list">
                <li>Searchable visitor history</li>
                <li>CSV/JSON export formats</li>
                <li>Filtering by date, host, or visitor</li>
              </ul>
            </div>

            {/* Feature 4: Host Management */}
            <div className="feature-item">
              <div className="feature-icon">
                <Users size={32} />
              </div>
              <h3>Host Management</h3>
              <p>Easily manage your employee directory with custom notification preferences and bulk imports.</p>
              <ul className="feature-list">
                <li>CSV bulk import for 100+ hosts</li>
                <li>Per-host notification preferences</li>
                <li>Department and role tracking</li>
              </ul>
            </div>

            {/* Feature 5: Speed & Performance */}
            <div className="feature-item">
              <div className="feature-icon">
                <Zap size={32} />
              </div>
              <h3>Lightning Fast</h3>
              <p>Optimized for performance on any device. Instant search, filtering, and navigation with zero lag.</p>
              <ul className="feature-list">
                <li>Real-time search and filtering</li>
                <li>Optimized for mobile and tablet</li>
                <li>Sub-second response times</li>
              </ul>
            </div>

            {/* Feature 6: Security & Privacy */}
            <div className="feature-item">
              <div className="feature-icon">
                <Lock size={32} />
              </div>
              <h3>Secure by Default</h3>
              <p>Your visitor data is protected with password authentication and secure local storage.</p>
              <ul className="feature-list">
                <li>Password-protected access</li>
                <li>No cloud data required</li>
                <li>GDPR-ready architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="advanced-features-section">
        <div className="section-container">
          <h2 className="section-title">Advanced Features</h2>
          <div className="advanced-features">
            <div className="advanced-feature-row">
              <div className="advanced-feature">
                <div className="advanced-icon">
                  <Clock size={24} />
                </div>
                <h4>Expected Guest Tracking</h4>
                <p>Pre-register expected visitors and automatically identify them during check-in for faster processing.</p>
              </div>
              <div className="advanced-feature">
                <div className="advanced-icon">
                  <BarChart3 size={24} />
                </div>
                <h4>Visitor Analytics</h4>
                <p>Get insights into visitor patterns, busiest times, and host activity with detailed reports.</p>
              </div>
              <div className="advanced-feature">
                <div className="advanced-icon">
                  <Download size={24} />
                </div>
                <h4>Data Export</h4>
                <p>Export all visitor records in CSV or JSON format for use in external systems or compliance reports.</p>
              </div>
            </div>
            <div className="advanced-feature-row">
              <div className="advanced-feature">
                <div className="advanced-icon">
                  <Mail size={24} />
                </div>
                <h4>Email Integration</h4>
                <p>Seamless email notifications with customizable templates for a professional visitor experience.</p>
              </div>
              <div className="advanced-feature">
                <div className="advanced-icon">
                  <Smartphone size={24} />
                </div>
                <h4>Mobile Responsive</h4>
                <p>Works perfectly on tablets, phones, and desktops with a responsive design that adapts to any screen.</p>
              </div>
              <div className="advanced-feature">
                <div className="advanced-icon">
                  <Settings size={24} />
                </div>
                <h4>Customization</h4>
                <p>Customize business details, notification preferences, and check-in flow to match your needs.</p>
              </div>
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
