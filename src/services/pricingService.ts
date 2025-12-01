/**
 * Pricing Service - REVISED
 * Starter now includes WhatsApp notifications!
 */

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  billingCycle: 'month' | 'year';
  description: string;
  features: Feature[];
  highlighted: boolean;
  stripePriceId: string;
  buttonText: string;
  buttonColor: string;
}

export interface Feature {
  text: string;
  included: boolean;
  category: 'core' | 'notifications' | 'data' | 'support' | 'admin';
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5,
    billingCycle: 'month',
    description: 'Full notifications included - perfect for SME',
    highlighted: false,
    stripePriceId: 'price_starter_monthly',
    buttonText: 'Get Started',
    buttonColor: 'slate',
    features: [
      // Core Features
      {
        text: 'Unlimited guest check-ins',
        included: true,
        category: 'core'
      },
      {
        text: 'Host/employee management',
        included: true,
        category: 'core'
      },
      {
        text: 'Expected guest lists',
        included: true,
        category: 'core'
      },
      {
        text: 'Returning visitor detection',
        included: true,
        category: 'core'
      },
      {
        text: 'Search & advanced filtering',
        included: true,
        category: 'core'
      },
      
      // Notifications (NOW FULL!)
      {
        text: 'Automatic email notifications ⭐',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Automatic WhatsApp notifications ⭐',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Notification templates',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Multiple message tones',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Per-host notification settings',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Notification history logs',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Slack integration',
        included: false,
        category: 'notifications'
      },
      {
        text: 'Teams integration',
        included: false,
        category: 'notifications'
      },
      {
        text: 'Webhooks',
        included: false,
        category: 'notifications'
      },

      // Data & Storage
      {
        text: 'Local database (Dexie)',
        included: true,
        category: 'data'
      },
      {
        text: 'Export to CSV/Excel',
        included: true,
        category: 'data'
      },
      {
        text: 'Export to PDF reports',
        included: true,
        category: 'data'
      },
      {
        text: 'Cloud backup',
        included: false,
        category: 'data'
      },
      {
        text: 'Multi-device sync',
        included: false,
        category: 'data'
      },

      // Support
      {
        text: 'Community forums',
        included: true,
        category: 'support'
      },
      {
        text: 'Email support',
        included: false,
        category: 'support'
      },

      // Admin
      {
        text: 'Single location',
        included: true,
        category: 'admin'
      },
      {
        text: 'Up to 3 users',
        included: true,
        category: 'admin'
      },
      {
        text: 'Analytics dashboard',
        included: true,
        category: 'admin'
      },
      {
        text: 'Custom branding',
        included: false,
        category: 'admin'
      }
    ]
  },

  {
    id: 'professional',
    name: 'Professional',
    price: 15,
    billingCycle: 'month',
    description: 'Team messaging + cloud sync - for growing teams',
    highlighted: true,
    stripePriceId: 'price_professional_monthly',
    buttonText: 'Upgrade to Pro',
    buttonColor: 'indigo',
    features: [
      // Core Features
      {
        text: 'Unlimited guest check-ins',
        included: true,
        category: 'core'
      },
      {
        text: 'Unlimited hosts/employees',
        included: true,
        category: 'core'
      },
      {
        text: 'Expected guest lists',
        included: true,
        category: 'core'
      },
      {
        text: 'Returning visitor detection',
        included: true,
        category: 'core'
      },
      {
        text: 'Search & advanced filtering',
        included: true,
        category: 'core'
      },

      // Notifications (ENHANCED)
      {
        text: 'Email notifications',
        included: true,
        category: 'notifications'
      },
      {
        text: 'WhatsApp notifications',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Customizable templates',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Multiple message tones',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Quiet hours scheduling ⭐',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Slack integration ⭐',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Microsoft Teams integration ⭐',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Notification history & logs',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Webhooks',
        included: false,
        category: 'notifications'
      },

      // Data & Storage
      {
        text: 'Local database (Dexie)',
        included: true,
        category: 'data'
      },
      {
        text: 'Export to CSV/Excel',
        included: true,
        category: 'data'
      },
      {
        text: 'Export to PDF reports',
        included: true,
        category: 'data'
      },
      {
        text: 'Encrypted cloud backup ⭐',
        included: true,
        category: 'data'
      },
      {
        text: 'Automatic daily backups',
        included: true,
        category: 'data'
      },
      {
        text: 'Multi-device sync ⭐',
        included: true,
        category: 'data'
      },
      {
        text: 'Backup versioning (30 days)',
        included: true,
        category: 'data'
      },

      // Support
      {
        text: 'Community forums',
        included: true,
        category: 'support'
      },
      {
        text: 'Email support (24hr response)',
        included: true,
        category: 'support'
      },

      // Admin
      {
        text: 'Multiple locations',
        included: true,
        category: 'admin'
      },
      {
        text: 'Up to 10 users',
        included: true,
        category: 'admin'
      },
      {
        text: 'Advanced analytics',
        included: true,
        category: 'admin'
      },
      {
        text: 'Custom branding',
        included: false,
        category: 'admin'
      }
    ]
  },

  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 25,
    billingCycle: 'month',
    description: 'Complete solution with webhooks + dedicated support',
    highlighted: false,
    stripePriceId: 'price_enterprise_monthly',
    buttonText: 'Contact Sales',
    buttonColor: 'emerald',
    features: [
      // Core Features
      {
        text: 'Unlimited everything',
        included: true,
        category: 'core'
      },
      {
        text: 'Expected guest management',
        included: true,
        category: 'core'
      },
      {
        text: 'Returning visitor tracking',
        included: true,
        category: 'core'
      },
      {
        text: 'Advanced search & filtering',
        included: true,
        category: 'core'
      },
      {
        text: 'Custom check-in flows',
        included: true,
        category: 'core'
      },

      // Notifications (COMPLETE)
      {
        text: 'Email notifications',
        included: true,
        category: 'notifications'
      },
      {
        text: 'WhatsApp notifications',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Slack integration',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Microsoft Teams integration',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Custom webhooks ⭐',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Custom notification templates',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Advanced routing rules',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Delivery guarantee & retry logic',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Notification API access',
        included: true,
        category: 'notifications'
      },

      // Data & Storage
      {
        text: 'Local + cloud database',
        included: true,
        category: 'data'
      },
      {
        text: 'All export formats',
        included: true,
        category: 'data'
      },
      {
        text: 'Encrypted cloud backup',
        included: true,
        category: 'data'
      },
      {
        text: 'Real-time multi-device sync ⭐',
        included: true,
        category: 'data'
      },
      {
        text: 'Extended backup retention (1 year)',
        included: true,
        category: 'data'
      },
      {
        text: 'Data residency options',
        included: true,
        category: 'data'
      },
      {
        text: 'API data access',
        included: true,
        category: 'data'
      },

      // Support
      {
        text: 'Priority email (4hr response)',
        included: true,
        category: 'support'
      },
      {
        text: 'Phone support',
        included: true,
        category: 'support'
      },
      {
        text: 'Dedicated account manager ⭐',
        included: true,
        category: 'support'
      },
      {
        text: 'Custom onboarding',
        included: true,
        category: 'support'
      },

      // Admin
      {
        text: 'Unlimited locations',
        included: true,
        category: 'admin'
      },
      {
        text: 'Unlimited users',
        included: true,
        category: 'admin'
      },
      {
        text: 'Role-based access control',
        included: true,
        category: 'admin'
      },
      {
        text: 'Audit logs & compliance',
        included: true,
        category: 'admin'
      },
      {
        text: 'Custom branding ⭐',
        included: true,
        category: 'admin'
      },
      {
        text: 'White-label options',
        included: true,
        category: 'admin'
      },
      {
        text: 'SSO & advanced security',
        included: true,
        category: 'admin'
      }
    ]
  }
];

