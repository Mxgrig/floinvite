# Phase 2 - Required Code Changes

## Overview
Replace all client-side payment checks with server-side API calls.

---

## File 1: src/App.tsx - Update Payment Check

### BEFORE (Remove)
```typescript
import { UsageTracker } from './utils/usageTracker';

// In useEffect:
useEffect(() => {
  if (isAuthenticated && userTier === 'starter') {
    const interval = setInterval(() => {
      const shouldShow = UsageTracker.shouldShowUpgradePrompt();
      setShowUpgradePrompt(shouldShow);
    }, 2000);

    return () => clearInterval(interval);
  }
}, [isAuthenticated, userTier]);
```

### AFTER (Add)
```typescript
import { ServerPaymentService } from './services/serverPaymentService';

// In useEffect - Check payment status on app load
useEffect(() => {
  const checkPaymentStatus = async () => {
    if (!isAuthenticated) return;

    try {
      const status = await ServerPaymentService.getSubscriptionStatus(userEmail);

      // Show upgrade prompt if user is starter and subscription not active
      if (userTier === 'starter' && !status?.isActive) {
        setShowUpgradePrompt(true);
      } else {
        setShowUpgradePrompt(false);
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
    }
  };

  checkPaymentStatus();
}, [isAuthenticated, userEmail, userTier]);
```

---

## File 2: src/components/VisitorCheckIn.tsx

### BEFORE (Remove)
```typescript
import { UsageTracker } from '../utils/usageTracker';

const handleCheckIn = async () => {
  // Old check (bypassable)
  const usage = UsageTracker.getUsage();
  if (usage.isOverLimit) {
    alert('You have reached the free tier limit. Please upgrade.');
    return;
  }

  // Proceed with check-in
};
```

### AFTER (Add)
```typescript
import { ServerPaymentService } from '../services/serverPaymentService';

const handleCheckIn = async () => {
  // Server-side validation (cannot be bypassed)
  const hostCount = hosts.length;
  const guestCount = guests.length;
  const userEmail = localStorage.getItem('floinvite_user_email') || '';

  try {
    const result = await ServerPaymentService.checkIfCheckinAllowed(
      userEmail,
      hostCount,
      guestCount
    );

    if (!result.allowed) {
      if (result.reason === 'limit_reached') {
        alert(
          `You've reached the free tier limit of ${result.limits.total} hosts/visitors. ` +
          `Please upgrade to continue.`
        );
      } else if (result.reason === 'payment_required') {
        alert('Payment required. Please upgrade your subscription.');
      }
      return;
    }

    // Server confirmed check-in is allowed - proceed
    const newGuest = {
      id: generateId(),
      name: guestName,
      email: guestEmail,
      company: guestCompany,
      hostId: selectedHostId,
      checkInTime: new Date().toISOString(),
      status: GuestStatus.CHECKED_IN
    };

    // Add guest to IndexedDB
    setGuests([...guests, newGuest]);

    // Log usage event on server for audit trail
    await ServerPaymentService.logUsageEvent(
      userEmail,
      'guest_checkin',
      guests.length + 1
    );

    // Show success screen
    setShowSuccessScreen(true);

  } catch (error) {
    console.error('Check-in validation error:', error);
    alert('Unable to validate check-in. Please try again.');
  }
};
```

---

## File 3: src/components/HostManagement.tsx

### BEFORE (Remove)
```typescript
import { UsageTracker } from '../utils/usageTracker';

const handleAddHost = () => {
  const usage = UsageTracker.getUsage();
  if (usage.totalHosts >= usage.hostsLimit) {
    alert('Host limit reached. Upgrade to add more.');
    return;
  }
  // ...
};
```

### AFTER (Add)
```typescript
import { ServerPaymentService } from '../services/serverPaymentService';

const handleAddHost = async () => {
  const userEmail = localStorage.getItem('floinvite_user_email') || '';

  try {
    const result = await ServerPaymentService.checkIfCheckinAllowed(
      userEmail,
      hosts.length + 1, // Predicted count
      guests.length
    );

    if (!result.allowed) {
      alert(`Cannot add more hosts. Upgrade required. Current limit: ${result.limits.hosts}`);
      return;
    }

    // Server approved - add host
    const newHost = { /* ... */ };
    setHosts([...hosts, newHost]);

  } catch (error) {
    console.error('Error adding host:', error);
  }
};
```

---

## File 4: src/components/UpgradePrompt.tsx

### BEFORE (with dismissal)
```typescript
const handleDismiss = () => {
  UsageTracker.dismissUpgradePrompt();
  alert('You must choose a plan to continue using Floinvite.');
  // User could still use app (24-hour window)
};
```

### AFTER (no dismissal - server enforced)
```typescript
const handleDismiss = () => {
  // Cannot dismiss - server enforces upgrade
  alert(
    'Your free trial has ended. Please upgrade to continue using Floinvite.\n\n' +
    'Choose a plan below to proceed.'
  );
  // Dialog stays open - user must choose plan or close app
};
```

---

## File 5: src/services/paymentService.ts

### Remove or Deprecate
```typescript
// DEPRECATED - DO NOT USE
// These methods now return inaccurate data from localStorage
// Use ServerPaymentService instead

