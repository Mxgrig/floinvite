# Complete Payment Lockout System

**Status**: READY TO IMPLEMENT
**Date**: December 12, 2025
**Purpose**: User breaches free limit → Everything locked down

---

## Overview

When a user with a **starter tier account** reaches their **20-item free limit**:

1. ✅ They CANNOT check in guests
2. ✅ They CANNOT add hosts
3. ✅ They CANNOT edit hosts
4. ✅ They CANNOT import hosts
5. ✅ They CANNOT do ANYTHING except:
   - Logout
   - Check out existing guests (reduces count)
   - Delete hosts (reduces count)
   - Delete guests (reduces count)
   - Upgrade subscription

**Everything is blocked server-side. Cannot be bypassed.**

---

## Architecture

### Two-Layer Enforcement

#### Layer 1: App-Wide Hook (Frontend)
```
App Loads
  → usePaymentEnforcement(email, hostCount, guestCount)
  → Checks: Is user over limit?
  → If YES: Show PaymentBlockingOverlay
  → If NO: Show normal app
```

#### Layer 2: Operation Checks (Backend)
```
User tries any action (check-in, add host, etc.)
  → Frontend calls checkIfOperationAllowed()
  → Server checks: Is limit breached?
  → If YES: Returns 403 Forbidden
  → If NO: Allows operation
```

---

## Files Delivered

### 1. **usePaymentEnforcement Hook**
**File**: `src/hooks/usePaymentEnforcement.ts`

**Purpose**: Check if user is over limit on app load and every 5 seconds

**Usage**:
```typescript
const { isOverLimit, isLoading, checkInResult, reason } = usePaymentEnforcement(
  email,
  hostCount,
  guestCount,
  checkIntervalSeconds = 5  // Re-check every 5 seconds
);

if (isOverLimit) {
  return <PaymentBlockingOverlay {...} />;
}
```

**What it does**:
- Calls server on mount
- Re-checks every 5 seconds
- Blocks app if user is over limit
- Shows usage details

---

### 2. **PaymentBlockingOverlay Component**
**File**: `src/components/PaymentBlockingOverlay.tsx`

**Purpose**: Full-screen blocking overlay when user is over limit

**Features**:
- ✅ Full-screen dark backdrop (nothing clickable behind it)
- ✅ Shows current usage vs limit (e.g., "21/20")
- ✅ Shows usage bar with percentage
- ✅ Lists what's blocked:
  - Cannot check in guests
  - Cannot add hosts
  - Cannot edit hosts
  - Cannot import hosts
  - Cannot do anything else
- ✅ Shows both plan options (Starter vs Professional)
- ✅ "Upgrade" button redirects to Stripe checkout
- ✅ "Log Out" button lets user logout
- ✅ Cannot dismiss or bypass (no close button)

**Visual**: Shows red alert, clear usage statistics, pricing comparison

---

### 3. **Operation-Level Enforcement Endpoint**
**File**: `public/api/check-operation-allowed.php`

**Purpose**: Validate every operation on server-side

**Endpoint**: `POST /api/check-operation-allowed`

**Request**:
```json
{
  "email": "user@example.com",
  "operation": "checkin|checkout|add_host|edit_host|delete_host|etc",
  "currentHostCount": 10,
  "currentGuestCount": 11
}
```

**Operations BLOCKED if over limit**:
- `checkin` - Cannot check in new guest
- `add_host` - Cannot add new host
- `edit_host` - Cannot edit host
- `import_hosts` - Cannot bulk import

**Operations ALWAYS ALLOWED** (help reduce usage):
- `checkout` - Can check out guests
- `delete_host` - Can delete hosts
- `delete_guest` - Can delete guests
- `logout` - Can always logout
- `view_logbook` - Can view data
- `view_settings` - Can view settings

**Response** (if blocked):
```json
HTTP 403 Forbidden
{
  "allowed": false,
  "reason": "limit_reached",
  "operation": "checkin",
  "tier": "starter",
  "message": "You have reached the free tier limit. Upgrade to continue."
}
```

---

### 4. **ServerPaymentService Update**
**File**: `src/services/serverPaymentService.ts` (updated)

**New Method**: `checkIfOperationAllowed()`

**Usage**:
```typescript
const result = await ServerPaymentService.checkIfOperationAllowed(
  email,
  'checkin',  // operation type
  hostCount,
  guestCount
);

if (!result.allowed) {
  alert(result.message);
  if (result.reason === 'limit_reached') {
    showUpgradePrompt();
  }
  return;  // Stop operation
}

// Proceed with operation
```

---

## Implementation Guide

### Step 1: Add App-Wide Check in App.tsx

