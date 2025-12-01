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
  tone?: 'professional' | 'friendly' | 'casual';
}

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
    includeTime = true,
    tone = 'professional'
  } = options;

  const time = new Date(guest.checkInTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const company = includeCompany && guest.company ? ` from ${guest.company}` : '';

  let body = '';

  if (tone === 'professional') {
    body = `
${guest.name}${company} has arrived.

${includeTime ? `Check-in time: ${time}` : ''}
    `.trim();
  } else if (tone === 'friendly') {
    body = `
${guest.name}${company} has arrived.

${includeTime ? `Time: ${time}` : ''}
    `.trim();
  } else {
    body = `
${guest.name}${company} has arrived${includeTime ? ` (${time})` : ''}.
    `.trim();
  }

  return {
    to: host.email,
    subject: `Visitor Arrival: ${guest.name}`,
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
  const { tone = 'professional' } = options;
  const daysAgo = Math.floor(
    (Date.now() - previousVisitDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const company = guest.company ? ` from ${guest.company}` : '';

  let body = '';

  if (tone === 'professional') {
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
  const { tone = 'professional' } = options;
  const actualTime = new Date(guest.checkInTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const statusText = expectedTime ? ` (expected at ${expectedTime})` : '';

  let body = '';

  if (tone === 'professional') {
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
📧 TO: ${notification.to}
📋 SUBJECT: ${notification.subject}

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
    console.log('📧 Phase 2: Email service not configured');
    console.log('Notification ready to send:', notification);
    return;
  }

  try {
    await emailService.send(notification);
    console.log(`✅ Notification sent to ${notification.to}`);
  } catch (error) {
    console.error(`❌ Failed to send notification to ${notification.to}:`, error);
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
    console.log('✅ Notification copied to clipboard');
    return true;
  } catch (error) {
    console.error('❌ Failed to copy notification:', error);
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

  return `👋 *Visitor Arrival*

${guest.name}${company} has arrived.

⏰ Time: ${time}

Please come down to greet your visitor.`;
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

  return `👋 *Welcome Back!*

${guest.name}${company} has arrived.

📅 Last visit: ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago

Please come down to greet your visitor.`;
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

  let message = `✅ *Expected Guest Arrived*

${guest.name}${company} has arrived.

⏰ Time: ${actualTime}`;

  if (expectedTime) {
    message += `\n📅 Expected: ${expectedTime}`;
  }

  message += `\n\nPlease come down to greet your visitor.`;

  return message;
};

/**
 * Send WhatsApp notification via Web link or API
 * Phase 1: Opens WhatsApp Web (manual sending by user)
 * Phase 2: Sends via WhatsApp Business API (automatic)
 */
export const sendWhatsAppNotification = async (
  host: Host,
  message: string,
  whatsappService?: {
    send: (phoneNumber: string, message: string) => Promise<void>;
  }
): Promise<void> => {
  if (!host.whatsappNumber) {
    console.log('⚠️ WhatsApp not configured for host:', host.name);
    return;
  }

  if (whatsappService) {
    // Phase 2: Use API service
    try {
      await whatsappService.send(host.whatsappNumber, message);
      console.log(`✅ WhatsApp sent to ${host.name}`);
    } catch (error) {
      console.error(`❌ Failed to send WhatsApp to ${host.name}:`, error);
      throw new Error(`Failed to send WhatsApp: ${error}`);
    }
  } else {
    // Phase 1: Open WhatsApp Web for manual sending
    console.log('📱 Phase 1: Opening WhatsApp Web');
    console.log('WhatsApp message ready:', {
      to: host.whatsappNumber,
      message
    });
    openWhatsAppChat(host.whatsappNumber, message);
  }
};
