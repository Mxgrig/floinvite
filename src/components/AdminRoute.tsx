/**
 * Admin Route Protection
 * Restricts access to admin pages based on user role
 */

import React from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'webmaster';
  userRole?: string;
  onAccessDenied?: () => void;
}

export function AdminRoute({
  children,
  requiredRole = 'admin',
  userRole = 'user',
  onAccessDenied
}: AdminRouteProps) {
  // Check if user has required role
  const hasAccess = userRole === requiredRole || userRole === 'admin' || userRole === 'webmaster';

  if (!hasAccess) {
    // If callback provided, call it (can redirect)
    if (onAccessDenied) {
      onAccessDenied();
    }
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '3rem 2rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <h1 style={{ margin: '0 0 1rem 0', color: '#1f2937', fontSize: '24px' }}>
            Access Denied
          </h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            You don't have permission to access this page. This page is restricted to webmaster users only.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