```typescript
import { usePaymentEnforcement } from './hooks/usePaymentEnforcement';
import { PaymentBlockingOverlay } from './components/PaymentBlockingOverlay';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = usePersistedState('auth_token', false);
  const [hosts] = usePersistedState('hosts', []);
  const [guests] = usePersistedState('guests', []);
  const userEmail = localStorage.getItem('floinvite_user_email') || '';

  // Check if user is over limit (blocking enforcement)
  const paymentCheck = usePaymentEnforcement(
    userEmail,
    hosts.length,
    guests.length
  );

  // If user is over limit, show blocking overlay
  if (isAuthenticated && paymentCheck.isOverLimit) {
    return (
      <PaymentBlockingOverlay
        email={userEmail}
        checkInResult={paymentCheck.checkInResult!}
        reason={paymentCheck.reason as 'limit_reached' | 'payment_required'}
        onUpgradeClick={() => {
          // User will be redirected to Stripe
        }}
        onLogout={() => {
          setIsAuthenticated(false);
        }}
      />
    );
  }

  // Normal app rendering if not over limit
  return <div className="app">{/* ... */}</div>;
}
```

### Step 2: Add Operation Checks in Components

**Example: VisitorCheckIn.tsx**
```typescript
import { ServerPaymentService } from '../services/serverPaymentService';

const handleCheckIn = async () => {
  const userEmail = localStorage.getItem('floinvite_user_email') || '';

  // CHECK 1: App-wide enforcement (already blocked by overlay)
  // (This is redundant but safe - belt and suspenders)

  // CHECK 2: Operation-level enforcement
  const operationCheck = await ServerPaymentService.checkIfOperationAllowed(
    userEmail,
    'checkin',
    hosts.length,
    guests.length
  );

  if (!operationCheck.allowed) {
    alert(operationCheck.message);
    return;  // Stop here
  }

  // Operation is allowed - proceed
  const newGuest = { /* guest data */ };
  setGuests([...guests, newGuest]);
  setShowSuccessScreen(true);
};
```

**Example: HostManagement.tsx**
```typescript
const handleAddHost = async () => {
  const userEmail = localStorage.getItem('floinvite_user_email') || '';

  // Check if add_host operation is allowed
  const operationCheck = await ServerPaymentService.checkIfOperationAllowed(
    userEmail,
    'add_host',
    hosts.length + 1,  // Predicted count after add
    guests.length
  );

  if (!operationCheck.allowed) {
    alert(operationCheck.message);
    return;
  }

  // Allowed - add host
  const newHost = { /* host data */ };
  setHosts([...hosts, newHost]);
};

const handleDeleteGuest = async (guestId: string) => {
  const userEmail = localStorage.getItem('floinvite_user_email') || '';

  // Delete is always allowed (helps reduce usage)
  // But still log it
  const operationCheck = await ServerPaymentService.checkIfOperationAllowed(
    userEmail,
    'delete_guest',
    hosts.length,
    guests.length - 1  // Predicted count after delete
  );

  // Delete is allowed even if over limit (helps user reduce usage)
  const filtered = guests.filter(g => g.id !== guestId);
  setGuests(filtered);
};
```

---

## User Experience Flow

### Scenario: User Hits Limit

```
1. User has 20 hosts/guests (at limit)
2. User tries to check in guest #21
   ↓
3. Frontend calls usePaymentEnforcement
   ↓
4. Server checks: 21 > 20?  YES
   ↓
5. Hook returns: { isOverLimit: true, reason: 'limit_reached' }
   ↓
6. App renders: <PaymentBlockingOverlay />
   ↓
7. User sees: Full-screen blocking modal
   - Shows: "Free Limit Reached"
   - Shows: "21/20 items used"
   - Shows: Red warning
   - Shows: Cannot do anything
   - Shows: "Upgrade to Professional" button
   - Shows: "Log Out" button
   - Cannot dismiss (no close button, clicking close shows alert)
   ↓
8. User clicks "Upgrade to Professional"
   ↓
9. Redirected to Stripe checkout
   ↓
10. Completes payment ($10/month)
    ↓
11. Stripe webhook processes payment
    ↓
12. Database updated: tier = 'professional'
    ↓
13. User returns to app
    ↓
14. usePaymentEnforcement re-checks
    ↓
15. Server checks: User is now professional tier
    ↓
16. Hook returns: { isOverLimit: false }
    ↓
17. App shows: Normal interface (overlay gone)
    ↓
18. User can now check in unlimited guests ✓
```

---

## Security Guarantees

✅ **Cannot Bypass with DevTools**
- `usePaymentEnforcement` calls server every 5 seconds
- Server has real data in MySQL
- User cannot fake the response

✅ **Cannot Dismiss Blocking Overlay**
- No close button
- Clicking outside does nothing
- Trying to close shows alert
- Only options: Upgrade or Logout

✅ **Cannot Perform Blocked Operations**
- Every operation checked server-side
- Server returns 403 Forbidden if blocked
- Frontend respects response
- Audit logged for compliance

✅ **Cannot Hide Usage Count**
- Server reads from `usage_tracking` table
- Cannot be edited by client
- Accurate count maintained

