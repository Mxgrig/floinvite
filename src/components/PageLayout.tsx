/**
 * PageLayout Component
 * Consistent page template for all app pages
 * Provides: hero section, page header, stats, and content area
 */

import React from 'react';

interface StatItem {
  value: string;
  label: string;
}

interface PageLayoutProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  stats?: StatItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({
  eyebrow,
  title,
  subtitle,
  stats,
  actions,
  children
}: PageLayoutProps) {
  return (
    <div className="page-container">
      {/* Hero / Header Section */}
      <div className="page-hero">
        <div className="page-header">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>

        {/* Stats Grid */}
        {stats && stats.length > 0 && (
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons (if provided) */}
      {actions && <div className="page-actions">{actions}</div>}

      {/* Main Content */}
      <div className="page-content">{children}</div>
    </div>
  );
}

export default PageLayout;
