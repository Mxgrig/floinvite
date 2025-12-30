/**
 * Email Marketing Component
 * Manage email campaigns, subscribers, and sending
 * Styled to match Logbook and other main app pages
 */

import { useState, useRef } from 'react';
import { Mail, Upload, Eye, Send, AlertCircle, CheckCircle, Loader, Trash2 } from 'lucide-react';
import { MarketingEmailRecipient, EmailSendResult } from '../types';
import PageLayout from './PageLayout';
import './EmailMarketing.css';

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

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; }
    h1, h2 { margin: 0 0 1rem 0; }
    p { margin: 0 0 1rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Floinvite</h1>
      <p>Visitor Management Made Simple</p>
    </div>

    <div class="content">
      <h2>Welcome to Floinvite</h2>

      <p>We help modern offices streamline visitor check-in and keep everyone safe.</p>

      <h3>Key Features:</h3>
      <ul>
        <li><strong>30-Second Check-In:</strong> Fast, hassle-free visitor arrivals</li>
        <li><strong>Host Notifications:</strong> Instant email/SMS alerts when visitors arrive</li>
        <li><strong>Visitor Records:</strong> Maintain detailed check-in history</li>
        <li><strong>Emergency Evacuation Lists:</strong> Quick accountability for safety</li>
        <li><strong>Returning Visitor Recognition:</strong> Remember frequent guests</li>
        <li><strong>Mobile-Friendly:</strong> Works on any device</li>
      </ul>

      <p style="text-align: center; margin: 30px 0;">
        <a href="https://floinvite.com" class="cta-button">See How It Works</a>
      </p>

      <p>Start your free trial today. No credit card required.</p>
    </div>

    <div class="footer">
      <p>Floinvite - Professional Visitor Management</p>
      <p>&copy; 2024 Floinvite. All rights reserved.</p>
      <p><a href="https://floinvite.com/privacy" style="color: #4f46e5; text-decoration: none;">Privacy Policy</a> | <a href="https://floinvite.com/terms" style="color: #4f46e5; text-decoration: none;">Terms of Service</a></p>
    </div>
  </div>
</body>
</html>`;

interface EmailMarketingProps {
  onNavigate?: (page: string) => void;
}

export function EmailMarketing({ onNavigate }: EmailMarketingProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'subscribers' | 'compose'>('dashboard');
  const [recipients, setRecipients] = useState<Subscriber[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subject, setSubject] = useState('Floinvite - Visitor Management Made Simple');
  const [fromName, setFromName] = useState('Floinvite Team');
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
    const emailsToSend = recipients.length > 0 ? recipients : subscribers;

    if (!emailsToSend.length) {
      setError('No recipients selected. Upload a CSV or select subscribers.');
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

  return (
    <PageLayout
      eyebrow="Communications"
      title="Email Marketing"
      subtitle="Send campaigns to prospects and manage your subscriber list"
      stats={stats}
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
              <h2>Upload Recipients</h2>
              <p>CSV file with email, name (optional), and company (optional) columns</p>

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
                  disabled={isSending || !recipients.length}
                  className="btn btn-danger"
                  style={{ opacity: isSending || !recipients.length ? 0.6 : 1 }}
                >
                  {isSending ? (
                    <>
                      <Loader size={18} className="email-loading-spinner" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send to {recipients.length} Recipients
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
