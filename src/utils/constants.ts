/**
 * Application Constants
 * Centralized configuration and lookup tables
 */

export const APP_CONFIG = {
  name: 'Floinvite',
  description: 'Visitor Management System for Modern Offices',
  version: '1.0.0',
  website: 'https://floinvite.com',
  email: 'admin@floinvite.com',
  colors: {
    primary: '#4f46e5', // Indigo
    success: '#10b981', // Emerald
    warning: '#fbbf24', // Amber
    danger: '#ef4444', // Red
    dark: '#1f2937' // Gray-800
  }
};

/**
 * SMS Gateway Email Addresses
 * Maps phone carriers to their email-to-SMS gateways
 * Example: 07700123456 + vodafone → 07700123456@vodafone.net
 */
export const SMS_GATEWAYS = {
  vodafone: '@vodafone.net',
  ee: '@mms.ee.co.uk',
  o2: '@o2.co.uk',
  three: '@three.co.uk',
  tmobile: '@tmomail.net',
  att: '@txt.att.net',
  verizon: '@vtext.com',
  sprint: '@messaging.sprintpcs.com',
  boost: '@sms.myboostmobile.com',
  virgin: '@vmobl.com'
} as const;

export type SMSCarrier = keyof typeof SMS_GATEWAYS;

/**
 * Storage Keys
 * Prefix: 'floinvite_' for namespace isolation
 */
export const STORAGE_KEYS = {
  hosts: 'floinvite_hosts',
  guests: 'floinvite_guests',
  settings: 'floinvite_settings',
  authToken: 'floinvite_auth_token',
  subscription: 'floinvite_subscription',
  checkoutSessions: 'floinvite_checkout_sessions',
  notificationLog: 'floinvite_notification_log'
} as const;

/**
 * Notification Tones (Message styles)
 */
export const NOTIFICATION_TONES = {
  professional: {
    label: 'Professional',
    description: 'Formal business tone'
  },
  friendly: {
    label: 'Friendly',
    description: 'Warm and welcoming'
  },
  casual: {
    label: 'Casual',
    description: 'Relaxed and conversational'
  }
} as const;

export type NotificationTone = keyof typeof NOTIFICATION_TONES;

/**
 * Guest Status Options
 */
export const GUEST_STATUS = {
  EXPECTED: 'Expected',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
  NO_SHOW: 'No Show'
} as const;

/**
 * Pricing Tiers
 */
export const PRICING_TIERS_CONFIG = {
  starter: {
    name: 'Starter',
    price: 5,
    description: 'Full notifications included - perfect for SME'
  },
  professional: {
    name: 'Professional',
    price: 15,
    description: 'Team messaging + cloud sync - for growing teams'
  },
  enterprise: {
    name: 'Enterprise',
    price: 25,
    description: 'Complete solution with webhooks + dedicated support'
  }
} as const;

export type PricingTier = keyof typeof PRICING_TIERS_CONFIG;

/**
 * Date/Time Formats
 */
export const DATE_FORMATS = {
  display: 'MMM d, yyyy',
  time: 'h:mm a',
  dateTime: 'MMM d, yyyy h:mm a',
  iso: 'yyyy-MM-dd',
  isoTime: 'HH:mm',
  isoDateTime: "yyyy-MM-dd'T'HH:mm:ss"
} as const;

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  checkout: '/api/checkout-session',
  subscription: '/api/subscription-status',
  subscriptionUpdate: '/api/subscription/update',
  subscriptionCancel: '/api/subscription/cancel',
  subscriptionReactivate: '/api/subscription/reactivate',
  portal: '/api/portal-session'
} as const;

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
  guest: {
    name: {
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phone: {
      pattern: /^[0-9\-\+\(\)\s]+$/,
      minLength: 10
    }
  },
  host: {
    name: {
      minLength: 2,
      maxLength: 100
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phone: {
      pattern: /^[0-9\-\+\(\)\s]+$/
    }
  },
  csv: {
    maxRows: 1000,
    requiredColumns: ['Name', 'Email'],
    optionalColumns: ['Phone', 'Department', 'Company']
  }
} as const;

/**
 * Time Windows
 */
export const TIME_WINDOWS = {
  returningVisitor: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  guestArchive: 90 * 24 * 60 * 60 * 1000, // 90 days in ms
  notificationRetry: 5 * 60 * 1000, // 5 minutes
  sessionTimeout: 30 * 60 * 1000 // 30 minutes
} as const;

/**
 * UI Configuration
 */
export const UI_CONFIG = {
  touchTargetSize: 48, // pixels (accessibility minimum)
  debounceDelay: 300, // ms (search input)
  transitionDuration: 200, // ms (animations)
  toastDuration: 3000, // ms (notification display)
  pageSize: 20 // items per page (pagination)
} as const;

/**
 * Feature Access by Tier
 */
export const FEATURE_ACCESS = {
  starter: [
    'guest_checkin',
    'host_management',
    'expected_guests',
    'returning_visitors',
    'search_export',
    'email_templates',
    'sms_templates',
    'notification_tones'
  ],
  professional: [
    'slack_integration',
    'teams_integration',
    'quiet_hours',
    'cloud_backup',
    'multi_device_sync',
    'notification_logs',
    'email_support',
    'multiple_locations'
  ],
  enterprise: [
    'webhooks',
    'custom_templates',
    'advanced_routing',
    'delivery_guarantees',
    'api_access',
    'dedicated_support',
    'white_label',
    'sso'
  ]
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  guest: {
    noName: 'Please enter a name (2+ characters)',
    noHost: 'Please select who you are visiting',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number'
  },
  csv: {
    missingColumns: 'CSV must have Name and Email columns',
    noData: 'No valid data found in CSV file',
    tooManyRows: 'CSV exceeds 1000 row limit',
    parseError: 'Could not parse CSV file'
  },
  network: {
    checkInFailed: 'Failed to check in guest',
    notificationFailed: 'Could not send notification',
    paymentFailed: 'Payment processing failed'
  },
  auth: {
    unauthorized: 'You are not authorized to perform this action',
    sessionExpired: 'Your session has expired. Please log in again'
  }
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  checkIn: 'Guest checked in successfully',
  hostAdded: 'Host added successfully',
  hostUpdated: 'Host settings updated',
  hostDeleted: 'Host deleted',
  csvImported: 'Hosts imported successfully',
  dataSaved: 'Data saved to device',
  exported: 'Data exported successfully'
} as const;

/**
 * Touch Points for Mobile UI
 */
export const MOBILE_BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

/**
 * Tablet Minimum (7-inch screens, typically 600px+)
 */
export const MIN_TABLET_WIDTH = 600;
