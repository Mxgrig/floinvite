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

    void isEnabled;
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
      return {
        success: true,
        messageId: `phase1_${Date.now()}`,
        message: 'Phase 1: Email not sent (email service disabled)'
      };
    }

    // Phase 2+: Send via Hostinger backend
    try {
      // Create abort controller for timeout (30 second limit)
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 30000);

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
          }),
          signal: abortController.signal
        });

        clearTimeout(timeoutId);

        // Validate response is valid JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          console.error('Invalid response type:', contentType);
          return {
            success: false,
            error: 'Invalid server response - expected JSON'
          };
        }

        const data = (await response.json()) as EmailResponse & {
          errors?: string | string[];
          details?: string;
          error?: string;
        };

        if (!response.ok) {
          const errorMsg = data.error || data.errors || 'Unknown error';
          const details = data.details || '';
          console.error('Email send failed:', errorMsg);
          if (details) {
            console.error('Details:', details);
          }
          return {
            success: false,
            error: Array.isArray(errorMsg) ? errorMsg.join(', ') : `${errorMsg}${details ? ' - ' + details : ''}`
          };
        }

        return {
          success: true,
          messageId: `${Date.now()}`
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Email service timeout (30s) - request took too long');
          return {
            success: false,
            error: 'Request timeout - email service is slow. Guest checked in but notification may not be sent.'
          };
        }
        console.error('Email service error:', error.message);
        return {
          success: false,
          error: error.message
        };
      }
      console.error('Email service error:', error);
      return {
        success: false,
        error: 'Network error or service unavailable'
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
