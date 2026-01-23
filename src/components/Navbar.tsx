/**
 * Navbar Component
 * Consistent navigation header with branding across all pages
 */

import { Home, LogOut } from 'lucide-react';
import { getLogoPath } from '../utils/logoHelper';
import { MobileMenu } from './MobileMenu';
import { usePersistedState } from '../utils/hooks';
import { STORAGE_KEYS } from '../utils/constants';
import { AppSettings } from '../types';
import { DEFAULT_LABELS, getLabelSettings } from '../utils/labelUtils';
import './Navbar.css';

export interface NavbarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  userTier?: 'starter' | 'compliance' | 'enterprise';
  showAppNav?: boolean;
  onLogout?: () => void;
}

export function Navbar({ currentPage, onNavigate, userTier = 'starter', showAppNav = true, onLogout }: NavbarProps) {
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
  const handleLogoClick = () => {
    if (onNavigate) {
      onNavigate('landing');
    }
  };

  const handleNavClick = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Mobile menu items
  const mobileMenuItems = showAppNav
    ? [
        { label: labels.checkIn, page: 'check-in' },
        { label: labels.logbook, page: 'logbook' },
        { label: labels.hostPlural, page: 'hosts' },
        { label: 'Evacuation', page: 'evacuation-list' },
        { label: 'Settings', page: 'settings' },
      ]
    : [
        { label: 'Pricing', page: 'pricing' },
        { label: 'Features', page: 'features' },
        { label: 'Contact', page: 'contact' },
      ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo & Branding */}
        <button className="navbar-brand" onClick={handleLogoClick} title="Back to home">
          <div className="navbar-logo-icon">
            <img src={getLogoPath()} alt="floinvite" />
          </div>
          <div className="navbar-brand-text brand-wordmark">
            <span className="brand-wordmark-flo">flo</span><span className="brand-wordmark-invite">invite</span>
          </div>
        </button>

        {/* Desktop Navigation Menu */}
        <div className="navbar-menu">
          {showAppNav ? (
            <>
              {/* App Navigation (shown when user is in app pages) */}
              <button
                className={`navbar-link ${currentPage === 'check-in' ? 'active' : ''}`}
                onClick={() => handleNavClick('check-in')}
              >
                {labels.checkIn}
              </button>
              <button
                className={`navbar-link ${currentPage === 'logbook' ? 'active' : ''}`}
                onClick={() => handleNavClick('logbook')}
              >
                {labels.logbook}
              </button>
              <button
                className={`navbar-link ${currentPage === 'hosts' ? 'active' : ''}`}
                onClick={() => handleNavClick('hosts')}
              >
                {labels.hostPlural}
              </button>
              <button
                className={`navbar-link ${currentPage === 'evacuation-list' ? 'active' : ''}`}
                onClick={() => handleNavClick('evacuation-list')}
              >
                Evacuation
              </button>
              <button
                className={`navbar-link ${currentPage === 'settings' ? 'active' : ''}`}
                onClick={() => handleNavClick('settings')}
              >
                Settings
              </button>
            </>
          ) : (
            <>
              {/* Landing Page Navigation */}
              <button
                className={`navbar-link ${currentPage === 'pricing' ? 'active' : ''}`}
                onClick={() => handleNavClick('pricing')}
              >
                Pricing
              </button>
              <button
                className={`navbar-link ${currentPage === 'features' ? 'active' : ''}`}
                onClick={() => handleNavClick('features')}
              >
                Features
              </button>
              <button
                className={`navbar-link ${currentPage === 'contact' ? 'active' : ''}`}
                onClick={() => handleNavClick('contact')}
              >
                Contact
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          items={mobileMenuItems}
          onNavigate={handleNavClick}
          currentPage={currentPage}
        />

        {/* Right side: Tier badge + Logout button + Home button (desktop only) */}
        <div className="navbar-right">
          {showAppNav && userTier && (
            <span className="navbar-tier-badge" title={`Subscription: ${userTier}`}>
              {userTier === 'starter' ? 'Starter' : userTier === 'compliance' ? 'Compliance+' : 'Enterprise'}
            </span>
          )}

          {showAppNav && onLogout && (
            <button
              className="navbar-logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}

          {!showAppNav && (
            <button
              className="navbar-home-button"
              onClick={handleLogoClick}
              title="Back to home"
            >
              <Home size={20} />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
