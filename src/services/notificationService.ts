import { Guest, Host, GuestStatus } from '../types';

/**
 * Notification Service
 * Generates and manages visitor notification messages
 *
 * Phase 1 (MVP): Template-based message generation + WhatsApp Web links
 * Phase 2: WhatsApp Business API integration + Email service integration
 * Phase 3: Multi-channel (Teams, Slack)
 */

interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
  timestamp: string;
}

interface NotificationOptions {
  includeCompany?: boolean;
  includeTime?: boolean;
  tone?: 'compliance' | 'friendly' | 'casual';
}

/**
 * Generate HTML email template with proper branding
 */
const generateEmailTemplate = (title: string, content: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Floinvite</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; color: #333;">
<div style="max-width: 600px; margin: 0 auto;">
<div style="margin-bottom: 30px;">
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
<tr>
<td style="vertical-align: top;"><h1 style="margin: 0; font-size: 18px; font-weight: 600;">${title}</h1></td>
<td style="text-align: right; vertical-align: top;"><img src="https://floinvite.com/logo.png" alt="Floinvite" style="height: 35px; width: auto;"></td>
</tr>
</table>
</div>
<div>
${content}
</div>
</div>
</body>
</html>`;
};

/**
 * Generate a visitor arrival notification message
 * Used when a guest checks in
 */
export const generateVisitorArrivalNotification = (
  guest: Guest,
  host: Host,
  options: NotificationOptions = {}
): NotificationMessage => {
  const {
    includeCompany = true,
    includeTime = true
  } = options;

  const time = new Date(guest.checkInTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const date = new Date(guest.checkInTime).toLocaleDateString('en-GB');

  let guestInfo = `<p style="margin: 8px 0;"><strong>Guest:</strong> ${guest.name}</p>`;

  if (includeCompany && guest.company) {
    guestInfo += `<p style="margin: 8px 0;"><strong>Company:</strong> ${guest.company}</p>`;
  }

  if (includeTime) {
    guestInfo += `<p style="margin: 8px 0;"><strong>Arrival:</strong> ${date} at ${time}</p>`;
  }

  const content = `<p style="margin: 0 0 20px 0; line-height: 1.6;">A new visitor has checked in and is waiting.</p>
${guestInfo}`;

  const body = generateEmailTemplate('Visitor Arrival Notification', content);

  return {
    to: host.email,
    subject: `Guest Arrival: ${guest.name}`,
    body,
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate a returning visitor notification
 * Used when a previously-visited guest checks in
 */
export const generateReturningVisitorNotification = (
  guest: Guest,
  host: Host,
  previousVisitDate: Date,
  options: NotificationOptions = {}
): NotificationMessage => {
  const { tone = 'compliance' } = options;
  const daysAgo = Math.floor(
    (Date.now() - previousVisitDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const company = guest.company ? ` from ${guest.company}` : '';

  let body = '';

  if (tone === 'compliance') {
    body = `
${guest.name}${company} has arrived.

Last visit: ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago
    `.trim();
  } else if (tone === 'friendly') {
    body = `
${guest.name}${company} has arrived.

Last visit: ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago
    `.trim();
  } else {
    body = `
${guest.name}${company} has arrived. (last visit: ${daysAgo}d ago)
    `.trim();
  }

  return {
    to: host.email,
    subject: `Welcome Back: ${guest.name}`,
    body,
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate an expected guest arrival notification
 * Used when an expected guest checks in
 */
export const generateExpectedGuestNotification = (
  guest: Guest,
  host: Host,
  expectedTime: string | undefined,
  options: NotificationOptions = {}
): NotificationMessage => {
  const { tone = 'compliance' } = options;
  const actualTime = new Date(guest.checkInTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const statusText = expectedTime ? ` (expected at ${expectedTime})` : '';

  let body = '';

  if (tone === 'compliance') {
    body = `
${guest.name} from ${guest.company || 'your guest list'} has arrived.

Check-in time: ${actualTime}${statusText}
    `.trim();
  } else {
    body = `
${guest.name} from ${guest.company || 'your guest list'} has arrived.

Check-in time: ${actualTime}${statusText}
    `.trim();
  }

  return {
    to: host.email,
    subject: `Expected Guest Arrived: ${guest.name}`,
    body,
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate a no-show reminder notification
 * Used when an expected guest doesn't check in
 */
export const generateNoShowNotification = (
  guest: Guest,
  host: Host,
  expectedTime: string
): NotificationMessage => {
  return {
    to: host.email,
    subject: `No-Show Reminder: ${guest.name}`,
    body: `
${guest.name} was expected at ${expectedTime} but hasn't checked in yet.

Expected time: ${expectedTime}
Current time: ${new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })}

