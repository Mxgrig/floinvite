/**
 * Terms of Service Page
 * Floinvite terms and conditions
 */

import './LegalPages.css';

export interface TermsOfServiceProps {
  onNavigate?: (page: string) => void;
}

export function TermsOfService({ onNavigate }: TermsOfServiceProps) {
  return (
    <div className="legal-page">
      <div className="legal-hero">
        <div className="legal-hero-content">
          <button
            onClick={() => onNavigate?.('landing')}
            className="legal-brand-button"
            title="Back to home"
          >
            <div className="legal-brand">
              <img src="/logo.png" alt="Floinvite" className="legal-logo" />
              <span className="legal-brand-text">Floinvite</span>
            </div>
          </button>
          <h1>Terms of Service</h1>
          <p className="legal-hero-description">Understanding the terms and conditions of using Floinvite</p>
        </div>
      </div>

      <div className="legal-container">
        <div className="legal-content">
          <p className="last-updated">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}</p>

        <section className="legal-section">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing and using Floinvite, you accept and agree to be bound by the terms and provision of this agreement.
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Use License</h2>
          <p>
            Floinvite grants you a limited, non-exclusive, non-transferable license to use the application for lawful
            visitor management purposes only. You agree not to:
          </p>
          <ul>
            <li>Reverse engineer, decompile, or disassemble the application</li>
            <li>Use the application for illegal or unauthorized purposes</li>
            <li>Attempt to gain unauthorized access to the system</li>
            <li>Interfere with or disrupt the service or its infrastructure</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Infringe on intellectual property rights</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. User Responsibilities</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account and password. You agree to accept
            responsibility for all activities that occur under your account. You must immediately notify us of any
            unauthorized use of your account.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Data Accuracy</h2>
          <p>
            You agree to provide accurate, current, and complete information about visitors and hosts. You are responsible
            for the accuracy of all data entered into Floinvite. We are not responsible for any consequences arising from
            inaccurate information.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Visitor and Host Consent</h2>
          <p>
            You confirm that you have the authority to collect and process information about visitors and hosts. You must
            obtain necessary consent from individuals before entering their personal information into the system. You are
            responsible for compliance with data protection laws in your jurisdiction.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Notifications</h2>
          <p>
            Floinvite provides email and WhatsApp notification services to notify hosts of visitor arrivals. These
            notifications are delivered as-is and may experience delays or failures. We are not responsible for missed
            or failed notifications.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Data Backup</h2>
          <p>
            While we implement security measures, we are not liable for data loss, corruption, or unauthorized access.
            You are responsible for maintaining backups of your data. We recommend regular exports of your visitor and
            host information.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Service Availability</h2>
          <p>
            Floinvite is provided on an "AS-IS" and "AS-AVAILABLE" basis. We do not guarantee uninterrupted or
            error-free service. We may perform maintenance or updates that temporarily affect availability.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Floinvite and Xtenalyze shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages resulting from your use of or inability to use
            the service, including but not limited to loss of data, revenue, or business.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Disclaimer of Warranties</h2>
          <p>
            Floinvite is provided without warranty of any kind, express or implied. We make no warranty that the service
            will meet your requirements or that it will be uninterrupted, timely, secure, or error-free.
          </p>
        </section>

        <section className="legal-section">
          <h2>11. Modifications to Service</h2>
          <p>
            We reserve the right to modify or discontinue the service at any time, with or without notice. We will not
            be liable to you for any modification, suspension, or discontinuance of the service.
          </p>
        </section>

        <section className="legal-section">
          <h2>12. Termination</h2>
          <p>
            Your right to use Floinvite terminates automatically if you violate any provision of these terms. We may
            also suspend or terminate your access at our sole discretion. Upon termination, your right to use the
            service ceases immediately.
          </p>
        </section>

        <section className="legal-section">
          <h2>13. Intellectual Property</h2>
          <p>
            Floinvite and all associated content are the exclusive property of Xtenalyze and protected by copyright and
            intellectual property laws. You may not copy, modify, reproduce, or distribute any part of the application
            without permission.
          </p>
        </section>

        <section className="legal-section">
          <h2>14. Governing Law</h2>
          <p>
            These Terms of Service are governed by and construed in accordance with the laws of the United Kingdom, and
            you irrevocably submit to the exclusive jurisdiction of the courts located in England and Wales.
          </p>
        </section>

        <section className="legal-section">
          <h2>15. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> <a href="mailto:admin@floinvite.com">admin@floinvite.com</a><br />
            <strong>Address:</strong> 307 Goldfinger Court, London, E16 6UN, United Kingdom<br />
            <strong>Phone:</strong> <a href="tel:02045295067">020 4529 5067</a>
          </p>
        </section>

        <section className="legal-section">
          <h2>16. Severability</h2>
          <p>
            If any provision of these Terms of Service is found to be invalid or unenforceable, the remaining provisions
            will remain in full force and effect.
          </p>
        </section>
        </div>
      </div>
    </div>
  );
}
