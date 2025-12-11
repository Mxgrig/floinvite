# Professional Tier Feature Gating Implementation Guide

**Status:** ✅ Infrastructure Complete | Partial Implementation (Phase 1)
**Date:** December 11, 2024
**Effort:** ~4-6 hours total | 2 hours completed

---

## 🎯 Overview

This guide explains how to gate features behind the Professional tier ($10/month). The infrastructure is fully built - you just need to apply the gating to components.

---

## ✅ What's Already Done

### Infrastructure Created
- ✅ `src/utils/featureGating.ts` - Central feature matrix and access control
- ✅ `src/components/FeatureLocked.tsx` - Component for locked feature UI
- ✅ `src/components/FeatureLocked.css` - Styling

### Features Already Gated (Phase 1)
- ✅ **CSV/JSON Export** - Disabled in Logbook for Starter users
- ✅ **Feature Matrix** - All 20+ features defined per tier

---

## 🔐 How Feature Gating Works

### 1. Import the Gating Utilities
```typescript
import { hasFeature, getFeatureStatus } from '../utils/featureGating';
import { FeatureLocked } from './FeatureLocked';
```

### 2. Check Feature Access
```typescript
// Get user tier
const [userTier] = usePersistedState('floinvite_user_tier', 'starter');

// Check if feature is available
const canExport = hasFeature(userTier, 'csv_export');

// Or get detailed status
const status = getFeatureStatus(userTier, 'sms_notifications');
// Returns: { feature, available, tier, message }
```

### 3. Conditional Rendering

**Option A: Disable Button (Simple)**
```typescript
<button
  onClick={handleExport}
  disabled={!canExport}
  className={!canExport ? 'btn-disabled' : ''}
  title={!canExport ? 'Upgrade to Professional' : ''}
>
  Export {!canExport && '🔒'}
</button>
```

**Option B: Show Locked UI (Better UX)**
```typescript
{canExport ? (
  <ExportSection />
) : (
  <FeatureLocked feature="csv_export" tier={userTier} />
)}
```

---

## 📋 Features to Gate (Priority Order)

### High Priority (Revenue Critical)
| Feature | Component | Location | Difficulty |
|---------|-----------|----------|------------|
| Expected Guest Management | VisitorCheckIn.tsx | Line ~200 | Medium |
| Returning Visitor Lookup | VisitorCheckIn.tsx | Line ~250 | Medium |
| SMS Notifications | HostManagement.tsx | Line ~300 | Medium |
| Export (CSV/JSON) | Logbook.tsx | ✅ DONE | - |

### Medium Priority
| Feature | Component | Location | Difficulty |
|---------|-----------|----------|------------|
| Cloud Backup | Settings.tsx | Line ~400 | High |
| Analytics Dashboard | Dashboard.tsx | NEW | High |
| Custom Templates | NotificationSettings.tsx | NEW | Medium |

### Low Priority (Phase 2)
| Feature | Component | Difficulty |
|---------|-----------|------------|
| Slack Integration | NotificationChannel.tsx | High |
| Teams Integration | NotificationChannel.tsx | High |
| Webhooks | Settings.tsx | High |
| API Access | NEW | Very High |

---

## 🛠️ Implementation Checklist

### Step 1: Expected Guest Management
**File:** `src/components/VisitorCheckIn.tsx`

```typescript
// Add at top
import { hasFeature } from '../utils/featureGating';

// In component
const [userTier] = usePersistedState('floinvite_user_tier', 'starter');
const canUseExpected = hasFeature(userTier, 'expected_guests');

// Gate the feature
{canUseExpected ? (
  <button onClick={() => setStep('expected')}>
    I'm Expected
  </button>
) : (
  <div className="feature-locked-badge">
    Expected Guest Lookup - Professional Only 🔒
  </div>
)}
```

**Estimated Time:** 30 minutes

---

### Step 2: Returning Visitor Tracking
**File:** `src/components/VisitorCheckIn.tsx`

```typescript
const canTrackReturning = hasFeature(userTier, 'returning_visitors');

// In walk-in form, show returning visitor match ONLY if Professional
{canTrackReturning && returningVisitor && (
  <div className="returning-visitor-alert">
    ✨ Welcome back! (Last visit: {returnDate})
  </div>
)}
```

**Estimated Time:** 20 minutes

---

### Step 3: SMS Notifications
**File:** `src/components/HostManagement.tsx`

```typescript
const canUseSMS = hasFeature(userTier, 'sms_notifications');

// Gate SMS carrier selection
{canUseSMS ? (
  <select value={smsCarrier} onChange={...}>
    <option>Vodafone</option>
    {/* ... */}
  </select>
) : (
  <FeatureLocked feature="sms_notifications" tier={userTier} />
)}
```

**Estimated Time:** 45 minutes

---

### Step 4: Cloud Backup (Settings)
**File:** `src/components/Settings.tsx`

```typescript
const canBackup = hasFeature(userTier, 'cloud_backup');

{canBackup && (
  <button onClick={handleCloudBackup}>
    💾 Backup to Cloud
  </button>
)}
```

**Estimated Time:** 20 minutes

---

### Step 5: Custom Templates
**File:** `src/components/NotificationSettings.tsx` (NEW)

```typescript
const canCustomize = hasFeature(userTier, 'custom_templates');

{canCustomize ? (
  <TemplateEditor />
) : (
  <FeatureLocked feature="custom_templates" tier={userTier} />
)}
```

**Estimated Time:** 60 minutes

