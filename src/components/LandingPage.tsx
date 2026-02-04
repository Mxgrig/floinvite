/**
 * LandingPage Component
 * Main landing page with Sign In and Create Account navigation
 * Uses `<a>` href links for SEO crawlability
 */

import { useState } from 'react';
import { Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { getLogoPath } from '../utils/logoHelper';
import { LoopingVideo } from './LoopingVideo';
import { usePersistedState } from '../utils/hooks';
import { STORAGE_KEYS } from '../utils/constants';
import { AppSettings } from '../types';
import { DEFAULT_LABELS, getLabelSettings } from '../utils/labelUtils';
import './LandingPage.css';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onStartCheckIn: () => void;
}

export function LandingPage({ onNavigate, onStartCheckIn }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings] = usePersistedState<AppSettings>(STORAGE_KEYS.settings, {
    businessName: 'My Company',
    notificationEmail: 'admin@floinvite.com',
    kioskMode: false,
    labelPreset: 'default',
    labelSettings: DEFAULT_LABELS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const labels = getLabelSettings(settings);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, page: string) => {
    e.preventDefault();
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  // Keep check-in handler available for future CTA wiring
  void onStartCheckIn;

  return (
    <div className="landing-page">
      <LoopingVideo source="/login.mp4" fallbackColor="#0b1220" />

      <div className="landing-overlay"></div>

      {/* Hamburger Navigation */}
      <div className="landing-navbar">
        <div className="landing-navbar-content">
          <button
            className="hamburger-button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="landing-mobile-menu">
            <div className="mobile-menu-section">
              <span className="mobile-menu-title">Navigation</span>
              <a
                href="/features"
                onClick={(e) => handleNavClick(e, 'marketing')}
                className="mobile-menu-link"
              >
                Features
              </a>
              <a
                href="/pricing"
                onClick={(e) => handleNavClick(e, 'pricing')}
                className="mobile-menu-link"
              >
                Pricing
              </a>
            </div>

            <div className="mobile-menu-section">
              <span className="mobile-menu-title">Legal</span>
              <a
                href="/privacy"
                onClick={(e) => handleNavClick(e, 'privacy')}
                className="mobile-menu-link"
              >
                Privacy
              </a>
              <a
                href="/terms"
                onClick={(e) => handleNavClick(e, 'terms')}
                className="mobile-menu-link"
              >
                Terms
              </a>
            </div>

            <div className="mobile-menu-section">
              <span className="mobile-menu-title">Contact</span>
              <a className="mobile-menu-link mobile-menu-contact-item" href="mailto:admin@floinvite.com">
                <Mail size={16} aria-hidden="true" />
                admin@floinvite.com
              </a>
              <a className="mobile-menu-link mobile-menu-contact-item" href="tel:+442045295067">
                <Phone size={16} aria-hidden="true" />
                +44 20 4529 5067
              </a>
              <span className="mobile-menu-contact-item mobile-menu-contact">
                <MapPin size={16} aria-hidden="true" />
                <span>
                  307 Goldfinger Court<br />
                  London, E16 6UN<br />
                  United Kingdom
                </span>
              </span>
            </div>
          </nav>
        )}
      </div>

      <div className="landing-container">
        <div className="landing-card">
          <div className="landing-brand">
            <img src={getLogoPath()} alt="floinvite" className="landing-logo" />
            <span className="landing-brand-name brand-wordmark">
              <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
            </span>
          </div>

          <h1 className="landing-title">
            SME Site Access<br />
            Fast & Hardware-Free
          </h1>

          <p className="landing-subtitle">
            Check-in in 30 seconds. No kiosks. No iPads. Just simple, audit-ready site access.
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
            Learn how this works <span className="arrow">&gt;</span>
          </a>
        </div>
      </div>
    </div>
  );
}
