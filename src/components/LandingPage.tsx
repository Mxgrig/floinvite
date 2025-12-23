/**
 * LandingPage Component
 * Main landing page with Sign In and Create Account navigation
 * Uses `<a>` href links for SEO crawlability
 */

import { LoopingVideo } from './LoopingVideo';
import './LandingPage.css';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onStartCheckIn: () => void;
}

export function LandingPage({ onNavigate, onStartCheckIn }: LandingPageProps) {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, page: string) => {
    e.preventDefault();
    onNavigate(page);
  };

  // Keep check-in handler available for future CTA wiring
  void onStartCheckIn;

  return (
    <div className="landing-page">
      <LoopingVideo source="/login.mp4" fallbackColor="#0b1220" />

      <div className="landing-overlay"></div>

      <div className="landing-container">
        <div className="landing-card">
          <div className="landing-brand">
            <img src="/xmas-logo.png" alt="floinvite" className="landing-logo" />
            <span className="landing-brand-name brand-wordmark">
              <span className="brand-wordmark-flo">flo</span>
              <span className="brand-wordmark-invite">invite</span>
            </span>
          </div>

          <h1 className="landing-title">
            Smart Visitor<br />
            Management, Simplified
          </h1>

          <p className="landing-subtitle">
            Secure check-in, instant logs, full visibility.
          </p>

          <div className="landing-buttons">
            <a
              href="/signin"
              className="landing-button landing-button-primary"
              onClick={(e) => handleNavClick(e, 'signin')}
            >
              Sign In
            </a>
            <a
              href="/register"
              className="landing-button landing-button-secondary"
              onClick={(e) => handleNavClick(e, 'createaccount')}
            >
              Create Account
            </a>
          </div>

          <a
            href="/features"
            className="landing-link"
            onClick={(e) => handleNavClick(e, 'marketing')}
          >
            Learn how this works <span className="arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
