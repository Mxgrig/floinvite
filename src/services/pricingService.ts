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
    price: 29,
    billingCycle: 'month',
    description: 'Everything a small organisation needs to know who is on site',
    highlighted: false,
    stripePriceId: 'price_1SkJhFIB0Mi9CiIRq7m1oZB6',
    buttonText: 'Get Started',
    buttonColor: 'slate',
    features: [
      // Core Features
      {
        text: 'Up to 20 hosts/visitors',
        included: true,
        category: 'core'
      },
      {
        text: 'Guest check-in',
        included: true,
        category: 'core'
      },
      {
        text: 'Host/employee management',
        included: true,
        category: 'core'
      },
      {
        text: 'Visitor logbook',
        included: true,
        category: 'core'
      },
      {
        text: 'Search & filtering',
        included: true,
        category: 'core'
      },

      // Notifications
      {
        text: 'Email notifications',
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
        text: 'Data export',
        included: false,
        category: 'data'
      },
      {
        text: 'Cloud backup',
        included: false,
        category: 'data'
      },

      // Support
      {
        text: 'Email support',
        included: false,
        category: 'support'
      }
    ]
  },

  {
    id: 'compliance',
    name: 'Compliance+',
    price: 49,
    billingCycle: 'month',
    description: 'For estates and organisations that must retain records and stay audit-ready',
    highlighted: true,
    stripePriceId: 'price_1SkJhGIB0Mi9CiIRyZn3B9oB',
    buttonText: 'Upgrade to Compliance+',
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

      // Notifications
      {
        text: 'Email notifications',
        included: true,
        category: 'notifications'
      },
      {
        text: 'SMS notifications',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Customizable templates',
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

      // Data & Storage
      {
        text: 'Data export (CSV/JSON)',
        included: true,
        category: 'data'
      },
      {
        text: 'Cloud backup',
        included: true,
        category: 'data'
      },

      // Support
      {
        text: 'Email support',
        included: true,
        category: 'support'
      }
    ]
  },

  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    billingCycle: 'month',
    description: 'Custom integrations and advanced features. Contact sales.',
    highlighted: false,
    stripePriceId: 'price_enterprise_monthly',
    buttonText: 'Contact Sales',
    buttonColor: 'emerald',
    features: [
      // Core Features
      {
        text: 'Everything in Professional',
        included: true,
        category: 'core'
      },
      {
        text: 'Custom integrations',
        included: true,
        category: 'core'
      },
      {
        text: 'Dedicated support',
        included: true,
        category: 'core'
      },

      // Notifications
      {
        text: 'Slack integration',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Teams integration',
        included: true,
        category: 'notifications'
      },
      {
        text: 'Webhooks',
        included: true,
        category: 'notifications'
      },
      {
        text: 'API access',
        included: true,
        category: 'notifications'
      },

      // Data & Storage
      {
        text: 'Advanced backup options',
        included: true,
        category: 'data'
      },

      // Support
      {
        text: 'Priority support',
        included: true,
        category: 'support'
      },
      {
        text: 'Phone support',
        included: true,
        category: 'support'
      },
      {
        text: 'Dedicated account manager',
        included: true,
        category: 'support'
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
  { feature: 'Guest Check-in', starter: true, compliance: true, enterprise: true },
  { feature: 'Email Notifications', starter: true, compliance: true, enterprise: true },
  { feature: 'Visitor Logbook', starter: true, compliance: true, enterprise: true },
  { feature: 'Data Export (90 days)', starter: true, compliance: true, enterprise: true },
  { feature: 'Automatic Backups', starter: false, compliance: true, enterprise: true },
  { feature: '7-Year Record Retention', starter: false, compliance: true, enterprise: true },
  { feature: 'Audit-Ready Reports', starter: false, compliance: true, enterprise: true },
  { feature: 'Priority Support', starter: false, compliance: true, enterprise: true },
  { feature: 'Custom Integrations', starter: false, compliance: false, enterprise: true }
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
    priceId: import.meta.env.VITE_STRIPE_STARTER_MONTHLY || 'price_1SkJhFIB0Mi9CiIRq7m1oZB6',
    amount: 2900,
    interval: 'month'
  },
  {
    tier: 'starter',
    priceId: import.meta.env.VITE_STRIPE_STARTER_YEARLY || 'price_1SkJhFIB0Mi9CiIRbhu1w0nX',
    amount: 34800,
    interval: 'year'
  },
  {
    tier: 'compliance',
    priceId: import.meta.env.VITE_STRIPE_COMPLIANCE_MONTHLY || 'price_1SkJhGIB0Mi9CiIRyZn3B9oB',
    amount: 4900,
    interval: 'month'
  },
  {
    tier: 'compliance',
    priceId: import.meta.env.VITE_STRIPE_COMPLIANCE_YEARLY || 'price_1SkJhGIB0Mi9CiIRaSZNXzSh',
    amount: 58800,
    interval: 'year'
  },
  {
    tier: 'enterprise',
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_MONTHLY || 'price_1Sd7TJIB0Mi9CiIRa2ZEiKNt',
    amount: 0,
    interval: 'month'
  }
];
