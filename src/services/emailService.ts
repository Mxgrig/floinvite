/**
 * Email Service
 * Handles email notifications via Hostinger backend
 *
 * Phase 1 (MVP): PHP backend endpoint (no external APIs)
 * Phase 2+: Can upgrade to PHPMailer + SMTP for better reliability
 */

interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  emailType?: 'notification' | 'admin';
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  message?: string;
}

interface EmailServiceConfig {
  apiUrl: string;
  isEnabled: boolean;
  isConfigured: boolean;
}

class EmailService {
  private config: EmailServiceConfig;

  constructor() {
    const apiUrl = import.meta.env.VITE_EMAIL_API_URL;
    const isEnabled = import.meta.env.VITE_ENABLE_EMAIL_NOTIFICATIONS === 'true';
    
    // Default to Hostinger API endpoint
    const defaultUrl = `${window.location.origin}/api/send-email.php`;
    
    this.config = {
      apiUrl: apiUrl || defaultUrl,
      isEnabled,
      isConfigured: !!apiUrl
    };

    if (isEnabled) {
      console.log('✅ Email service: ENABLED (Hostinger backend)');
      console.log('📧 API Endpoint:', this.config.apiUrl);
    } else {
      console.log('📧 Email service: DISABLED (Phase 1 - logging to console)');
    }
  }

  /**
   * Check if email service is enabled
   */
  public isReady(): boolean {
    return this.config.isEnabled;
  }

  /**
   * Send email via Hostinger backend
   */
  async send(message: EmailMessage): Promise<EmailResponse> {
    // If disabled, just log to console (Phase 1)
    if (!this.config.isEnabled) {
      console.log('📧 [PHASE 1 - NOT SENDING] Email notification:', {
        to: message.to,
        subject: message.subject,
        body: message.body,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: `phase1_${Date.now()}`,
        message: 'Phase 1: Email logged to console (not sent)'
      };
    }

    // Phase 2+: Send via Hostinger backend
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: message.to,
          subject: message.subject,
          body: message.body,
          emailType: message.emailType || 'notification'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = (data as any).error || (data as any).errors || 'Unknown error';
        console.error('❌ Email send failed:', errorMsg);
        return {
          success: false,
          error: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg
        };
      }

      console.log(`✅ Email sent to ${message.to}`);
      return {
        success: true,
        messageId: `${Date.now()}`
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      console.error('❌ Email service error:', errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Send batch emails
   */
  async sendBatch(messages: EmailMessage[]): Promise<EmailResponse[]> {
    return Promise.all(messages.map(msg => this.send(msg)));
  }

  /**
   * Get configuration status (for debugging)
   */
  public getStatus(): {
    isEnabled: boolean;
    apiUrl: string;
    isReady: boolean;
  } {
    return {
      isEnabled: this.config.isEnabled,
      apiUrl: this.config.apiUrl,
      isReady: this.config.isEnabled
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export type for use in other services
export type { EmailMessage, EmailResponse, EmailServiceConfig };
