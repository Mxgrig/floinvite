/**
 * Feature Gating System
 * Controls which features are available based on subscription tier
 */

export type SubscriptionTier = 'starter' | 'compliance' | 'enterprise';

export interface FeatureAccess {
  feature: string;
  available: boolean;
  tier: SubscriptionTier;
  message?: string;
}

/**
 * Feature matrix - defines which features are available in each tier
 */
const FEATURE_MATRIX: Record<string, Record<SubscriptionTier, boolean>> = {
  // Core Features
  'guest_checkin': {
    starter: true,
    professional: true,
    enterprise: true
  },
  'host_management': {
    starter: true,
    professional: true,
    enterprise: true
  },
  'visitor_logbook': {
    starter: true,
    professional: true,
    enterprise: true
  },
  'expected_guests': {
    starter: true,
    professional: true,
    enterprise: true
  },
  'returning_visitors': {
    starter: false,
    professional: true,
    enterprise: true
  },

  // Notifications
  'email_notifications': {
    starter: true,
    professional: true,
    enterprise: true
  },
  'sms_notifications': {
    starter: false,
    professional: true,
    enterprise: true
  },
  'slack_integration': {
    starter: false,
    professional: false,
    enterprise: true
  },
  'teams_integration': {
    starter: false,
    professional: false,
    enterprise: true
  },
  'custom_templates': {
    starter: false,
    professional: true,
    enterprise: true
  },

  // Data & Export
  'csv_export': {
    starter: false,
    professional: true,
    enterprise: true
  },
  'json_export': {
    starter: false,
    professional: true,
    enterprise: true
  },
  'pdf_export': {
    starter: false,
    professional: true,
    enterprise: true
  },
  'cloud_backup': {
    starter: false,
    professional: true,
    enterprise: true
  },

  // Advanced Features
  'advanced_search': {
    starter: true,
    professional: true,
    enterprise: true
  },
  'analytics_dashboard': {
    starter: false,
    professional: true,
    enterprise: true
  },
  'multi_device_sync': {
    starter: false,
    professional: true,
    enterprise: true
  },
  'webhooks': {
    starter: false,
    professional: false,
    enterprise: true
  },
  'api_access': {
    starter: false,
    professional: false,
    enterprise: true
  },

  // Support
  'email_support': {
    starter: false,
    professional: true,
    enterprise: true
  },
  'priority_support': {
    starter: false,
    professional: false,
    enterprise: true
  },
  'phone_support': {
    starter: false,
    professional: false,
    enterprise: true
  },
  'dedicated_account_manager': {
    starter: false,
    professional: false,
    enterprise: true
  }
};

/**
 * Check if a feature is available for the given tier
 */
export function hasFeature(tier: string, feature: string): boolean {
  // Normalize tier - treat 'starter-paid' same as 'starter'
  const normalizedTier = tier === 'starter-paid' ? 'starter' : (tier as SubscriptionTier);
  return FEATURE_MATRIX[feature]?.[normalizedTier] ?? false;
}

/**
 * Get all available features for a tier
 */
export function getTierFeatures(tier: SubscriptionTier): string[] {
  return Object.entries(FEATURE_MATRIX)
    .filter(([, tiers]) => tiers[tier])
    .map(([feature]) => feature);
}

/**
 * Check if a feature is locked and get upgrade message
 */
export function getFeatureStatus(tier: SubscriptionTier, feature: string): FeatureAccess {
  const available = hasFeature(tier, feature);

  let message = '';
  if (!available && tier === 'starter') {
    message = `Upgrade to Professional to unlock ${feature.replace(/_/g, ' ')}`;
  } else if (!available && tier === 'compliance') {
    message = `Contact sales for ${feature.replace(/_/g, ' ')} access`;
  }

  return {
    feature,
    available,
    tier,
    message
  };
}

/**
 * Get list of locked features for a tier
 */
export function getLockedFeatures(tier: SubscriptionTier): string[] {
  return Object.entries(FEATURE_MATRIX)
    .filter(([, tiers]) => !tiers[tier])
    .map(([feature]) => feature);
}

/**
 * Get features available in next tier
 */
export function getUpgradeFeatures(tier: SubscriptionTier): string[] {
  if (tier === 'enterprise') return [];

  const nextTier = tier === 'starter' ? 'compliance' : 'enterprise';
  const currentFeatures = new Set(getTierFeatures(tier));
  const nextFeatures = getTierFeatures(nextTier);

  return nextFeatures.filter(f => !currentFeatures.has(f));
}

/**
 * Get human-readable feature name
 */
export function getFeatureName(feature: string): string {
  const names: Record<string, string> = {
    'guest_checkin': 'Check-in',
    'host_management': 'Host Management',
    'visitor_logbook': 'Access Logbook',
    'expected_guests': 'Expected Arrival Management',
    'returning_visitors': 'Returning Arrival Tracking',
    'email_notifications': 'Email Notifications',
    'sms_notifications': 'SMS Notifications',
    'slack_integration': 'Slack Integration',
    'teams_integration': 'Teams Integration',
    'custom_templates': 'Custom Templates',
    'csv_export': 'CSV Export',
    'json_export': 'JSON Export',
    'pdf_export': 'PDF Export',
    'cloud_backup': 'Cloud Backup',
    'advanced_search': 'Advanced Search',
    'analytics_dashboard': 'Analytics Dashboard',
    'multi_device_sync': 'Multi-Device Sync',
    'webhooks': 'Custom Webhooks',
    'api_access': 'API Access',
    'email_support': 'Email Support',
    'priority_support': 'Priority Support',
    'phone_support': 'Phone Support',
    'dedicated_account_manager': 'Dedicated Account Manager'
  };

  return names[feature] || feature.replace(/_/g, ' ');
}

/**
 * Get upgrade recommendation based on tier and feature access
 */
export function getUpgradeRecommendation(tier: SubscriptionTier, attemptedFeature: string): string {
  if (tier === 'enterprise') {
    return 'Contact support for assistance';
  }

  if (tier === 'compliance') {
    return 'Contact sales to enable this feature';
  }

  // tier === 'starter'
  return `Upgrade to Professional to use ${getFeatureName(attemptedFeature)}`;
}
