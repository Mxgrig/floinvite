/**
 * Navbar Component
 * Consistent navigation header with branding across all pages
 */

import { Home, LogOut } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import './Navbar.css';

export interface NavbarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  userTier?: 'starter' | 'professional' | 'enterprise';
  showAppNav?: boolean;
  onLogout?: () => void;
}

export function Navbar({ currentPage, onNavigate, userTier = 'starter', showAppNav = true, onLogout }: NavbarProps) {
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
        { label: 'Check-In', page: 'check-in' },
        { label: 'Logbook', page: 'logbook' },
        { label: 'Hosts', page: 'hosts' },
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
            <img src="/logo.png" alt="Floinvite" />
          </div>
          <div className="navbar-brand-text">
            <span className="navbar-brand-flo">Flo</span>
            <span className="navbar-brand-invite">invite</span>
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
                Check-In
              </button>
              <button
                className={`navbar-link ${currentPage === 'logbook' ? 'active' : ''}`}
                onClick={() => handleNavClick('logbook')}
              >
                Logbook
              </button>
              <button
                className={`navbar-link ${currentPage === 'hosts' ? 'active' : ''}`}
                onClick={() => handleNavClick('hosts')}
              >
                Hosts
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
              {userTier === 'starter' ? 'Starter' : userTier === 'professional' ? 'Professional' : 'Enterprise'}
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
