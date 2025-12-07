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
import { SessionVideoBackground } from './components/SessionVideoBackground';
import { PaymentService } from './services/paymentService';
import { usePersistedState, useInactivityLogout } from './utils/hooks';
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

  // Setup inactivity logout (15 minutes default)
  // Only active when authenticated and not on login page
  useInactivityLogout(() => {
    handleLogout();
    console.log('Session logged out due to inactivity');
  }, 15);

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
        return <Pricing onNavigate={setCurrentPage} />;
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

  // Show login screen if not authenticated (but allow public pages: pricing, features, contact, privacy, terms)
  const publicPages = ['pricing', 'features', 'contact', 'privacy', 'terms'];
  if (!isAuthenticated && !publicPages.includes(currentPage)) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} onNavigate={setCurrentPage} currentPage={currentPage} />;
  }

  return (
    <div className="floinvite-app">
      {/* Session Video Background - Only on app pages, not on landing/pricing/features */}
      {currentPage !== 'pricing' && currentPage !== 'landing' && currentPage !== 'features' && (
        <SessionVideoBackground />
      )}

      {/* Navbar - Hide in kiosk mode on check-in page, hide for unauthenticated users on public pages */}
      {!(settings.kioskMode && currentPage === 'check-in') && !(publicPages.includes(currentPage) && !isAuthenticated) && (
        <Navbar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          userTier={userTier}
          showAppNav={isAuthenticated && currentPage !== 'pricing' && currentPage !== 'landing' && currentPage !== 'features'}
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
      {/* Hero Section */}
      <section className="landing-hero-new">
        <div className="hero-wrapper">
          {/* Left Content */}
          <div className="hero-left">
            {/* Badge */}
            <div className="hero-badge">
              <span>🚀 Fast, Simple, Powerful</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-title">
              Visitor Management
              <span className="gradient-text"> That Actually Works</span>
            </h1>

            {/* Subheadline */}
            <p className="hero-description">
              Check in guests in seconds, notify hosts instantly, and maintain complete visitor records. Built for businesses that care about their guests.
            </p>

            {/* Primary CTA */}
            <div className="hero-cta-group">
              <button className="btn btn-primary btn-lg btn-icon" onClick={onStartCheckIn}>
                <span>Start Free Check-In</span>
                <span>→</span>
              </button>
              <button className="btn btn-outline btn-lg" onClick={() => onNavigate('pricing')}>
                View Pricing
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="hero-trust">
              <div className="trust-item">
                <span className="trust-icon">✓</span>
                <span className="trust-text">No credit card required</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✓</span>
                <span className="trust-text">Works on all devices</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✓</span>
                <span className="trust-text">Offline ready</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="hero-right">
            <div className="hero-image-wrapper">
              <img
                src="/heroimg.png"
                alt="Visitor management dashboard"
                className="hero-image"
              />
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="hero-stats">
          <div className="stat-item">
            <div className="stat-number">30s</div>
            <div className="stat-label">Average Check-in</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Offline Ready</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">Multi</div>
            <div className="stat-label">Channel Alerts</div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="features-section-new">
        <div className="features-container">
          {/* Header */}
          <div className="features-header">
            <h2>Everything You Need</h2>
            <p>Comprehensive features for modern visitor management</p>
          </div>

          {/* Features Grid */}
          <div className="features-grid-new">
            <div className="feature-card-new">
              <div className="feature-icon-new">
                <ClipboardList size={32} />
              </div>
              <h3>Smart Check-In</h3>
              <p>Two-path flow optimized for both walk-ins and expected visitors. Get guests checked in in under 30 seconds.</p>
              <a href="#" className="feature-link">Learn more →</a>
            </div>

            <div className="feature-card-new">
              <div className="feature-icon-new">
                <Bell size={32} />
              </div>
              <h3>Instant Alerts</h3>
              <p>Hosts get notified immediately when guests arrive. Email, SMS, or WhatsApp - your choice.</p>
              <a href="#" className="feature-link">Learn more →</a>
            </div>

            <div className="feature-card-new">
              <div className="feature-icon-new">
                <BookOpen size={32} />
              </div>
              <h3>Complete Records</h3>
              <p>Searchable visitor logbook with advanced filtering and export options. CSV, JSON, and more.</p>
              <a href="#" className="feature-link">Learn more →</a>
            </div>

            <div className="feature-card-new">
              <div className="feature-icon-new">
                <Users size={32} />
              </div>
              <h3>Host Management</h3>
              <p>Easy employee directory with customizable notification preferences and bulk import from CSV.</p>
              <a href="#" className="feature-link">Learn more →</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Final */}
      <section className="cta-section-new">
        <div className="cta-content">
          <div className="cta-text">
            <h2>Ready to transform your visitor management?</h2>
            <p>Join businesses that have simplified their check-in process and improved guest experience.</p>
          </div>
          <button className="btn btn-primary btn-lg btn-icon" onClick={onStartCheckIn}>
            <span>Get Started Free</span>
            <span>→</span>
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
