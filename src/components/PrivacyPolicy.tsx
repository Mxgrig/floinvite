/**
 * Privacy Policy Page
 * Floinvite privacy commitment
 */

import { getLogoPath } from '../utils/logoHelper';
import './LegalPages.css';

export interface PrivacyPolicyProps {
  onNavigate?: (page: string) => void;
}

export function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
  return (
    <div className="legal-page">
      {/* Navbar for unauthenticated users */}
      <nav className="legal-navbar">
        <div className="legal-navbar-content">
          {/* Logo & Brand */}
          <button className="legal-navbar-brand" onClick={() => onNavigate?.('landing')}>
            <div className="legal-navbar-logo">
              <img src={getLogoPath()} alt="floinvite" />
            </div>
            <span className="brand-wordmark">
              <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
            </span>
          </button>

          {/* Navigation Links */}
          <div className="legal-navbar-links">
            <button className="legal-navbar-link" onClick={() => onNavigate?.('pricing')}>
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

      <div className="legal-hero">
        <div className="legal-hero-content">
          <button
            onClick={() => onNavigate?.('landing')}
            className="legal-brand-button"
            title="Back to home"
          >
            <div className="legal-brand">
              <img src={getLogoPath()} alt="floinvite" className="legal-logo" />
              <span className="legal-brand-text brand-wordmark">
                <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
              </span>
            </div>
          </button>
          <h1>Privacy Policy</h1>
          <p className="legal-hero-description">Your privacy and data protection are our top priorities</p>
        </div>
      </div>

      <div className="legal-container">
        <div className="legal-content">
          <p className="last-updated">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}</p>

        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>
            Floinvite ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when you use our visitor management system.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect on the site includes:</p>
          <ul>
            <li><strong>Personal Data:</strong> Name, email address, phone number, company name, and department information</li>
            <li><strong>Visitor Data:</strong> Guest names, contact information, check-in/check-out times, and visit history</li>
            <li><strong>Host Data:</strong> Employee names, notification preferences, and contact methods</li>
            <li><strong>Usage Data:</strong> App interactions, features used, and performance metrics</li>
            <li><strong>Device Data:</strong> Browser type, IP address, and device information</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>Floinvite uses the collected information for various purposes:</p>
          <ul>
            <li>To provide and maintain the visitor management service</li>
            <li>To notify hosts of visitor arrivals via email or WhatsApp</li>
            <li>To improve and optimize the application</li>
            <li>To comply with legal obligations</li>
            <li>To communicate with you about updates and changes</li>
            <li>To provide customer support</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Data Storage and Security</h2>
          <p>
            Your data is stored securely using browser-based storage (localStorage) on your device for MVP deployments.
            For production environments, we implement industry-standard encryption and security measures. We are committed
            to maintaining the confidentiality and integrity of your personal information.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Data Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. We may share information with:
          </p>
          <ul>
            <li>Service providers necessary to operate the application (e.g., email services, hosting providers)</li>
            <li>Legal authorities when required by law</li>
            <li>Your organization's administrators if you are an employee</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>6. User Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a standard format</li>
            <li>Withdraw consent for data processing</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:admin@floinvite.com">admin@floinvite.com</a></p>
        </section>

        <section className="legal-section">
          <h2>7. Data Retention</h2>
          <p>
            We retain your data for as long as necessary to provide our services. Visitor records older than 90 days
            may be automatically archived. You can delete your data at any time through the Settings page.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Cookies and Tracking</h2>
          <p>
            Floinvite uses localStorage to remember your preferences and application state. We do not use advertising
            cookies or third-party tracking services. Analytics may be collected to improve the application.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Children's Privacy</h2>
          <p>
            Floinvite is not intended for children under 13 years old. We do not knowingly collect personal information
            from children under 13.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Changes to Privacy Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will notify you of significant changes via email or
            through the application. Your continued use of Floinvite constitutes acceptance of updated policies.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our privacy practices, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:admin@floinvite.com">admin@floinvite.com</a><br />
            <strong>Address:</strong> 307 Goldfinger Court, London, E16 6UN, United Kingdom<br />
            <strong>Phone:</strong> <a href="tel:02045295067">020 4529 5067</a>
          </p>
        </section>
        </div>
      </div>
    </div>
  );
}
