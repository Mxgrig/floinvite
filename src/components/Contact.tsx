/**
 * Contact Page
 * Get in touch with Floinvite by xtenalyze
 */

import { Mail, MapPin, Phone } from 'lucide-react';
import { getLogoPath } from '../utils/logoHelper';
import './LegalPages.css';

export interface ContactProps {
  onNavigate?: (page: string) => void;
}

export function Contact({ onNavigate }: ContactProps) {
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
            <button className="legal-navbar-link legal-navbar-link-active" onClick={() => onNavigate?.('contact')}>
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
          <h1>Get in Touch</h1>
          <p className="legal-hero-description">Have questions about Floinvite? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="contact-container">
        <div className="contact-content">
          <div className="contact-grid">
            {/* Contact Methods */}
            <div className="contact-methods">
              <div className="contact-method">
                <Mail className="contact-icon" size={32} />
                <h3>Email</h3>
                <p>
                  <a href="mailto:admin@floinvite.com">admin@floinvite.com</a>
                </p>
                <p className="contact-note">We'll respond within 24 hours</p>
              </div>

              <div className="contact-method">
                <Phone className="contact-icon" size={32} />
                <h3>Phone</h3>
                <p>
                  <a href="tel:02045295067">020 4529 5067</a>
                </p>
                <p className="contact-note">Mon-Fri, 9:00 AM - 5:00 PM GMT</p>
              </div>

              <div className="contact-method">
                <MapPin className="contact-icon" size={32} />
                <h3>Office</h3>
                <p>
                  307 Goldfinger Court<br />
                  London, E16 6UN<br />
                  United Kingdom
                </p>
                <p className="contact-note">xtenalyze HQ</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>Send us a Message</h2>
              <form className="contact-form" onSubmit={(e) => {
                e.preventDefault();
                alert('Thank you for your message! We will get back to you soon at admin@floinvite.com');
              }}>
                <div className="form-group">
                  <label htmlFor="name">Your Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Your Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Tell us about your inquiry..."
                    rows={5}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary btn-large">
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* About xtenalyze */}
          <div className="xtenalyze-section">
            <h2>About xtenalyze</h2>
            <p>
              Floinvite is a product by <strong>xtenalyze</strong>, a professional technology services firm based in London, UK.
              We specialize in data analytics, custom application development, and IT solutions for businesses worldwide.
            </p>
            <p>
              Our mission is to help organizations harness the full potential of their data and technology investments
              by bridging complex technical solutions with practical business applications.
            </p>
            <a href="https://www.xtenalyze.co.uk" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              Visit xtenalyze →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
