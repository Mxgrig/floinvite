/**
 * LandingPage Component
 * Main landing page with Sign In and Create Account navigation
 */

import { LoopingVideo } from './LoopingVideo';
import './LandingPage.css';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onStartCheckIn: () => void;
}

export function LandingPage({ onNavigate, onStartCheckIn }: LandingPageProps) {
  // Keep check-in handler available for future CTA wiring
  void onStartCheckIn;

  return (
    <div className="landing-page">
      <LoopingVideo source="/login.mp4" fallbackColor="#0b1220" />

      <div className="landing-overlay"></div>

      <div className="landing-container">
        <div className="landing-card">
          <div className="landing-brand">
            <img src="/xmas-logo.png" alt="Floinvite" className="landing-logo" />
            <span className="landing-brand-name">Floinvite</span>
          </div>

          <h1 className="landing-title">
            Smart Visitor<br />
            Management, Simplified
          </h1>

          <p className="landing-subtitle">
            Secure check-in, instant logs, full visibility.
          </p>

          <div className="landing-buttons">
            <button
              className="landing-button landing-button-primary"
              onClick={() => onNavigate('signin')}
            >
              Sign In
            </button>
            <button
              className="landing-button landing-button-secondary"
              onClick={() => onNavigate('tier-selection')}
            >
              Create Account
            </button>
          </div>

          <button
            className="landing-link"
            onClick={() => onNavigate('marketing')}
          >
            Learn how this works <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