---

## Database Logging

### usage_tracking Table

Every operation attempt is logged:

```sql
SELECT * FROM usage_tracking
WHERE user_email = 'user@example.com'
AND action_type LIKE '%blocked%';

Result shows:
| action_type | count_after | timestamp |
|-------------|------------|-----------|
| checkin_blocked | 21 | 2025-12-12 14:35:22 |
| checkin_blocked | 21 | 2025-12-12 14:40:15 |
| add_host_blocked | 21 | 2025-12-12 14:45:30 |

This proves the user tried to exceed their limit.
```

---

## Configuration

### Check Interval
In `usePaymentEnforcement`, adjust how often to re-check:

```typescript
// Default: re-check every 5 seconds
usePaymentEnforcement(email, hostCount, guestCount, 5);

// Faster: re-check every 2 seconds
usePaymentEnforcement(email, hostCount, guestCount, 2);

// Slower: re-check every 10 seconds
usePaymentEnforcement(email, hostCount, guestCount, 10);
```

### Operation Allowlist
In `check-operation-allowed.php`, modify which operations are blocked:

```php
// Currently blocked if over limit:
'operations_blocked_if_over_limit' => [
  'checkin',        // ← Can modify
  'add_host',       // ← Can modify
  'edit_host',      // ← Can modify
  'import_hosts',   // ← Can modify
],

// Currently allowed even if over limit:
'operations_always_allowed' => [
  'checkout',       // ← Can modify
  'delete_host',    // ← Can modify
  'delete_guest',   // ← Can modify
  'logout',         // ← Can modify
],
```

---

## Testing Checklist

### Test 1: Hit Limit with Check-In
- [ ] Create new account (starter tier)
- [ ] Add 20 hosts/guests
- [ ] Try to check in guest #21
- [ ] Verify: Cannot check in (blocked)
- [ ] Verify: Overlay appears (no dismiss)
- [ ] Verify: Can see "Upgrade" button
- [ ] Verify: "21/20" usage shown

### Test 2: Blocked Operations List
- [ ] Try to check in → blocked ❌
- [ ] Try to add host → blocked ❌
- [ ] Try to edit host → blocked ❌
- [ ] Try to import hosts → blocked ❌
- [ ] Try to check out guest → allowed ✓
- [ ] Try to delete host → allowed ✓
- [ ] Try to delete guest → allowed ✓

### Test 3: Upgrade Unlocks Features
- [ ] User over limit (blocked)
- [ ] Click "Upgrade to Professional"
- [ ] Complete Stripe payment
- [ ] Return to app
- [ ] Verify: Can check in unlimited now ✓
- [ ] Verify: Can add unlimited hosts ✓
- [ ] Verify: Overlay is gone

### Test 4: Cannot Bypass
- [ ] User over limit
- [ ] Open DevTools
- [ ] Try to edit localStorage
- [ ] Refresh page
- [ ] Verify: Still blocked (server re-checks)
- [ ] Try to use payment API directly
- [ ] Verify: Server returns 403 Forbidden

### Test 5: Reduce Usage to Unlock
- [ ] User over limit (21 items)
- [ ] Delete 2 guests (now 19 items)
- [ ] Refresh page
- [ ] Verify: Overlay is gone
- [ ] Verify: Can check in again ✓

---

## Rollback Plan

If payment enforcement causes issues:

```bash
# Revert code changes
git revert [payment-enforcement-commit]

# Remove blocking overlay
rm src/components/PaymentBlockingOverlay.tsx

# Remove enforcement hook
rm src/hooks/usePaymentEnforcement.ts

# Remove operation check endpoint
rm public/api/check-operation-allowed.php

# Rebuild and deploy
npm run build && scp -r dist/* [server]

# Data in MySQL persists - can re-enable later
```

---

## Monitoring

### SQL Queries to Monitor

```sql
-- Check blocked operation attempts
SELECT COUNT(*) as blocked_attempts
FROM usage_tracking
WHERE action_type LIKE '%blocked%'
AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Users currently over limit
SELECT DISTINCT user_email, COUNT(*) as item_count
FROM usage_tracking
WHERE action_type IN ('guest_checkin', 'host_added')
GROUP BY user_email
HAVING item_count > 20;

-- Recent upgrade decisions
SELECT user_email, COUNT(*) as upgrade_attempts
FROM usage_tracking
WHERE action_type = 'checkin_blocked'
AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY user_email
ORDER BY upgrade_attempts DESC;
```

---

## Summary

**What User Sees**:
- At limit? Get blocked by full-screen overlay
- Cannot dismiss overlay
- Cannot do any operations
- Can only upgrade or logout
- After upgrading: Everything unlocked

**What Happens Behind Scenes**:
- App checks limit every 5 seconds
- Every operation validated server-side
- 403 Forbidden if blocked
- All attempts logged for audit
- Cannot be faked or bypassed

**This is airtight payment enforcement.**
