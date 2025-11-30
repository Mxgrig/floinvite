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
          <div className="footer-logo-icon">
            <img src="/logo.png" alt="Floinvite" />
          </div>
          <div className="footer-brand-text">
            <span className="footer-brand-flo">Flo</span>
            <span className="footer-brand-invite">invite</span>
          </div>
          <p className="footer-tagline">Visitor management that just works</p>
        </div>

        {/* Center: Links */}
        <div className="footer-links">
          <a href="#privacy" className="footer-link">Privacy Policy</a>
          <span className="footer-divider">•</span>
          <a href="#terms" className="footer-link">Terms of Service</a>
          <span className="footer-divider">•</span>
          <a href="#contact" className="footer-link">Contact</a>
        </div>

        {/* Right: Copyright */}
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} Floinvite. All rights reserved.</p>
        </div>
      </div>

      {/* Bottom divider */}
      <div className="footer-bottom">
        <p className="footer-bottom-text">Built for modern visitor management</p>
      </div>
    </footer>
  );
}
