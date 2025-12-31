/**
 * Admin Email Marketing Interface
 * Webmaster-only interface for sending marketing emails to prospects
 */

import { useState, useRef } from 'react';
import { Mail, Upload, Eye, Send, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { MarketingEmailRecipient, EmailSendResult } from '../types';
import './AdminEmailMarketing.css';

interface SendLog {
  id: string;
  timestamp: string;
  recipientCount: number;
  successCount: number;
  failedCount: number;
  subject: string;
  status: 'success' | 'failed' | 'partial';
}

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; }
    h1 { margin: 0; font-size: 28px; }
    p { line-height: 1.6; color: #374151; }
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
      <p>Floinvite - Compliance+ Visitor Management</p>
      <p>&copy; 2024 Floinvite. All rights reserved.</p>
      <p><a href="https://floinvite.com/privacy" style="color: #4f46e5; text-decoration: none;">Privacy Policy</a> | <a href="https://floinvite.com/terms" style="color: #4f46e5; text-decoration: none;">Terms of Service</a></p>
    </div>
  </div>
</body>
</html>`;

export function AdminEmailMarketing() {
  const [recipients, setRecipients] = useState<MarketingEmailRecipient[]>([]);
  const [subject, setSubject] = useState('Floinvite - Visitor Management Made Simple');
  const [fromName, setFromName] = useState('Floinvite Team');
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendLogs, setSendLogs] = useState<SendLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Find email column
        const emailIndex = headers.findIndex(h => h === 'email');
        const nameIndex = headers.findIndex(h => h === 'name');
        const companyIndex = headers.findIndex(h => h === 'company');

        if (emailIndex === -1) {
          setError('CSV must have an "email" column');
          return;
        }

        // Parse recipients
        const newRecipients: MarketingEmailRecipient[] = [];
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
      } catch (err) {
        setError('Failed to parse CSV file');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Send emails
  const handleSendEmails = async () => {
    if (!recipients.length) {
      setError('No recipients loaded');
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
          recipients,
          subject,
          fromName,
          htmlBody: template
        })
      });

      const result = (await response.json()) as EmailSendResult;

      // Log the send
      const log: SendLog = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        recipientCount: recipients.length,
        successCount: result.success,
        failedCount: result.failed,
        subject,
        status: result.failed === 0 ? 'success' : result.success === 0 ? 'failed' : 'partial'
      };

      setSendLogs([log, ...sendLogs]);

      // Show summary
      if (result.failed > 0) {
        const errorList = result.errors.slice(0, 5).map(e => `${e.email}: ${e.error}`).join('\n');
        setError(`${result.success} sent, ${result.failed} failed:\n${errorList}`);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(`Failed to send emails: ${String(err)}`);
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="admin-email-marketing">
      <div className="aem-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Mail size={32} style={{ color: '#4f46e5' }} />
          <div>
            <h1>Email Marketing</h1>
            <p>Send marketing emails to prospects</p>
          </div>
        </div>
      </div>

      <div className="aem-container">
        {/* CSV Upload Section */}
        <div className="aem-section">
          <h2>1. Upload Recipients</h2>
          <p>CSV file with email, name (optional), and company (optional) columns</p>

          <div className="aem-upload">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aem-upload-btn"
            >
              <Upload size={20} />
              Choose CSV File
            </button>
            {recipients.length > 0 && (
              <div className="aem-upload-success">
                <CheckCircle size={20} style={{ color: '#10b981' }} />
                <div>
                  <strong>{recipients.length} recipients loaded</strong>
                  <p>{recipients.map(r => r.email).join(', ').substring(0, 100)}...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Email Configuration */}
        <div className="aem-section">
          <h2>2. Configure Email</h2>

          <div className="aem-form-group">
            <label>From Name</label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Your name or company"
            />
          </div>

          <div className="aem-form-group">
            <label>Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div className="aem-form-group">
            <label>Email Body (HTML)</label>
            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={12}
              placeholder="Email HTML content"
            />
            <small>Edit the HTML template or reset to default. Supports HTML and inline CSS.</small>
          </div>

          <button
            onClick={() => setTemplate(DEFAULT_TEMPLATE)}
            className="aem-btn-secondary"
          >
            Reset to Default Template
          </button>
        </div>

        {/* Preview Section */}
        <div className="aem-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>3. Preview & Send</h2>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="aem-btn-preview"
            >
              <Eye size={18} />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {showPreview && (
            <div className="aem-preview">
              <iframe
                srcDoc={template}
                style={{
                  width: '100%',
                  height: '600px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
                title="Email Preview"
              />
            </div>
          )}
        </div>

        {/* Error/Status Messages */}
        {error && (
          <div className="aem-error">
            <AlertCircle size={20} />
            <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
          </div>
        )}

        {/* Send Button */}
        <div className="aem-section" style={{ textAlign: 'center' }}>
          <button
            onClick={handleSendEmails}
            disabled={isSending || !recipients.length}
            className="aem-btn-send"
            style={{ opacity: isSending || !recipients.length ? 0.6 : 1 }}
          >
            {isSending ? (
              <>
                <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Sending...
              </>
            ) : (
              <>
                <Send size={20} />
                Send to {recipients.length} Recipients
              </>
            )}
          </button>
        </div>

        {/* Send Logs */}
        {sendLogs.length > 0 && (
          <div className="aem-section">
            <h2>Send History</h2>
            <div className="aem-logs">
              {sendLogs.map((log) => (
                <div key={log.id} className={`aem-log-item aem-log-${log.status}`}>
                  <div>
                    <strong>{log.subject}</strong>
                    <p>{log.timestamp}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>
                      {log.successCount}/{log.recipientCount} sent
                    </div>
                    {log.failedCount > 0 && (
                      <div style={{ fontSize: '12px', color: '#ef4444' }}>
                        {log.failedCount} failed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
