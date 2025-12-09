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
  return (
    <div className="landing-page">
      {/* Background Video */}
      <LoopingVideo source="/login.mp4" fallbackColor="#2d3748" />

      {/* Dark Overlay */}
      <div className="landing-overlay"></div>

      {/* Main Content */}
      <div className="landing-content">
        <div className="landing-card">
          {/* Logo */}
          <div className="landing-logo">
            <img src="/logo.png" alt="floinvite" />
          </div>

          {/* Business Name */}
          <h1 className="landing-title">
            <span className="brand-blue">flo</span><span className="brand-green">invite</span>
          </h1>

          {/* Heading */}
          <h2 className="landing-heading">
            Smart Visitor
            <br />
            Management, Simplified
          </h2>

          {/* Subheading */}
          <p className="landing-subheading">
            Secure check-in, instant logs, full visibility.
          </p>

          {/* CTA Buttons */}
          <div className="landing-buttons">
            <button
              className="landing-button landing-button-primary"
              onClick={() => onNavigate('signin')}
            >
              Sign In
            </button>
            <button
              className="landing-button landing-button-secondary"
              onClick={() => onNavigate('createaccount')}
            >
              Create Account
            </button>
          </div>

          {/* Learn More Link */}
          <button
            className="landing-learn-more"
            onClick={() => onNavigate('features')}
          >
            Learn how this works ’
          </button>
        </div>
      </div>
    </div>
  );
}