Would you like to mark them as a no-show?
    `.trim(),
    timestamp: new Date().toISOString()
  };
};

/**
 * Format a notification for display in the UI
 * Phase 1: Shows in toast/modal
 * Phase 2+: Can be sent via email service
 */
export const formatNotificationForDisplay = (
  notification: NotificationMessage
): string => {
  return `
TO: ${notification.to}
SUBJECT: ${notification.subject}

${notification.body}

---
Generated: ${new Date(notification.timestamp).toLocaleString('en-GB')}
  `.trim();
};

/**
 * Phase 2: Email sending integration point
 * To be implemented when integrating with email service (SendGrid, Resend, etc.)
 */
export const sendNotificationEmail = async (
  notification: NotificationMessage,
  emailService?: {
    send: (msg: NotificationMessage) => Promise<void>;
  }
): Promise<void> => {
  if (!emailService) {
    return;
  }

  try {
    await emailService.send(notification);
  } catch (error) {
    console.error(`Failed to send notification to ${notification.to}:`, error);
    throw new Error(`Failed to send notification: ${error}`);
  }
};

/**
 * Batch generate notifications for multiple hosts
 * Useful for group meetings or events with multiple attendees
 */
export const generateBatchNotifications = (
  guest: Guest,
  hosts: Host[],
  notificationType: 'arrival' | 'expected' | 'returning',
  options: NotificationOptions = {}
): NotificationMessage[] => {
  return hosts.map((host) => {
    if (notificationType === 'arrival') {
      return generateVisitorArrivalNotification(guest, host, options);
    } else if (notificationType === 'expected') {
      return generateExpectedGuestNotification(
        guest,
        host,
        undefined,
        options
      );
    } else {
      const lastVisit = guest.lastVisit
        ? new Date(guest.lastVisit)
        : new Date(guest.checkInTime);
      return generateReturningVisitorNotification(guest, host, lastVisit, options);
    }
  });
};

/**
 * Get notification template options based on guest status
 */
export const getNotificationTemplate = (
  guest: Guest,
  host: Host,
  options?: NotificationOptions
): NotificationMessage => {
  switch (guest.status) {
    case GuestStatus.CHECKED_IN:
      if (guest.visitCount && guest.visitCount > 1) {
        const lastVisit = guest.lastVisit
          ? new Date(guest.lastVisit)
          : new Date(guest.checkInTime);
        return generateReturningVisitorNotification(guest, host, lastVisit, options);
      }
      return generateVisitorArrivalNotification(guest, host, options);

    case GuestStatus.EXPECTED:
      return generateExpectedGuestNotification(
        guest,
        host,
        guest.checkInTime,
        options
      );

    case GuestStatus.NO_SHOW:
      return generateNoShowNotification(guest, host, '');

    default:
      return generateVisitorArrivalNotification(guest, host, options);
  }
};

/**
 * Export notification as text file
 * User can manually send or save for records
 */
export const exportNotificationAsText = (
  notification: NotificationMessage,
  filename?: string
): void => {
  const content = formatNotificationForDisplay(notification);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename || `notification_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy notification to clipboard
 * Allows user to paste into email or messaging app
 */
export const copyNotificationToClipboard = async (
  notification: NotificationMessage
): Promise<boolean> => {
  try {
    const text = formatNotificationForDisplay(notification);
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy notification:', error);
    return false;
  }
};

/**
 * ═══════════════════════════════════════════════════
 * WHATSAPP NOTIFICATIONS
 * ═══════════════════════════════════════════════════
 * Phase 1: WhatsApp Web links (manual sending)
 * Phase 2: WhatsApp Business API (automatic sending)
 */