// Feature categories
export const FEATURE_CATEGORIES = [
  { id: 'core', label: 'Core Features', icon: '✓' },
  { id: 'notifications', label: '📧 Visitor Notifications (THE DIFFERENTIATOR)', icon: '🔔' },
  { id: 'data', label: 'Data & Backup', icon: '💾' },
  { id: 'support', label: 'Support', icon: '💬' },
  { id: 'admin', label: 'Administration', icon: '⚙️' }
];

// Comparison table
export const COMPARISON_TABLE = [
  { feature: 'Guest Check-in', starter: true, professional: true, enterprise: true },
  { feature: 'Email Notifications', starter: true, professional: true, enterprise: true },
  { feature: 'WhatsApp Notifications', starter: true, professional: true, enterprise: true },
  { feature: 'Slack/Teams Integration', starter: false, professional: true, enterprise: true },
  { feature: 'Custom Webhooks', starter: false, professional: false, enterprise: true },
  { feature: 'Cloud Backup', starter: false, professional: true, enterprise: true },
  { feature: 'Multi-device Sync', starter: false, professional: true, enterprise: true },
  { feature: 'Advanced Analytics', starter: false, professional: true, enterprise: true },
  { feature: 'Priority Support', starter: false, professional: false, enterprise: true }
];

export interface PaymentOption {
  tier: string;
  priceId: string;
  amount: number;
  interval: 'month' | 'year';
}

export const STRIPE_PRICES: PaymentOption[] = [
  {
    tier: 'starter',
    priceId: import.meta.env.VITE_STRIPE_STARTER_MONTHLY || 'price_starter_monthly',
    amount: 5,
    interval: 'month'
  },
  {
    tier: 'starter',
    priceId: import.meta.env.VITE_STRIPE_STARTER_YEARLY || 'price_starter_yearly',
    amount: 48,
    interval: 'year'
  },
  {
    tier: 'professional',
    priceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY || 'price_professional_monthly',
    amount: 15,
    interval: 'month'
  },
  {
    tier: 'professional',
    priceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_YEARLY || 'price_professional_yearly',
    amount: 144,
    interval: 'year'
  },
  {
    tier: 'enterprise',
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    amount: 25,
    interval: 'month'
  },
  {
    tier: 'enterprise',
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
    amount: 240,
    interval: 'year'
  }
];
