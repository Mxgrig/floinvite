/**
 * Breadcrumbs Component
 * Provides navigation breadcrumbs for SEO and user experience
 */

import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate?: (path: string) => void;
}

export function Breadcrumbs({ items, onNavigate }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs-nav">
      <ol className="breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="breadcrumb-item">
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  {item.path && onNavigate ? (
                    <button
                      onClick={() => onNavigate(item.path!)}
                      className="breadcrumb-link"
                      aria-label={`Navigate to ${item.label}`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span className="breadcrumb-link">{item.label}</span>
                  )}
                </>
              )}

              {!isLast && (
                <ChevronRight
                  size={16}
                  className="breadcrumb-separator"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>

      <style>{`
        .breadcrumbs-nav {
          padding: 1rem 0;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .breadcrumbs-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          list-style: none;
          margin: 0;
          padding: 0;
          gap: 0.5rem;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .breadcrumb-link {
          color: #0066cc;
          text-decoration: none;
          font-size: 0.95rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          border: none;
          background: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .breadcrumb-link:hover {
          background-color: #f0f0f0;
          text-decoration: underline;
        }

        .breadcrumb-link:focus {
          outline: 2px solid #4f46e5;
          outline-offset: 2px;
        }

        .breadcrumb-current {
          color: #666;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .breadcrumb-separator {
          color: #999;
          margin: 0 0.25rem;
        }

        @media (max-width: 640px) {
          .breadcrumbs-nav {
            padding: 0.75rem 0;
            margin-bottom: 0.75rem;
          }

          .breadcrumb-link,
          .breadcrumb-current {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </nav>
  );
}
