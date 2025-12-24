/**
 * Footer Component
 * Consistent footer with branding, links, and copyright across all pages
 * Optimized for SEO with semantic structure and real `<a>` href links for crawlability
 */

import './Footer.css';

export interface FooterProps {
  onNavigate?: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  void onNavigate;

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-bottom">
        <p className="footer-copyright">
          &copy; {new Date().getFullYear()}{' '}
          <span className="brand-wordmark">
            <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
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
