/**
 * Mobile Menu Component
 * Hamburger menu for mobile navigation
 */

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import './MobileMenu.css';

export interface MobileMenuProps {
  items: {
    label: string;
    page: string;
  }[];
  onNavigate: (page: string) => void;
  currentPage?: string;
}

export function MobileMenu({ items, onNavigate, currentPage }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when clicking on a link
  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsOpen(false);
  };

  // Close menu when pressing Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent scrolling when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="mobile-menu-wrapper">
      {/* Hamburger Button */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <Menu size={24} />
        )}
      </button>

      {/* Menu Overlay (Backdrop) */}
      {isOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Menu Panel */}
      <div
        id="mobile-menu-panel"
        className={`mobile-menu-panel ${isOpen ? 'open' : ''}`}
      >
        <nav className="mobile-menu-content">
          {items.map((item) => (
            <button
              key={item.page}
              className={`mobile-menu-item ${
                currentPage === item.page ? 'active' : ''
              }`}
              onClick={() => handleNavigate(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
