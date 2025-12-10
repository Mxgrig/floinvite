/**
 * Floinvite App
 * Main application component with routing and layout
 */

import { useState, useEffect } from 'react';
import { AppSettings } from './types';
import { SignInPage } from './components/SignInPage';
import { CreateAccountPage } from './components/CreateAccountPage';
import { Pricing } from './components/Pricing';
import { VisitorCheckIn } from './components/VisitorCheckIn';
import { Logbook } from './components/Logbook';
import { HostManagement } from './components/HostManagement';
import { Settings } from './components/Settings';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { LandingPage } from './components/LandingPage';
import { MarketingPage } from './components/MarketingPage';
import { SessionVideoBackground } from './components/SessionVideoBackground';
import { PaymentService } from './services/paymentService';
import { usePersistedState, useInactivityLogout } from './utils/hooks';
import { STORAGE_KEYS } from './utils/constants';
import './App.css';

type AppPage = 'landing' | 'signin' | 'createaccount' | 'pricing' | 'marketing' | 'check-in' | 'logbook' | 'hosts' | 'settings' | 'privacy' | 'terms';

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
      case 'signin':
        return <SignInPage onLoginSuccess={() => setIsAuthenticated(true)} onNavigate={setCurrentPage} onLoginSuccessNavigate={setCurrentPage} currentPage={currentPage} />;
      case 'createaccount':
        return <CreateAccountPage onLoginSuccess={() => setIsAuthenticated(true)} onNavigate={setCurrentPage} onLoginSuccessNavigate={setCurrentPage} currentPage={currentPage} />;
      case 'pricing':
        return <Pricing onNavigate={setCurrentPage} />;
      case 'marketing':
        return <MarketingPage onNavigate={setCurrentPage} onStartCheckIn={handleStartCheckIn} />;
      case 'check-in':
        return <VisitorCheckIn />;
      case 'logbook':
        return <Logbook />;
      case 'hosts':
        return <HostManagement />;
      case 'settings':
        return <Settings />;
      case 'privacy':
        return <PrivacyPolicy onNavigate={setCurrentPage} />;
      case 'terms':
        return <TermsOfService onNavigate={setCurrentPage} />;
      case 'landing':
      default:
        return <LandingPage onNavigate={setCurrentPage as (page: string) => void} onStartCheckIn={handleStartCheckIn} />;
    }
  };

  // Redirect to landing if not authenticated and trying to access protected pages
  const publicPages = ['pricing', 'marketing', 'privacy', 'terms', 'signin', 'createaccount', 'landing'];
  if (!isAuthenticated && !publicPages.includes(currentPage)) {
    setCurrentPage('landing');
    return renderPage();
  }

  return (
    <div className="floinvite-app">
      {/* Session Video Background - Removed from all pages */}

      {/* Branding Header - Simple navigation */}
      {isAuthenticated && (
        <header className="branding-header">
          <div className="branding-content">
            <button className="branding-logo" onClick={() => setCurrentPage('landing')} title="Back to home">
              <img src="/logo.png" alt="Floinvite" />
              <span>Floinvite</span>
            </button>
            <nav className="branding-nav">
              <button onClick={() => setCurrentPage('logbook')} className={currentPage === 'logbook' ? 'active' : ''}>
                Logbook
              </button>
              <button onClick={() => setCurrentPage('check-in')} className={currentPage === 'check-in' ? 'active' : ''}>
                Check-In
              </button>
              <button onClick={() => setCurrentPage('hosts')} className={currentPage === 'hosts' ? 'active' : ''}>
                Hosts
              </button>
              <button onClick={() => setCurrentPage('settings')} className={currentPage === 'settings' ? 'active' : ''}>
                Settings
              </button>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </nav>
          </div>
        </header>
      )}

      {/* Mobile Warning - Show only on authenticated app pages (not public pages) */}
      {isMobile && isAuthenticated && !publicPages.includes(currentPage) && (
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

export default App;
