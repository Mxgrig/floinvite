/**
 * Floinvite App
 * Main application component with routing and layout
 * Migrated to IndexedDB for persistent storage
 */

import { useState, useEffect } from 'react';
import { AppSettings } from './types';
import { SignInPage } from './components/SignInPage';
import { CreateAccountPage } from './components/CreateAccountPage';
import { TierSelectionPage } from './components/TierSelectionPage';
import { Pricing } from './components/Pricing';
import { VisitorCheckIn } from './components/VisitorCheckIn';
import { Logbook } from './components/Logbook';
import { HostManagement } from './components/HostManagement';
import { Settings } from './components/Settings';
import { EvacuationList } from './components/EvacuationList';
import { EmailMarketing } from './components/EmailMarketing';
import { EmailMarketingLoginPage } from './components/EmailMarketingLoginPage';
import { Footer } from './components/Footer';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { LandingPage } from './components/LandingPage';
import { MarketingPage } from './components/MarketingPage';
import { SessionVideoBackground } from './components/SessionVideoBackground';
import { PaymentService } from './services/paymentService';
import { MigrationService } from './services/migrationService';
import { usePersistedState, useInactivityLogout } from './utils/hooks';
import { UsageTracker } from './utils/usageTracker';
import { STORAGE_KEYS } from './utils/constants';
import { getPageHref, handleNavigationClick } from './utils/navigationHelper';
import './App.css';

