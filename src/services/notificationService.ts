import { Guest, Host, GuestStatus } from '../types';

/**
 * Notification Service
 * Generates and manages visitor notification messages
 *
 * Phase 1 (MVP): Template-based message generation
 * Phase 2: Email service integration
 * Phase 3: Multi-channel (SMS, Teams, Slack)
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
 * SMS NOTIFICATIONS (Phase 2/3)
 * ═══════════════════════════════════════════════════
 * SMS has strict 160 character limit, so messages are concise
 */

/**
 * Generate SMS for walk-in visitor arrival
 * Must fit in single SMS (160 chars)
 */
export const generateVisitorArrivalSMS = (
  guest: Guest
): string => {
  const company = guest.company ? ` from ${guest.company}` : '';
  const time = new Date(guest.checkInTime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Format: "John Smith from Client Corp has arrived (14:30)"
  // Prioritize name and company, drop time if needed to stay under 160 chars
  let message = `${guest.name}${company} has arrived (${time})`;

  if (message.length > 160) {
    message = `${guest.name}${company} has arrived`;
  }

  return message;
};

/**
 * Generate SMS for returning visitor
 */
export const generateReturningVisitorSMS = (
  guest: Guest,
  previousVisitDate: Date
): string => {
  const company = guest.company ? ` from ${guest.company}` : '';
  const daysAgo = Math.floor(
    (Date.now() - previousVisitDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Format: "John Smith from Client Corp has arrived (visited 5d ago)"
  return `${guest.name}${company} has arrived (visited ${daysAgo}d ago)`.substring(0, 160);
};

/**
 * Generate SMS for expected guest arrival
 */
export const generateExpectedGuestSMS = (
  guest: Guest,
  expectedTime?: string
): string => {
  const company = guest.company ? ` from ${guest.company}` : '';

  if (expectedTime) {
    return `${guest.name}${company} has arrived (expected ${expectedTime})`.substring(0, 160);
  }

  return `${guest.name}${company} has arrived`.substring(0, 160);
};

/**
 * Generate SMS for no-show reminder
 */
export const generateNoShowSMS = (
  guest: Guest,
  expectedTime: string
): string => {
  return `${guest.name} was expected at ${expectedTime}, still waiting?`.substring(0, 160);
};

/**
 * Send SMS via email-to-SMS gateway
 * Uses carrier email gateways (no API keys needed)
 * Example: 07700900000 + vodafone = 07700900000@vodafone.net
 */
export const sendNotificationSMS = async (
  host: Host,
  smsMessage: string,
  emailService?: {
    send: (msg: NotificationMessage) => Promise<void>;
  }
): Promise<void> => {
  if (!host.notifyBySMS || !host.phone || !host.smsCarrier) {
    console.log('⚠️ SMS not configured for host:', host.name);
    return;
  }

  // SMS Gateway mapping - converts phone number to email
  const SMS_GATEWAYS: Record<string, string> = {
    vodafone: '@vodafone.net',
    ee: '@mms.ee.co.uk',
    o2: '@o2.co.uk',
    three: '@three.co.uk',
    tmobile: '@tmomail.net',
    att: '@txt.att.net',
    verizon: '@vtext.com'
  };

  const gateway = SMS_GATEWAYS[host.smsCarrier];
  if (!gateway) {
    console.error('❌ Unknown SMS carrier:', host.smsCarrier);
    return;
  }

  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = host.phone.replace(/\s|-|\(|\)/g, '');
  const smsEmailAddress = `${cleanPhone}${gateway}`;

  const smsNotification: NotificationMessage = {
    to: smsEmailAddress,
    subject: 'Visitor Arrival (SMS)',
    body: smsMessage,
    timestamp: new Date().toISOString()
  };

  if (!emailService) {
    console.log('📱 Phase 2: SMS service not configured');
    console.log('SMS ready to send:', {
      to: smsEmailAddress,
      carrier: host.smsCarrier,
      message: smsMessage
    });
    return;
  }

  try {
    await emailService.send(smsNotification);
    console.log(`✅ SMS sent to ${host.name} via ${host.smsCarrier}`);
  } catch (error) {
    console.error(`❌ Failed to send SMS to ${host.name}:`, error);
    throw new Error(`Failed to send SMS: ${error}`);
  }
};
