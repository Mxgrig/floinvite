/**
 * Floinvite App
 * Main application component with routing and layout
 */

import { useState, useEffect } from 'react';
import { ClipboardList, BookOpen, Users, Settings as SettingsIcon, Shield, Bell, Clock3, Mail, ArrowUpRight } from 'lucide-react';
import { AppSettings } from './types';
import { Login } from './components/Login';
import { Pricing } from './components/Pricing';
import { SmartTriage } from './components/SmartTriage';
import { Logbook } from './components/Logbook';
import { HostManagement } from './components/HostManagement';
import { Settings } from './components/Settings';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Contact } from './components/Contact';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { Features } from './components/Features';
import { PaymentService } from './services/paymentService';
import { usePersistedState } from './utils/hooks';
import { STORAGE_KEYS } from './utils/constants';
import './App.css';

type AppPage = 'landing' | 'pricing' | 'features' | 'check-in' | 'logbook' | 'hosts' | 'settings' | 'contact' | 'privacy' | 'terms';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = usePersistedState('auth_token', false);
  const [currentPage, setCurrentPage] = useState<AppPage>('landing');
  const [userTier, setUserTier] = usePersistedState<'starter' | 'professional' | 'enterprise'>('floinvite_user_tier', 'starter');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [settings] = usePersistedState<AppSettings>(
    STORAGE_KEYS.settings,
    {
      businessName: 'My Company',
      notificationEmail: 'admin@floinvite.com',
      kioskMode: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('landing');
  };

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

  // Check screen size for mobile warning
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      case 'features':
        return <Features onNavigate={setCurrentPage} />;
      case 'check-in':
        return <SmartTriage />;
      case 'logbook':
        return <Logbook />;
      case 'hosts':
        return <HostManagement />;
      case 'settings':
        return <Settings />;
      case 'contact':
        return <Contact onNavigate={setCurrentPage} />;
      case 'privacy':
        return <PrivacyPolicy onNavigate={setCurrentPage} />;
      case 'terms':
        return <TermsOfService onNavigate={setCurrentPage} />;
      case 'landing':
      default:
        return <LandingPage onNavigate={setCurrentPage} onStartCheckIn={handleStartCheckIn} />;
    }
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} onNavigate={setCurrentPage} />;
  }

  return (
    <div className="floinvite-app">
      {/* Navbar - Hide in kiosk mode on check-in page */}
      {!(settings.kioskMode && currentPage === 'check-in') && (
        <Navbar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          userTier={userTier}
          showAppNav={currentPage !== 'pricing' && currentPage !== 'landing' && currentPage !== 'features'}
          onLogout={handleLogout}
        />
      )}

      {/* Mobile Warning - Show on screens < 768px */}
      {isMobile && (
        <div className="mobile-warning">
          <div className="mobile-warning-content">
            <h1>⚠️ Small Screen Detected</h1>
            <p>
              This app is optimized for <strong>tablets and desktops</strong> in landscape mode.
            </p>
            <p>
              For the best experience, please use a device with a minimum width of <strong>768px</strong> (iPad, tablet, or desktop).
            </p>
            <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>
              You can dismiss this message by rotating your device or using a larger screen.
            </p>
          </div>
        </div>
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

      {/* Footer - Show on all pages */}
      <Footer onNavigate={setCurrentPage} />
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
      {/* Hero Section - CLEAR VALUE PROP */}
      <section className="landing-hero">
        <div className="hero-content">
          {/* Brand Identity */}
          <div className="brand-lockup">
            <img src="/logo.png" alt="Floinvite" className="hero-logo" />
            <h1 className="brand-title">
              <span className="brand-flo">Flo</span>
              <span className="brand-invite">invite</span>
            </h1>
          </div>

          {/* Value Proposition */}
          <h2 className="hero-headline">
            Visitor management that just works
          </h2>
          <p className="hero-subheadline">
            Check in guests, notify hosts, and track visitors in seconds.
            <br />
            No hardware. No training. No hassle.
          </p>

          {/* Primary CTAs */}
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={onStartCheckIn}>
              Start First Check-In
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => onNavigate('pricing')}>
              View Pricing
            </button>
          </div>

          {/* Social Proof */}
          <div className="hero-proof">
            <div className="proof-item">
              <div className="proof-value">&lt; 30 sec</div>
              <div className="proof-label">Average check-in</div>
            </div>
            <div className="proof-item">
              <div className="proof-value">Offline-ready</div>
              <div className="proof-label">Works without internet</div>
            </div>
            <div className="proof-item">
              <div className="proof-value">Multi-channel</div>
              <div className="proof-label">Email + WhatsApp alerts</div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="hero-image">
          <img
            src="/heroimg.png"
            alt="Visitor management dashboard"
            className="hero-img"
          />
        </div>
      </section>

      {/* Features Section - KEEP SIMPLE */}
      <section className="features-section">
        <h3 className="features-title">Everything you need</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <ClipboardList size={28} />
            </div>
            <h4>Smart Check-In</h4>
            <p>Two-path flow for walk-ins and expected visitors</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Bell size={28} />
            </div>
            <h4>Instant Alerts</h4>
            <p>Email and WhatsApp notifications when guests arrive</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <BookOpen size={28} />
            </div>
            <h4>Complete Records</h4>
            <p>Searchable logbook with CSV/JSON exports</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Users size={28} />
            </div>
            <h4>Host Management</h4>
            <p>Easy directory with notification preferences</p>
          </div>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="cta-section">
        <h3>Ready to get started?</h3>
        <p>No credit card required. Works on any device.</p>
        <button className="btn btn-primary btn-lg" onClick={onStartCheckIn}>
          Launch Check-In
        </button>
      </section>
    </div>
  );
}

export default App;