type AppPage = 'landing' | 'signin' | 'createaccount' | 'tier-selection' | 'pricing' | 'marketing' | 'check-in' | 'logbook' | 'hosts' | 'settings' | 'evacuation-list' | 'email-marketing' | 'email-marketing-login' | 'privacy' | 'terms';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = usePersistedState('auth_token', false);
  const [isEmailMarketingAuthenticated, setIsEmailMarketingAuthenticated] = usePersistedState('floinvite_email_marketing_authenticated', false);
  const [currentPage, setCurrentPage] = useState<AppPage>('landing');
  const [userTier, setUserTier] = usePersistedState<'starter' | 'professional' | 'enterprise'>('floinvite_user_tier', 'starter');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState<'starter' | 'professional' | null>(null);
  const [selectedTierForSignup, setSelectedTierForSignup] = useState<'starter' | 'professional' | null>(null);
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

  // Handle tier selection during signup
  const handleTierSelected = (tier: 'starter' | 'professional') => {
    setSelectedTierForSignup(tier);
    // Both starter and professional proceed to account creation
    // No payment prompt - users can upgrade anytime they want
    setCurrentPage('createaccount');
  };

  // Setup inactivity logout (15 minutes default)
  // Only active when authenticated and not on login page
  useInactivityLogout(() => {
    handleLogout();
    console.log('Session logged out due to inactivity');
  }, 15);

  // Update URL when page changes
  const handlePageChange = (page: AppPage) => {
    setCurrentPage(page);
    const pathMap: Record<AppPage, string> = {
      'landing': '/',
      'signin': '/signin',
      'createaccount': '/createaccount',
      'tier-selection': '/tier-selection',
      'pricing': '/pricing',
      'marketing': '/marketing',
      'check-in': '/check-in',
      'logbook': '/logbook',
      'hosts': '/hosts',
      'settings': '/settings',
      'evacuation-list': '/evacuation-list',
      'email-marketing': '/email-marketing',
      'email-marketing-login': '/email-marketing-login',
      'privacy': '/privacy',
      'terms': '/terms'
    };
    const newPath = pathMap[page];
    if (newPath) {
      window.history.pushState({}, '', newPath);
    }
  };

  // Handle URL-based navigation
  useEffect(() => {
    const handleRouting = () => {
      const pathname = window.location.pathname;

      // Map URL paths to page names
      if (pathname.includes('/check-in')) {
        setCurrentPage('check-in');
      } else if (pathname.includes('/logbook')) {
        setCurrentPage('logbook');
      } else if (pathname.includes('/hosts')) {
        setCurrentPage('hosts');
      } else if (pathname.includes('/evacuation-list')) {
        setCurrentPage('evacuation-list');
      } else if (pathname.includes('/settings')) {
        setCurrentPage('settings');
      } else if (pathname.includes('/email-marketing-login')) {
        setCurrentPage('email-marketing-login');
      } else if (pathname.includes('/email-marketing')) {
        setCurrentPage('email-marketing');
      } else if (pathname.includes('/marketing')) {
        setCurrentPage('marketing');
      } else if (pathname.includes('/pricing')) {
        setCurrentPage('pricing');
      } else if (pathname.includes('/signin')) {
        setCurrentPage('signin');
      } else if (pathname.includes('/privacy')) {
        setCurrentPage('privacy');
      } else if (pathname.includes('/terms')) {
        setCurrentPage('terms');
      }
    };

    handleRouting();
    window.addEventListener('popstate', handleRouting);
    return () => window.removeEventListener('popstate', handleRouting);
  }, []);

  // Run migration from localStorage to IndexedDB on app start
  useEffect(() => {
    const runMigration = async () => {
      try {
        const status = await MigrationService.runMigration();
        console.log('Migration status:', status);
        if (status.errors.length > 0) {
          console.warn('Migration completed with errors:', status.errors);
        }
      } catch (error) {
        console.error('Migration failed:', error);
      }
    };

    runMigration();
  }, []);

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

  // Check usage and show upgrade prompt when needed
  useEffect(() => {
    if (isAuthenticated && userTier === 'starter') {
      // Re-check usage periodically (every 2 seconds) to catch when user exceeds limit
      const interval = setInterval(() => {
        const shouldShow = UsageTracker.shouldShowUpgradePrompt();
        setShowUpgradePrompt(shouldShow);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userTier]);

  // Route to check-in if user is on starter or paid tier
  const handleStartCheckIn = () => {
    if (userTier === 'starter' || userTier === 'starter-paid' || PaymentService.isSubscribed('professional') || PaymentService.isSubscribed('enterprise')) {
      setCurrentPage('check-in');
    } else {
      setCurrentPage('pricing');
    }
  };

  const handleUpgrade = async (tier: 'starter' | 'professional') => {
    setUpgradeLoading(tier);
    try {
      await PaymentService.createCheckoutSession(tier, 'month');
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Failed to initiate checkout. Please try again.');
      setUpgradeLoading(null);
    }
  };

  const handleUpgradeDismiss = () => {
    UsageTracker.dismissUpgradePrompt();
    setShowUpgradePrompt(false);
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'signin':
        return <SignInPage onLoginSuccess={() => setIsAuthenticated(true)} onNavigate={setCurrentPage} onLoginSuccessNavigate={setCurrentPage} currentPage={currentPage} />;
      case 'tier-selection':
        return <TierSelectionPage onTierSelected={handleTierSelected} onNavigate={setCurrentPage} />;
      case 'createaccount':
        return <CreateAccountPage onLoginSuccess={() => setIsAuthenticated(true)} onNavigate={setCurrentPage} onLoginSuccessNavigate={setCurrentPage} selectedTier={selectedTierForSignup} setUserTier={setUserTier} currentPage={currentPage} />;
      case 'pricing':
        return <Pricing onNavigate={setCurrentPage} />;
      case 'marketing':
        return <MarketingPage onNavigate={setCurrentPage} onStartCheckIn={handleStartCheckIn} />;
      case 'check-in':
        return <VisitorCheckIn />;
      case 'logbook':
        return <Logbook onNavigate={setCurrentPage} />;
      case 'hosts':
        return <HostManagement />;
      case 'evacuation-list':
        return <EvacuationList onNavigate={setCurrentPage} />;
      case 'email-marketing-login':
        return <EmailMarketingLoginPage onLoginSuccess={() => { setIsEmailMarketingAuthenticated(true); setCurrentPage('email-marketing'); }} onNavigate={setCurrentPage} />;
      case 'email-marketing':
        return isEmailMarketingAuthenticated ? <EmailMarketing onNavigate={setCurrentPage} /> : (() => { setCurrentPage('email-marketing-login'); return <EmailMarketingLoginPage onLoginSuccess={() => { setIsEmailMarketingAuthenticated(true); setCurrentPage('email-marketing'); }} onNavigate={setCurrentPage} />; })();
      case 'settings':
        return <Settings onNavigate={setCurrentPage} />;
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
  const publicPages = ['pricing', 'marketing', 'privacy', 'terms', 'signin', 'createaccount', 'tier-selection', 'landing', 'email-marketing-login'];
  if (!isAuthenticated && !publicPages.includes(currentPage)) {
    setCurrentPage('landing');
    return renderPage();
  }

  return (
    <div className="floinvite-app">
      {/* Upgrade Notice - Non-blocking */}
      {showUpgradePrompt && (
        <div className="upgrade-notice">
          <div className="upgrade-notice-content">
            <div className="upgrade-notice-text">
              <strong>Free limit reached.</strong> Continue on Starter for $5/month, or upgrade to Professional for unlimited access.
            </div>
            <div className="upgrade-notice-actions">
              <button
                className="upgrade-notice-primary"
                onClick={() => handleUpgrade('starter')}
                disabled={upgradeLoading !== null}
              >
                {upgradeLoading === 'starter' ? 'Processing...' : 'Pay $5/mo'}
              </button>
              <button
                className="upgrade-notice-secondary"
                onClick={() => handleUpgrade('professional')}
                disabled={upgradeLoading !== null}
              >
                {upgradeLoading === 'professional' ? 'Processing...' : 'Upgrade to $10'}
              </button>
              <button
                className="upgrade-notice-dismiss"
                onClick={handleUpgradeDismiss}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Video Background - Removed from all pages */}

      {/* Branding Header - Simple navigation */}
      {(isAuthenticated || currentPage === 'email-marketing' || currentPage === 'email-marketing-login') && currentPage !== 'email-marketing-login' && (
        <header className="branding-header">
          <div className="branding-content">
            <a href="/" className="branding-logo" onClick={(e) => handleNavigationClick(e, setCurrentPage, 'landing')} title="Back to home">
              <img src="/xmas-logo.png" alt="floinvite" />
              <span className="brand-wordmark">
                <span className="brand-wordmark-flo">flo</span>
                <span className="brand-wordmark-invite">invite</span>
              </span>
            </a>
            <nav className="branding-nav" role="navigation" aria-label="Main navigation">
              <a href={getPageHref('logbook')} onClick={(e) => handleNavigationClick(e, setCurrentPage, 'logbook')} className={currentPage === 'logbook' ? 'active' : ''}>
                Logbook
              </a>
              <a href={getPageHref('check-in')} onClick={(e) => handleNavigationClick(e, setCurrentPage, 'check-in')} className={currentPage === 'check-in' ? 'active' : ''}>
                Check-In
              </a>
              <a href={getPageHref('hosts')} onClick={(e) => handleNavigationClick(e, setCurrentPage, 'hosts')} className={currentPage === 'hosts' ? 'active' : ''}>
                Hosts
              </a>
              <button onClick={() => setCurrentPage('evacuation-list')} className={`evacuation-btn ${currentPage === 'evacuation-list' ? 'active' : ''}`} title="Emergency evacuation accountability list - for emergency use only" style={{background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem'}}>
                Evacuation
              </button>
              <a href={getPageHref('email-marketing')} onClick={(e) => { handleNavigationClick(e, setCurrentPage, isEmailMarketingAuthenticated ? 'email-marketing' : 'email-marketing-login'); }} className={currentPage === 'email-marketing' || currentPage === 'email-marketing-login' ? 'active' : ''}>
                Email
              </a>
              <a href={getPageHref('settings')} onClick={(e) => handleNavigationClick(e, setCurrentPage, 'settings')} className={currentPage === 'settings' ? 'active' : ''}>
                Settings
              </a>
              <a href="/" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="logout-btn">
                Logout
              </a>
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

      {/* Footer - Hidden on landing page and email marketing login */}
      <Footer onNavigate={setCurrentPage} hidden={currentPage === 'landing' || currentPage === 'email-marketing-login'} />
    </div>
  );
}

export default App;
