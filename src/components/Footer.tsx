/**
 * Footer Component
 * Consistent footer with branding, links, and copyright across all pages
 * Optimized for SEO with semantic structure and descriptive links
 */

import { Mail, Phone, MapPin } from 'lucide-react';
import './Footer.css';

export interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-section footer-nav">
          <h3 className="footer-section-title">Navigation</h3>
          <nav className="footer-links" aria-label="Footer navigation">
            <button
              onClick={() => onNavigate?.('landing')}
              className="footer-link"
              aria-label="Return to home page"
            >
              Home
            </button>
            <button
              onClick={() => onNavigate?.('marketing')}
              className="footer-link"
              aria-label="View features and benefits"
            >
              Features
            </button>
            <button
              onClick={() => onNavigate?.('pricing')}
              className="footer-link"
              aria-label="View pricing plans"
            >
              Pricing
            </button>
          </nav>
        </div>

        <div className="footer-section footer-legal">
          <h3 className="footer-section-title">Legal</h3>
          <nav className="footer-links" aria-label="Legal and policies">
            <button
              onClick={() => onNavigate?.('privacy')}
              className="footer-link"
              aria-label="Read privacy policy"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => onNavigate?.('terms')}
              className="footer-link"
              aria-label="Read terms of service"
            >
              Terms of Service
            </button>
          </nav>
        </div>

        <div className="footer-section footer-contact">
          <h3 className="footer-section-title">Contact</h3>
          <address className="footer-contact-info">
            <div className="contact-item">
              <Mail size={16} aria-hidden="true" />
              <a href="mailto:admin@floinvite.com" aria-label="Email us at admin@floinvite.com">
                admin@floinvite.com
              </a>
            </div>
            <div className="contact-item">
              <Phone size={16} aria-hidden="true" />
              <a href="tel:+442045295067" aria-label="Call us at +44 20 4529 5067">
                +44 20 4529 5067
              </a>
            </div>
            <div className="contact-item">
              <MapPin size={16} aria-hidden="true" />
              <span>
                307 Goldfinger Court<br />
                London, E16 6UN<br />
                United Kingdom
              </span>
            </div>
          </address>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()}{' '}
          <span className="brand-wordmark">
            <span className="brand-wordmark-flo">flo</span>
            <span className="brand-wordmark-invite">invite</span>
          </span>{' '}
          — A product of{' '}
          <a 
            href="https://www.xtenalyze.co.uk" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Visit xtenalyze website"
          >
            xtenalyze
          </a>
        </p>
      </div>
    </footer>
  );
}
