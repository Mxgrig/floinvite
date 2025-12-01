/**
 * Footer Component
 * Consistent footer with branding, links, and copyright across all pages
 */

import './Footer.css';

export interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left: Branding */}
        <div className="footer-branding">
          <button
            onClick={() => onNavigate?.('landing')}
            className="footer-logo-button"
            title="Back to home"
          >
            <div className="footer-logo-icon">
              <img src="/logo.png" alt="Floinvite" />
            </div>
          </button>
          <div className="footer-brand-text">
            <span className="footer-brand-flo">Flo</span>
            <span className="footer-brand-invite">invite</span>
          </div>
          <p className="footer-tagline">Visitor management that just works</p>
          <p className="footer-company">A product of xtenalyze</p>
        </div>

        {/* Center: Links */}
        <div className="footer-links">
          <button
            onClick={() => onNavigate?.('privacy')}
            className="footer-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}
          >
            Privacy Policy
          </button>
          <span className="footer-divider">•</span>
          <button
            onClick={() => onNavigate?.('terms')}
            className="footer-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}
          >
            Terms of Service
          </button>
          <span className="footer-divider">•</span>
          <button
            onClick={() => onNavigate?.('contact')}
            className="footer-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0' }}
          >
            Contact
          </button>
        </div>

        {/* Right: Copyright */}
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} Floinvite. All rights reserved.</p>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="footer-bottom">
        <p className="footer-bottom-text">
          Floinvite by <a href="https://www.xtenalyze.co.uk" target="_blank" rel="noopener noreferrer">xtenalyze</a>
        </p>
      </div>
    </footer>
  );
}
