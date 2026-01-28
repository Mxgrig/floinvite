/**
 * Notification Configuration
 * Manages feature flags and notification channel settings
 */

interface NotificationChannels {
  email: boolean;
  whatsapp: boolean;
  slack: boolean;
  teams: boolean;
  webhooks: boolean;
}

interface NotificationConfig {
  channels: NotificationChannels;
  emailService: {
    provider: string;
    apiKey: string;
    fromEmail: string;
    isConfigured: boolean;
  };
  debug: boolean;
}

/**
 * Get notification configuration from environment variables
 */
export const getNotificationConfig = (): NotificationConfig => {
  const emailApiKey = import.meta.env.VITE_EMAIL_API_KEY || '';
  const emailService = import.meta.env.VITE_EMAIL_SERVICE || 'resend';

  return {
    channels: {
      email: import.meta.env.VITE_ENABLE_EMAIL_NOTIFICATIONS === 'true',
      whatsapp: import.meta.env.VITE_ENABLE_WHATSAPP_NOTIFICATIONS === 'true',
      slack: import.meta.env.VITE_ENABLE_SLACK_INTEGRATION === 'true',
      teams: import.meta.env.VITE_ENABLE_TEAMS_INTEGRATION === 'true',
      webhooks: import.meta.env.VITE_ENABLE_WEBHOOKS === 'true'
    },
    emailService: {
      provider: emailService,
      apiKey: emailApiKey,
      fromEmail: import.meta.env.VITE_EMAIL_FROM || 'notifications@floinvite.com',
      isConfigured: !!emailApiKey && emailApiKey !== 'your_resend_api_key_here'
    },
    debug: import.meta.env.VITE_DEBUG_MODE === 'true'
  };
};

/**
 * Check if a specific notification channel is enabled
 */
export const isChannelEnabled = (channel: keyof NotificationChannels): boolean => {
  const config = getNotificationConfig();
  return config.channels[channel];
};

/**
 * Check if email notifications are fully configured and ready to send
 * Phase 1: Uses Hostinger PHP backend (no external API key needed)
 * Phase 2+: Will use external API (Resend, SendGrid, etc.)
 */
export const isEmailReady = (): boolean => {
  const config = getNotificationConfig();
  // Phase 1: Only check if email channel is enabled (uses Hostinger backend)
  // No external API key required
  return config.channels.email;
};

/**
 * Get active notification channels
 */
export const getActiveChannels = (): (keyof NotificationChannels)[] => {
  const config = getNotificationConfig();
  return (Object.keys(config.channels) as (keyof NotificationChannels)[])
    .filter(channel => config.channels[channel]);
};

/**
 * Log notification configuration (for debugging)
 */
export const logNotificationConfig = (): void => {
  const config = getNotificationConfig();
  const activeChannels = getActiveChannels();
  void config;
  void activeChannels;
};

/**
 * Initialize and log notification config on app startup
 */
export const initNotificationConfig = (): NotificationConfig => {
  const config = getNotificationConfig();
  if (config.debug) {
    logNotificationConfig();
  }
  return config;
};
