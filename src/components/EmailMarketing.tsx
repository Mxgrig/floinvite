/**
 * Email Marketing Component
 * Manage email campaigns, subscribers, and sending
 * Styled to match Logbook and other main app pages
 */

import { useState, useRef } from 'react';
import { Mail, Upload, Eye, Send, AlertCircle, CheckCircle, Loader, Trash2, BarChart3 } from 'lucide-react';
import { MarketingEmailRecipient, EmailSendResult } from '../types';
import { getLogoUrl } from '../utils/logoHelper';
import PageLayout from './PageLayout';
import './EmailMarketing.css';

// Stats Card Component
function StatsCard({ icon: Icon, value, label }: { icon: any; value: string; label: string }) {
  return (
    <div className="email-stat-card">
      <div className="email-stat-icon">
        <Icon size={20} />
      </div>
      <div className="email-stat-info">
        <div className="email-stat-value">{value}</div>
        <div className="email-stat-label">{label}</div>
      </div>
    </div>
  );
}

interface SendLog {
  id: string;
  timestamp: string;
  recipientCount: number;
  successCount: number;
  failedCount: number;
  subject: string;
  status: 'success' | 'failed' | 'partial';
}

interface Subscriber {
  email: string;
  name?: string;
  company?: string;
}

function getDefaultTemplate(): string {
  const logoUrl = getLogoUrl();
  const currentYear = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background: #f9fafb;
      color: #111827;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 60px 20px;
      background: #ffffff;
    }
    .logo-section {
      text-align: center;
      margin-bottom: 40px;
    }
    .logo-img {
      height: 60px;
      margin-bottom: 20px;
    }
    .logo {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .logo .flo {
      color: #4338ca;
    }
    .logo .invite {
      color: #10b981;
      font-weight: 600;
    }
    .logo-divider {
      height: 2px;
      background: #f0f0f0;
      margin: 30px 0 0 0;
    }
    .content {
      line-height: 1.8;
      padding: 0 20px;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 20px 0;
      color: #111827;
      text-align: center;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      margin: 30px 0 15px 0;
      color: #111827;
    }
    p {
      margin: 0 0 16px 0;
      color: #374151;
      font-size: 15px;
    }
    ul {
      margin: 0 0 20px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 12px;
      color: #374151;
      font-size: 15px;
    }
    strong { color: #111827; }
    .cta-button {
      display: inline-block;
      background: #4f46e5;
      color: white;
      padding: 16px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 25px 0 35px 0;
    }
    .cta-button:hover {
      background: #4338ca;
    }
    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 35px 0;
    }
    .footer {
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    .footer-link {
      color: #4f46e5;
      text-decoration: none;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .brand-flo {
      color: #4338ca;
      font-weight: 700;
    }
    .brand-invite {
      color: #10b981;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-section">
      <img src="${logoUrl}" alt="Floinvite" class="logo-img" />
      <div class="logo">
        <span class="flo">flo</span><span class="invite">invite</span>
      </div>
      <div class="logo-divider"></div>
    </div>

    <div class="content">
      <h1>Streamline Your Visitor Management</h1>

      <p>Hello,</p>

      <p>Managing office visitors doesn't have to be complicated. Floinvite makes check-in fast, secure, and effortless—keeping your team informed and your office safe.</p>

      <h2>How It Works:</h2>
      <ul>
        <li><strong>30-Second Check-In:</strong> Visitors sign in via web or tablet—no apps to download</li>
        <li><strong>Instant Host Alerts:</strong> Employees get email/SMS notifications when their visitors arrive</li>
        <li><strong>Visitor History:</strong> Maintain complete records for compliance and accountability</li>
        <li><strong>Emergency Ready:</strong> Generate evacuation lists instantly for safety drills or incidents</li>
      </ul>

      <p>Whether you're a startup, enterprise, or everything in between, Floinvite scales to your needs.</p>

      <div style="text-align: center;">
        <a href="https://floinvite.com" class="cta-button">Start Your Free Trial</a>
      </div>

      <p style="font-size: 14px; color: #6b7280; text-align: center;">No credit card required. Full access to all features.</p>

      <div class="divider"></div>

      <p style="font-size: 13px;">Questions? <a href="https://floinvite.com" style="color: #4f46e5; text-decoration: none;">Learn more</a> about Floinvite or reach out to our team.</p>
    </div>

    <div class="footer">
      <p style="margin: 20px 0 12px 0;"><span class="brand-flo">flo</span><span class="brand-invite">invite</span></p>
      <p style="margin: 8px 0;"><a href="https://floinvite.com/privacy" class="footer-link">Privacy Policy</a> &nbsp;•&nbsp; <a href="https://floinvite.com/terms" class="footer-link">Terms of Service</a></p>
      <p style="margin: 16px 0 0 0; color: #9ca3af;">&copy; ${currentYear} <span class="brand-flo">flo</span><span class="brand-invite">invite</span>. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

const DEFAULT_TEMPLATE = getDefaultTemplate();

interface EmailMarketingProps {
  onNavigate?: (page: string) => void;
}

export function EmailMarketing({ onNavigate }: EmailMarketingProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscribers' | 'compose'>('dashboard');
  const [recipients, setRecipients] = useState<Subscriber[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [customEmails, setCustomEmails] = useState<string>('');
  const [customEmailParsed, setCustomEmailParsed] = useState<Subscriber[]>([]);
  const [sendMode, setSendMode] = useState<'csv' | 'custom'>('csv');
  const [subject, setSubject] = useState('Streamline Your Visitor Management with Floinvite');
  const [fromName, setFromName] = useState('Floinvite');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendLogs, setSendLogs] = useState<SendLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = [
    { value: String(subscribers.length), label: 'Subscribers' },
    { value: String(sendLogs.length), label: 'Campaigns Sent' },
    { value: String(sendLogs.reduce((acc, log) => acc + log.successCount, 0)), label: 'Emails Sent' }
  ];

  // Parse CSV file for recipients
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const emailIndex = headers.findIndex(h => h === 'email');
        const nameIndex = headers.findIndex(h => h === 'name');
        const companyIndex = headers.findIndex(h => h === 'company');

        if (emailIndex === -1) {
          setError('CSV must have an "email" column');
          return;
        }

        const newRecipients: Subscriber[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const cells = lines[i].split(',').map(c => c.trim());
          const email = cells[emailIndex];

          if (email && email.includes('@')) {
            newRecipients.push({
              email,
              name: nameIndex !== -1 ? cells[nameIndex] : undefined,
              company: companyIndex !== -1 ? cells[companyIndex] : undefined
            });
          }
        }

        setRecipients(newRecipients);
        setError(null);
        setSuccess(`Loaded ${newRecipients.length} recipients`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to parse CSV file');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Parse custom emails (comma, space, or newline separated)
  const parseCustomEmails = (text: string): Subscriber[] => {
    const normalized = text.replace(/[,;\n]/g, ' ');
    const emails = normalized
      .split(/\s+/)
      .map(e => e.toLowerCase().trim())
      .filter(e => e.includes('@') && e.length > 0);
    
    const uniqueEmails = [...new Set(emails)];
    return uniqueEmails.map(email => ({ email }));
  };

  // Handle custom email input
  const handleCustomEmailChange = (text: string) => {
    setCustomEmails(text);
    const parsed = parseCustomEmails(text);
    setCustomEmailParsed(parsed);
  };

  // Handle import subscribers
  const handleImportSubscribers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const emailIndex = headers.findIndex(h => h === 'email');
        const nameIndex = headers.findIndex(h => h === 'name');
        const companyIndex = headers.findIndex(h => h === 'company');

        if (emailIndex === -1) {
          setError('CSV must have an "email" column');
          return;
        }

        const newSubscribers: Subscriber[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          const cells = lines[i].split(',').map(c => c.trim());
          const email = cells[emailIndex];

          if (email && email.includes('@')) {
            newSubscribers.push({
              email,
              name: nameIndex !== -1 ? cells[nameIndex] : undefined,
              company: companyIndex !== -1 ? cells[companyIndex] : undefined
            });
          }
        }

        setSubscribers(newSubscribers);
        setError(null);
        setSuccess(`Imported ${newSubscribers.length} subscribers`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to parse CSV file');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Send emails
  const handleSendEmails = async () => {
    let emailsToSend: Subscriber[] = [];
    
    if (sendMode === 'custom') {
      emailsToSend = customEmailParsed;
    } else {
      emailsToSend = recipients.length > 0 ? recipients : subscribers;
    }

    if (!emailsToSend.length) {
      setError('No recipients selected. Upload a CSV or enter custom emails.');
      return;
    }

    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/php/send-emails.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          recipients: emailsToSend,
          subject,
          fromName,
          htmlBody: template
        })
      });

      const result = (await response.json()) as EmailSendResult;

      const log: SendLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        recipientCount: emailsToSend.length,
        successCount: result.success,
        failedCount: result.failed,
        subject,
        status: result.failed === 0 ? 'success' : result.success === 0 ? 'failed' : 'partial'
      };

      setSendLogs([log, ...sendLogs]);
      setRecipients([]);
      setCustomEmails('');
      setCustomEmailParsed([]);
      setSuccess('Campaign sent successfully!');
      setTimeout(() => setSuccess(null), 3000);

      if (result.failed > 0) {
        const errorList = result.errors.slice(0, 5).map(e => `${e.email}: ${e.error}`).join('\n');
        setError(`${result.success} sent, ${result.failed} failed:\n${errorList}`);
      }
    } catch (err) {
      setError(`Failed to send emails: ${String(err)}`);
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const removeSubscriber = (index: number) => {
    setSubscribers(subscribers.filter((_, i) => i !== index));
  };

  const currentRecipientCount = sendMode === 'custom' ? customEmailParsed.length : recipients.length;

  return (
    <PageLayout
      eyebrow="Communications"
      title="Email Marketing"
      subtitle="Manage campaigns and subscribers"
    >
      <div className="email-marketing-container">
        {/* Tabs */}
        <div className="email-tabs">
          <button
            className={`email-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`email-tab ${activeTab === 'subscribers' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscribers')}
          >
            Subscribers
          </button>
          <button
            className={`email-tab ${activeTab === 'compose' ? 'active' : ''}`}
            onClick={() => setActiveTab('compose')}
          >
            Send Campaign
          </button>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="email-error">
            <AlertCircle size={20} />
            <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
          </div>
        )}

        {/* Success Messages */}
        {success && (
          <div className="email-success">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <div className="email-section">
              <h2>Recent Campaigns</h2>
              {sendLogs.length > 0 ? (
                <div className="email-logs">
                  {sendLogs.map((log) => (
                    <div key={log.id} className={`email-log-item email-log-${log.status}`}>
                      <div>
                        <strong>{log.subject}</strong>
                        <p>{log.timestamp}</p>
                      </div>
                      <div className="email-log-stats">
                        <div className="email-log-count">{log.successCount}/{log.recipientCount} sent</div>
                        {log.failedCount > 0 && (
                          <div className="email-log-failed-count">{log.failedCount} failed</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="email-empty-state">
                  <p>No campaigns sent yet</p>
                  <small>Create and send your first campaign using the "Send Campaign" tab</small>
                </div>
              )}
            </div>
          </>
        )}

        {/* Subscribers Tab */}
        {activeTab === 'subscribers' && (
          <>
            <div className="email-section">
              <h2>Import Subscribers</h2>
              <p>Upload a CSV file with email, name, and company columns</p>

              <div className="email-upload">
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleImportSubscribers}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="email-upload-btn"
                >
                  <Upload size={18} />
                  Choose CSV File
                </button>
              </div>
            </div>

            {subscribers.length > 0 && (
              <div className="email-section">
                <h2>Subscriber List ({subscribers.length})</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="email-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Name</th>
                        <th>Company</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub, idx) => (
                        <tr key={idx}>
                          <td>{sub.email}</td>
                          <td>{sub.name || '—'}</td>
                          <td>{sub.company || '—'}</td>
                          <td>
                            <button
                              onClick={() => removeSubscriber(idx)}
                              className="email-table-btn"
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <>
            <div className="email-section">
              <h2>Select Recipients</h2>
              <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>Choose how to specify recipients</p>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={sendMode === 'csv'}
                    onChange={() => setSendMode('csv')}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Upload CSV File</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    checked={sendMode === 'custom'}
                    onChange={() => setSendMode('custom')}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Enter Email Addresses</span>
                </label>
              </div>

              {sendMode === 'csv' && (
                <div className="email-upload">
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="email-upload-btn"
                  >
                    <Upload size={18} />
                    Choose CSV File
                  </button>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    CSV must have email, name (optional), and company (optional) columns
                  </p>
                  {recipients.length > 0 && (
                    <div className="email-upload-success">
                      <CheckCircle size={20} />
                      <div>
                        <strong>{recipients.length} recipients loaded</strong>
                        <p>{recipients.map(r => r.email).join(', ').substring(0, 100)}...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {sendMode === 'custom' && (
                <div>
                  <textarea
                    value={customEmails}
                    onChange={(e) => handleCustomEmailChange(e.target.value)}
                    placeholder="name@company.com, another@domain.com&#10;one@more.com"
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}
                  />
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    Comma, space, or newline separated
                  </p>
                  {customEmailParsed.length > 0 && (
                    <div className="email-upload-success" style={{ marginTop: '1rem' }}>
                      <CheckCircle size={20} />
                      <div>
                        <strong>{customEmailParsed.length} valid emails detected</strong>
                        <p>{customEmailParsed.map(r => r.email).join(', ').substring(0, 100)}...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="email-section">
              <h2>Configure Campaign</h2>

              <div className="email-form-group">
                <label>From Name</label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Your name or company"
                />
              </div>

              <div className="email-form-group">
                <label>Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="email-form-group">
                <label>Email Body (HTML)</label>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={12}
                  placeholder="Email HTML content"
                />
                <small>Edit the HTML template or reset to default. Supports HTML and inline CSS.</small>
              </div>

              <div className="btn-group">
                <button
                  onClick={() => setTemplate(DEFAULT_TEMPLATE)}
                  className="btn btn-secondary"
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="btn btn-secondary"
                >
                  <Eye size={18} />
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>
            </div>

            {showPreview && (
              <div className="email-section">
                <h2>Email Preview</h2>
                <div className="email-preview-container">
                  <iframe
                    srcDoc={template}
                    className="email-preview-iframe"
                    title="Email Preview"
                  />
                </div>
              </div>
            )}

            <div className="email-section">
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleSendEmails}
                  disabled={isSending || !currentRecipientCount}
                  className="btn btn-danger"
                  style={{ opacity: isSending || !currentRecipientCount ? 0.6 : 1 }}
                >
                  {isSending ? (
                    <>
                      <Loader size={18} className="email-loading-spinner" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send to {currentRecipientCount} Recipients
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}

export default EmailMarketing;
