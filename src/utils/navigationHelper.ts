/**
 * Navigation Helper
 * Maps page names to URLs for SEO-friendly navigation
 * Supports both traditional anchor links and React routing
 */

type PageRoute = {
  page: string;
  href: string;
  label: string;
};

export const PAGE_ROUTES: Record<string, PageRoute> = {
  landing: { page: 'landing', href: '/', label: 'Home' },
  marketing: { page: 'marketing', href: '/features', label: 'Features' },
  pricing: { page: 'pricing', href: '/pricing', label: 'Pricing' },
  'check-in': { page: 'check-in', href: '/check-in', label: 'Check-In' },
  logbook: { page: 'logbook', href: '/logbook', label: 'Logbook' },
  hosts: { page: 'hosts', href: '/hosts', label: 'Hosts' },
  settings: { page: 'settings', href: '/settings', label: 'Settings' },
  privacy: { page: 'privacy', href: '/privacy', label: 'Privacy' },
  terms: { page: 'terms', href: '/terms', label: 'Terms' },
  signin: { page: 'signin', href: '/signin', label: 'Sign In' },
  createaccount: { page: 'createaccount', href: '/register', label: 'Create Account' },
};

/**
 * Get the href for a page
 * Used in <a href=""> attributes for SEO
 */
export function getPageHref(page: string): string {
  return PAGE_ROUTES[page]?.href || '/';
}

/**
 * Get the label for a page
 * Used for accessibility and display
 */
export function getPageLabel(page: string): string {
  return PAGE_ROUTES[page]?.label || 'Page';
}

/**
 * Handle navigation click with preventDefault
 * Allows <a> tags to work with React routing and crawlers
 */
export function handleNavigationClick(
  e: React.MouseEvent<HTMLAnchorElement>,
  onNavigate: (page: string) => void,
  page: string
): void {
  e.preventDefault();
  onNavigate(page);
}
