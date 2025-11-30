/**
 * Floinvite App
 * Main application component with routing and layout
 */

import { useState, useEffect } from 'react';
import { Pricing } from './components/Pricing';
import { SmartTriage } from './components/SmartTriage';
import { Logbook } from './components/Logbook';
import { HostManagement } from './components/HostManagement';
import { Settings } from './components/Settings';
import { PaymentService } from './services/paymentService';
import { usePersistedState } from './utils/hooks';
import './App.css';

type AppPage = 'landing' | 'pricing' | 'check-in' | 'logbook' | 'hosts' | 'settings';

export function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>('landing');
  const [userTier, setUserTier] = usePersistedState<'starter' | 'professional' | 'enterprise'>('floinvite_user_tier', 'starter');
  const [isLoading, setIsLoading] = useState(false);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      setIsLoading(true);
      const status = await PaymentService.getSubscriptionStatus();
      if (status) {
        setUserTier(status.tier);
      }
      setIsLoading(false);
    };

    checkSubscription();
  }, [setUserTier]);

  // Route to check-in if user is on starter or paid tier
  const handleStartCheckIn = () => {
    if (userTier === 'starter' || PaymentService.isSubscribed('professional') || PaymentService.isSubscribed('enterprise')) {
      setCurrentPage('check-in');
    } else {
      setCurrentPage('pricing');
    }
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'pricing':
        return <Pricing />;
      case 'check-in':
        return <SmartTriage />;
      case 'logbook':
        return <Logbook />;
      case 'hosts':
        return <HostManagement />;
      case 'settings':
        return <Settings />;
      case 'landing':
      default:
        return <LandingPage onNavigate={setCurrentPage} onStartCheckIn={handleStartCheckIn} />;
    }
  };

  return (
    <div className="floinvite-app">
      {/* Header/Navigation */}
      {currentPage !== 'landing' && currentPage !== 'pricing' && (
        <header className="app-header">
          <div className="header-content">
            <button
              className="logo-button"
              onClick={() => setCurrentPage('landing')}
              title="Back to home"
            >
              <span className="logo-icon">✉️</span>
              <span className="logo-text">Floinvite</span>
            </button>

            <nav className="app-nav">
              <button
                className={`nav-button ${currentPage === 'check-in' ? 'active' : ''}`}
                onClick={() => setCurrentPage('check-in')}
              >
                Check-In
              </button>
              <button
                className={`nav-button ${currentPage === 'logbook' ? 'active' : ''}`}
                onClick={() => setCurrentPage('logbook')}
              >
                Logbook
              </button>
              <button
                className={`nav-button ${currentPage === 'hosts' ? 'active' : ''}`}
                onClick={() => setCurrentPage('hosts')}
              >
                Hosts
              </button>
              <button
                className={`nav-button ${currentPage === 'settings' ? 'active' : ''}`}
                onClick={() => setCurrentPage('settings')}
              >
                Settings
              </button>
            </nav>

            <div className="user-info">
              <span className="tier-badge" title={`Subscription: ${userTier}`}>
                {userTier === 'starter' ? '⭐' : userTier === 'professional' ? '💎' : '👑'} {userTier}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="app-main">
        {isLoading ? (
          <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          renderPage()
        )}
      </main>

      {/* Footer */}
      {currentPage === 'landing' && (
        <footer className="app-footer">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} Floinvite. All rights reserved.</p>
            <div className="footer-links">
              <a href="#privacy">Privacy</a>
              <span className="divider">•</span>
              <a href="#terms">Terms</a>
              <span className="divider">•</span>
              <a href="#contact">Contact</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

/**
 * Landing Page - Welcome/Hero Section
 */
interface LandingPageProps {
  onNavigate: (page: AppPage) => void;
  onStartCheckIn: () => void;
}

function LandingPage({ onNavigate, onStartCheckIn }: LandingPageProps) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Visitor Management
            <br />
            <span className="highlight">Made Simple</span>
          </h1>
          <p className="hero-subtitle">
            Fast check-in. Instant notifications. Real-time guest tracking.
          </p>

          <div className="hero-buttons">
            <button className="btn btn-primary btn-lg" onClick={onStartCheckIn}>
              Start Check-In
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('pricing')}>
              View Pricing
            </button>
          </div>

          <div className="hero-features">
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span className="feature-text">30-second check-in</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Email + SMS alerts</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Works offline</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Export reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Floinvite?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-large">📱</div>
            <h3>Mobile First</h3>
            <p>Works perfectly on tablets, phones, and desktops. No special hardware needed.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-large">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Check in guests in under 30 seconds. Your team saves hours every day.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-large">🔔</div>
            <h3>Smart Notifications</h3>
            <p>Email and SMS alerts. Professional, friendly, or casual tone. Your choice.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-large">🏢</div>
            <h3>Built for SMEs</h3>
            <p>Perfect for 5-30 person offices. Simple pricing that scales with you.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-large">📊</div>
            <h3>Smart Reporting</h3>
            <p>Export guest data instantly. CSV, JSON, HTML, PDF. All client-side, zero servers.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-large">🔒</div>
            <h3>Privacy First</h3>
            <p>All data stays on your device. Optional encrypted cloud backup when you upgrade.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to get started?</h2>
        <p>Start with our free plan. No credit card required.</p>
        <button className="btn btn-primary btn-lg" onClick={onStartCheckIn}>
          Begin Check-In
        </button>
      </section>
    </div>
  );
}

export default App;