---

## 📊 Feature Matrix Reference

```typescript
STARTER ($5/month):
✓ Guest check-in (unlimited)
✓ Host management
✓ Visitor logbook
✓ Email notifications
✓ Search & filtering
✗ Expected guests
✗ Returning visitors
✗ SMS notifications
✗ CSV/JSON export
✗ Cloud backup
✗ Analytics

PROFESSIONAL ($10/month):
✓ Everything from Starter +
✓ Expected guests
✓ Returning visitors
✓ SMS notifications
✓ CSV/JSON export
✓ Cloud backup
✓ Analytics dashboard
✓ Email support
✓ Custom templates
✗ Slack/Teams integration
✗ Webhooks
✗ API access

ENTERPRISE (Custom):
✓ Everything from Professional +
✓ Slack/Teams integration
✓ Webhooks
✓ API access
✓ Dedicated support
```

---

## 🧪 Testing Gating

### Test Case 1: Starter User Cannot Export
```
1. Create account → Starter plan
2. Add guests (check-in a few visitors)
3. Go to Logbook
4. Click "Export CSV" button
5. ✅ Should be disabled with lock icon
6. ✅ Hover shows "Upgrade to Professional"
```

### Test Case 2: After Upgrade, Features Unlock
```
1. Create account → Starter
2. Go to VisitorCheckIn
3. ✅ "I'm Expected" button is hidden
4. Click "Upgrade Now"
5. Complete Stripe payment
6. Refresh page
7. ✅ "I'm Expected" button now visible
8. ✅ Export buttons in Logbook are enabled
```

### Test Case 3: Professional User Has All Features
```
1. Create account with tier manually set to 'professional'
localStorage.setItem('floinvite_user_tier', 'professional')
2. Check all gated features are visible/enabled
3. ✅ All Professional features accessible
4. ✅ No locks or upgrade prompts
```

---

## 🚨 Backend Validation (Important!)

Currently, **all gating is frontend only**. Add backend validation to prevent cheating:

**File:** `public/api/create-checkout-session.php` & `public/api/webhooks/stripe.php`

```php
// Validate tier before allowing API calls
function validateUserTier($tier, $requiredTier = 'professional') {
  if ($tier !== $requiredTier && $tier !== 'enterprise') {
    http_response_code(403);
    echo json_encode(['error' => 'Feature not available for this tier']);
    exit;
  }
}

// Example: Gate export endpoint
if ($_GET['action'] === 'export') {
  $userTier = $_POST['userTier']; // Validate this server-side!
  validateUserTier($userTier, 'professional');
  // Allow export...
}
```

---

## 📝 Implementation Progress

### Phase 1 (DONE)
- ✅ Feature matrix created
- ✅ Gating utilities built
- ✅ FeatureLocked component created
- ✅ Export feature gated (Logbook.tsx)
- ✅ Build passes

### Phase 2 (TODO - ~3 hours)
- [ ] Gate expected guests (VisitorCheckIn.tsx)
- [ ] Gate returning visitors (VisitorCheckIn.tsx)
- [ ] Gate SMS notifications (HostManagement.tsx)
- [ ] Gate cloud backup (Settings.tsx)
- [ ] Test all scenarios

### Phase 3 (TODO - ~1 hour)
- [ ] Add backend validation to PHP endpoints
- [ ] Create feature bypass test
- [ ] Document edge cases

---

## 🔍 Common Patterns

### Pattern 1: Hide Button for Locked Feature
```typescript
{hasFeature(userTier, 'sms_notifications') && (
  <SMSSection />
)}
```

### Pattern 2: Show Disabled Button with Explanation
```typescript
<button
  disabled={!hasFeature(userTier, 'custom_templates')}
  title={hasFeature(userTier, 'custom_templates') ? '' : 'Upgrade required'}
>
  Edit Templates {!hasFeature(userTier, 'custom_templates') && '🔒'}
</button>
```

### Pattern 3: Full Locked Component
```typescript
{hasFeature(userTier, 'analytics_dashboard') ? (
  <AnalyticsDashboard />
) : (
  <FeatureLocked feature="analytics_dashboard" tier={userTier} />
)}
```

---

## 💡 Tips

1. **Always import featureGating utilities at top**
2. **Test with different tiers locally** - Change localStorage manually
3. **Show upgrade CTAs prominently** - Don't just hide features
4. **Backend validation is critical** - Frontend gating can be bypassed
5. **Consider UX** - Disabled buttons confuse users; show why it's locked

---

## 🎬 Next Steps

1. **Implement Phase 2** - Gate expected guests & returning visitors
2. **Add backend validation** - Prevent frontend bypass
3. **Test thoroughly** - All tier combinations
4. **Deploy to production** - Monitor for any issues
5. **Collect feedback** - From first users

---

## 📞 Quick Reference

**Feature Check:**
```typescript
hasFeature(userTier, 'feature_name') → boolean
```

**Get Status:**
```typescript
getFeatureStatus(userTier, 'feature_name') → { feature, available, tier, message }
```

**Get Locked Features:**
```typescript
getLockedFeatures(userTier) → ['feature1', 'feature2', ...]
```

**Get Upgrade Features:**
```typescript
getUpgradeFeatures(userTier) → ['feature1', 'feature2', ...]
```

---

**Total Effort:** ~4-6 hours
**Completed:** 2 hours (infrastructure)
**Remaining:** 2-4 hours (implementation)
**Status:** 🟡 In Progress