/**
 * Generate WhatsApp Web link for message
 * Phase 1: Opens WhatsApp Web/App with pre-filled message
 */
export const generateWhatsAppLink = (
  phoneNumber: string,
  message: string
): string => {
  const encodedMessage = encodeURIComponent(message);
  // Remove any non-numeric characters except + from phone number
  const cleanPhone = phoneNumber.replace(/\s|-|\(|\)/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Open WhatsApp with pre-filled message
 * Phase 1 (MVP): User manually sends message from WhatsApp
 */
export const openWhatsAppChat = (
  phoneNumber: string,
  message: string
): void => {
  const link = generateWhatsAppLink(phoneNumber, message);
  window.open(link, '_blank');
};

/**
 * Open WhatsApp and wait for user to confirm send
 * Detects when user returns focus to the page after sending message
 * Works on both mobile (app switching) and desktop (tab switching)
 */
export const openWhatsAppChatAndWait = (
  phoneNumber: string,
  message: string,
  onConfirm: () => void,
  onTimeout?: () => void
): void => {
  const link = generateWhatsAppLink(phoneNumber, message);

  // Track if page lost focus
  let pageLostFocus = false;

  // Listen for page losing focus (user switched to WhatsApp)
  const handleBlur = () => {
    pageLostFocus = true;
  };

  // Listen for page regaining focus (user returned from WhatsApp)
  const handleFocus = () => {
    if (pageLostFocus) {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      clearTimeout(timeoutId);
      onConfirm();
    }
  };

  // Fallback timeout: if user doesn't return after 3 minutes, auto-confirm
  const timeoutId = setTimeout(() => {
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    onTimeout?.();
    onConfirm();
  }, 180000); // 3 minutes

  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);

  // Open WhatsApp
  window.open(link, '_blank');
};

/**
 * Generate WhatsApp message for visitor arrival
 */
export const generateWhatsAppVisitorMessage = (
  guest: Guest,
  host: Host
): string => {
  const company = guest.company ? ` from ${guest.company}` : '';
  const time = new Date(guest.checkInTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${guest.name}${company} is here. Arrived at ${time}.`;
};

/**
 * Generate WhatsApp message for returning visitor
 */
export const generateWhatsAppReturningMessage = (
  guest: Guest,
  host: Host,
  previousVisitDate: Date
): string => {
  const company = guest.company ? ` from ${guest.company}` : '';
  const daysAgo = Math.floor(
    (Date.now() - previousVisitDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return `${guest.name}${company} is here. Last visit ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago.`;
};

/**
 * Generate WhatsApp message for expected guest arrival
 */
export const generateWhatsAppExpectedMessage = (
  guest: Guest,
  host: Host,
  expectedTime?: string
): string => {
  const company = guest.company ? ` from ${guest.company}` : '';
  const actualTime = new Date(guest.checkInTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${guest.name}${company} is here. Arrived at ${actualTime}.`;
};

/**
 * Send WhatsApp notification via Web link or API
 * Phase 1: Opens WhatsApp Web and waits for user to return (send confirmation)
 * Phase 2: Sends via WhatsApp Business API (automatic)
 */
export const sendWhatsAppNotification = async (
  host: Host,
  message: string,
  onConfirm?: () => void,
  whatsappService?: {
    send: (phoneNumber: string, message: string) => Promise<void>;
  }
): Promise<void> => {
  if (!host.whatsappNumber) {
    console.warn('WhatsApp not configured for host:', host.name);
    return;
  }

  if (whatsappService) {
    // Phase 2: Use API service
    try {
      await whatsappService.send(host.whatsappNumber, message);
      onConfirm?.();
    } catch (error) {
      console.error(`Failed to send WhatsApp to ${host.name}:`, error);
      throw new Error(`Failed to send WhatsApp: ${error}`);
    }
  } else {
    // Phase 1: Open WhatsApp Web and wait for user to return
    openWhatsAppChatAndWait(
      host.whatsappNumber,
      message,
      onConfirm || (() => {}),
      () => null
    );
  }
};
