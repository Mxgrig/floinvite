/**
 * 404 Not Found Page
 * SEO-friendly error page with helpful navigation
 */

import { Home, Search, HelpCircle } from 'lucide-react';

interface NotFoundPageProps {
  onNavigate: (page: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <main className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-heading">Page Not Found</h2>
          
          <p className="not-found-description">
            The page you're looking for doesn't exist or has been moved. 
            Let's help you get back on track.
          </p>

          <div className="not-found-actions">
            <button
              onClick={() => onNavigate('landing')}
              className="not-found-button primary"
              aria-label="Return to home page"
            >
              <Home size={20} />
              <span>Back to Home</span>
            </button>

            <button
              onClick={() => onNavigate('marketing')}
              className="not-found-button secondary"
              aria-label="View our marketing page"
            >
              <Search size={20} />
              <span>View Features</span>
            </button>
          </div>

          <div className="not-found-suggestions">
            <h3>Popular Pages</h3>
            <ul>
              <li>
                <button onClick={() => onNavigate('landing')} className="suggestion-link">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="suggestion-link">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('marketing')} className="suggestion-link">
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="suggestion-link">
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          <div className="not-found-contact">
            <HelpCircle size={20} />
            <p>
              Still having trouble? <a href="mailto:admin@floinvite.com">Contact us</a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .not-found-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }

        .not-found-container {
          width: 100%;
          max-width: 500px;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .not-found-content {
          padding: 3rem 2rem;
          text-align: center;
        }

        .not-found-title {
          font-size: 6rem;
          font-weight: 900;
          color: #667eea;
          margin: 0 0 1rem;
          line-height: 1;
        }

        .not-found-heading {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 1rem;
        }

        .not-found-description {
          font-size: 1rem;
          color: #6b7280;
          margin: 0 0 2rem;
          line-height: 1.6;
        }

        .not-found-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .not-found-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1rem;
        }

        .not-found-button.primary {
          background-color: #667eea;
          color: white;
        }

        .not-found-button.primary:hover {
          background-color: #5568d3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .not-found-button.secondary {
          background-color: #e5e7eb;
          color: #1f2937;
        }

        .not-found-button.secondary:hover {
          background-color: #d1d5db;
          transform: translateY(-2px);
        }

        .not-found-suggestions {
          margin: 2rem 0;
          padding: 2rem 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .not-found-suggestions h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #6b7280;
          margin: 0 0 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .not-found-suggestions ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
        }

        .suggestion-link {
          background: none;
          border: none;
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }

        .suggestion-link:hover {
          color: #5568d3;
          text-decoration: underline;
        }

        .not-found-contact {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          color: #6b7280;
          font-size: 0.95rem;
        }

        .not-found-contact a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .not-found-contact a:hover {
          color: #5568d3;
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .not-found-page {
            min-height: auto;
            padding: 1rem;
          }

          .not-found-content {
            padding: 2rem 1.5rem;
          }

          .not-found-title {
            font-size: 4rem;
          }

          .not-found-heading {
            font-size: 1.5rem;
          }

          .not-found-actions {
            flex-direction: column;
          }

          .not-found-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </main>
  );
}
