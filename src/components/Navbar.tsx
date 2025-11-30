/**
 * Navbar Component
 * Consistent navigation header with branding across all pages
 */

import { Home } from 'lucide-react';
import './Navbar.css';

export interface NavbarProps {
  currentPage?: string;
  onNavigate?: (page: string) => void;
  userTier?: 'starter' | 'professional' | 'enterprise';
  showAppNav?: boolean;
}

export function Navbar({ currentPage, onNavigate, userTier = 'starter', showAppNav = true }: NavbarProps) {
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

        {/* App Navigation (shown when user is in app pages) */}
        {showAppNav && (
          <div className="navbar-menu">
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
          </div>
        )}

        {/* Right side: Tier badge + Home button */}
        <div className="navbar-right">
          {showAppNav && userTier && (
            <span className="navbar-tier-badge" title={`Subscription: ${userTier}`}>
              {userTier === 'starter' ? 'Starter' : userTier === 'professional' ? 'Professional' : 'Enterprise'}
            </span>
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