static isSubscribed(tier: 'professional' | 'enterprise'): boolean {
  // ❌ REMOVED - Use ServerPaymentService.isSubscribedTo() instead
}

static getCurrentTier(): 'starter' | 'professional' | 'enterprise' {
  // ❌ REMOVED - Use ServerPaymentService.getCurrentTier() instead
}

// Keep only Stripe checkout methods:
static async createCheckoutSession(...) { /* ... */ }
static async createEnterprisePaymentLink(...) { /* ... */ }
static async createPortalSession(...) { /* ... */ }
```

---

## File 6: src/utils/usageTracker.ts

### Deprecate Entire File
```typescript
/**
 * DEPRECATED - This file is no longer used
 *
 * All payment enforcement moved to server-side
 * See: src/services/serverPaymentService.ts
 *
 * Usage checks now happen at:
 * - POST /api/check-checkin-allowed
 * - GET /api/subscription-status
 */

// Keep for backward compatibility, but do not use in new code
```

---

## Environment Variables

### Update .env.production

```bash
# NEW: Backend API URL (for server-side validation)
VITE_API_URL=https://floinvite.com/api

# Update existing variables
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... # Use LIVE key in production
VITE_STRIPE_SECRET_KEY=sk_live_...      # Use LIVE key in production
```

---

## Testing After Changes

### Test 1: Verify Server Calls
```bash
# Open DevTools → Network tab
# Check-in a guest
# Should see:
# - GET /api/subscription-status?email=...
# - POST /api/check-checkin-allowed
```

### Test 2: Verify 20-Item Limit
```bash
# Create new account (starter tier)
# Add 20 hosts
# Try to add 21st
# Should see 403 Forbidden response
```

### Test 3: Verify Payment Unlocks Features
```bash
# Create test subscription in Stripe
# Wait for webhook to process (5-10 seconds)
# Add unlimited hosts
# Should all succeed
```

### Test 4: Verify Dismissal Removed
```bash
# Hit 20-item limit
# Upgrade prompt should appear
# Click "Close" or outside modal
# Prompt should NOT close (enforced by server)
```

---

## Rollback Instructions

If you need to revert Phase 2:

```bash
# Revert to Phase 1 code
git revert [Phase2-commit-hash]
npm run build

# Delete Phase 2 PHP files (keep data)
rm /public_html/api/db-setup.php
rm /public_html/api/subscription-status.php
rm /public_html/api/check-checkin-allowed.php

# Revert Stripe webhook to v1
mv /public_html/api/webhooks/stripe.php stripe-v2-backup.php
cp /public_html/api/webhooks/stripe-v1-backup.php stripe.php

# Update Stripe webhook URL back to stripe.php
# All data in MySQL persists (no data loss)
```

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| App.tsx | Remove UsageTracker interval, add ServerPaymentService | Payment checks now server-side |
| VisitorCheckIn.tsx | Add server validation before check-in | Cannot bypass 20-item limit |
| HostManagement.tsx | Add server validation before adding host | Host limits enforced server-side |
| UpgradePrompt.tsx | Remove dismissal logic | Upgrade is mandatory, not skippable |
| paymentService.ts | Deprecate client-side checks | Stripe checkout still works |
| usageTracker.ts | Deprecate entire file | Moved to backend |
| NEW: serverPaymentService.ts | Add server API calls | Core payment enforcement logic |

---

## Migration Checklist

- [ ] Create `serverPaymentService.ts` in src/services/
- [ ] Update App.tsx payment check
- [ ] Update VisitorCheckIn.tsx to call server validation
- [ ] Update HostManagement.tsx to call server validation
- [ ] Remove dismissal logic from UpgradePrompt.tsx
- [ ] Deprecate usageTracker.ts (or delete)
- [ ] Build and test: `npm run build && npm run preview`
- [ ] Deploy to production
- [ ] Verify API calls in Network tab
- [ ] Test 20-item limit enforcement
- [ ] Test payment upgrade flow

---

## Code Diff Summary

```diff
- import { UsageTracker } from './utils/usageTracker';
+ import { ServerPaymentService } from './services/serverPaymentService';

- const shouldShow = UsageTracker.shouldShowUpgradePrompt();
+ const result = await ServerPaymentService.checkIfCheckinAllowed(...);
+ if (!result.allowed) { /* reject */ }

- UsageTracker.dismissUpgradePrompt();
+ // Dismissal removed - server enforces payment

Lines changed: ~150 (small, focused changes)
Files modified: 4
Files deprecated: 1 (usageTracker.ts)
Files created: 1 (serverPaymentService.ts)
```

**That's it! Phase 2 complete.**
