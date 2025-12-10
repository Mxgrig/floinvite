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
      <div className="footer-content">
        <button
          onClick={() => onNavigate?.('privacy')}
          className="footer-link"
        >
          Privacy
        </button>
        <span className="footer-divider">•</span>
        <button
          onClick={() => onNavigate?.('terms')}
          className="footer-link"
        >
          Terms
        </button>
        <span className="footer-divider">•</span>
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()} Floinvite — A product of{' '}
          <a href="https://www.xtenalyze.co.uk" target="_blank" rel="noopener noreferrer">
            xtenalyze
          </a>
        </p>
      </div>
    </footer>
  );
}
