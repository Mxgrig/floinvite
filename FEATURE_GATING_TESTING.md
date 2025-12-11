# Feature Gating Testing Guide

**Status:** ✅ Phase 2 Feature Gating Complete
**Date:** December 11, 2024
**Features Gated:** 5 core features

---

## Testing Overview

All feature gating is now implemented. Test each scenario below to verify:
1. Features are properly locked for Starter tier users
2. Features are accessible for Professional tier users
3. UI shows appropriate lock icons and upgrade messages
4. No TypeScript errors or console warnings

---

## Test Scenarios

### Scenario 1: Expected Guests (Starter User - Locked)

**Setup:**
```javascript
// In browser console:
localStorage.setItem('floinvite_user_tier', 'starter')
window.location.reload()
```

**Test:**
1. Navigate to **Check-in** page
2. **Expected Result:**
   - ❌ "I'm expected" button is disabled/locked
   - 🔒 Lock icon visible on button
   - ⚠️ Yellow warning box: "Expected Guest Lookup - Professional Feature"
   - Only "I'm a new visitor" button is clickable

**Expected Appearance:**
```
[I'm a new visitor] (enabled)
[I'm expected 🔒]  (locked, greyed out)
⚠️ "Expected Guest Lookup - Professional Feature"
   "Upgrade to Professional to enable expected guest lookup..."
```

---

### Scenario 2: Expected Guests (Professional User - Unlocked)

**Setup:**
```javascript
localStorage.setItem('floinvite_user_tier', 'professional')
window.location.reload()
```

**Test:**
1. Navigate to **Check-in** page
2. **Expected Result:**
   - ✅ "I'm expected" button is enabled and clickable
   - ✅ No lock icon, no warning message
   - Both buttons are fully functional

**Expected Appearance:**
```
[I'm a new visitor]
[I'm expected]
(No warning message)
```

---

### Scenario 3: SMS/WhatsApp Notifications (Starter User - Locked)

**Setup:**
```javascript
localStorage.setItem('floinvite_user_tier', 'starter')
window.location.reload()
```

**Test:**
1. Navigate to **Settings → Host Management**
2. Click **+ Add Host** or edit an existing host
3. **Expected Result:**
   - ✉️ "Email only" - ENABLED ✅
   - 💬 "WhatsApp only" - DISABLED 🔒 (greyed out, lock icon)
   - 📱 "Both (Email + WhatsApp)" - DISABLED 🔒 (greyed out, lock icon)
   - Red text: "WhatsApp & SMS notifications are available in Professional tier and above"
   - Can only select email notification method

**Expected Appearance:**
```
☑ ✉️ Email only
☐ 💬 WhatsApp only 🔒  (disabled)
☐ 📱 Both (Email + WhatsApp) 🔒  (disabled)
🔴 "WhatsApp & SMS notifications are available in Professional tier and above"
```

---

### Scenario 4: SMS/WhatsApp Notifications (Professional User - Unlocked)

**Setup:**
```javascript
localStorage.setItem('floinvite_user_tier', 'professional')
window.location.reload()
```

**Test:**
1. Navigate to **Settings → Host Management**
2. Click **+ Add Host** or edit an existing host
3. **Expected Result:**
   - ✉️ "Email only" - ENABLED ✅
   - 💬 "WhatsApp only" - ENABLED ✅ (no lock)
   - 📱 "Both (Email + WhatsApp)" - ENABLED ✅ (no lock)
   - No warning message
   - Can select all notification methods
   - If WhatsApp/Both selected, WhatsApp Number field appears

**Expected Appearance:**
```
☑ ✉️ Email only
☐ 💬 WhatsApp only
☐ 📱 Both (Email + WhatsApp)
(No warning message)
```

---

### Scenario 5: CSV Export (Starter User - Locked)

**Setup:**
```javascript
localStorage.setItem('floinvite_user_tier', 'starter')
// Add some test guests first
window.location.reload()
```

**Test:**
1. Navigate to **Logbook** page
2. **Expected Result:**
   - "Export CSV" button - DISABLED 🔒
   - "Export JSON" button - DISABLED 🔒
   - Both show lock icon: `Export CSV 🔒`
   - Both have tooltip: "Upgrade to Professional to export"
   - Clicking buttons does nothing

**Expected Appearance:**
```
[Export CSV 🔒]  (disabled, greyed out)
[Export JSON 🔒] (disabled, greyed out)
Hover shows: "Upgrade to Professional to export"
```

---

### Scenario 6: CSV Export (Professional User - Unlocked)

**Setup:**
```javascript
localStorage.setItem('floinvite_user_tier', 'professional')
// Add some test guests first
window.location.reload()
```

**Test:**
1. Navigate to **Logbook** page
2. **Expected Result:**
   - "Export CSV" button - ENABLED ✅
   - "Export JSON" button - ENABLED ✅
   - No lock icons
   - No tooltip
   - Clicking buttons initiates download

**Expected Appearance:**
```
[Export CSV]  (enabled, blue)
[Export JSON] (enabled, blue)
(Click downloads file)
```

---

### Scenario 7: Cloud Backup (Starter User - Locked)

**Setup:**
```javascript
localStorage.setItem('floinvite_user_tier', 'starter')
window.location.reload()
```

**Test:**
1. Navigate to **Settings → Backup & Data** tab
2. **Expected Result:**
   - 🔒 Large lock icon displayed
   - Title: "Cloud Backup - Professional Feature"
   - Message: "Export and backup your data to protect against data loss..."
   - Shows tier comparison:
     - "Starter tier: All data is stored locally in your browser"
     - "Professional tier: Enable cloud backup and export capabilities"
   - Export/Import buttons NOT visible
   - Storage info NOT visible

**Expected Appearance:**
```
🔒 (lock icon)
"Cloud Backup - Professional Feature"
"Export and backup your data to protect against data loss.
This feature is available in the Professional tier and above."

Starter tier: All data is stored locally in your browser
Professional tier: Enable cloud backup and export capabilities
```

---

### Scenario 8: Cloud Backup (Professional User - Unlocked)

**Setup:**
```javascript
localStorage.setItem('floinvite_user_tier', 'professional')
window.location.reload()
```

**Test:**
1. Navigate to **Settings → Backup & Data** tab
2. **Expected Result:**
   - ✅ Full backup section visible
   - Storage info and usage bar displayed
   - "Export All Data" button - ENABLED ✅
   - "Import Data" button - ENABLED ✅
   - "Delete All Data" button visible (in danger zone)
   - Buttons are fully functional

**Expected Appearance:**
```
"Storage Usage"
[████████░░] XX KB / 5MB

[Export All Data] (enabled, blue)
"Download all your data as a JSON file for backup"

[Import Data] (enabled, blue)
"Restore from a previously exported JSON file"

[Delete All Data] (red, danger zone)
```

---

## Verification Checklist

Complete all tests and verify:

### VisitorCheckIn.tsx - Expected Guests
- [ ] Starter: Button locked with 🔒 and yellow warning
- [ ] Professional: Button enabled, no warning
- [ ] Enterprise: Button enabled, no warning
- [ ] No console errors

### HostManagement.tsx - SMS Notifications
- [ ] Starter: WhatsApp/Both options disabled with 🔒
- [ ] Professional: All options enabled, no lock
- [ ] Enterprise: All options enabled, no lock
- [ ] Red warning text appears for Starter only
- [ ] No console errors

### Logbook.tsx - CSV Export
- [ ] Starter: Export buttons disabled with 🔒
- [ ] Professional: Export buttons enabled, functional
- [ ] Enterprise: Export buttons enabled, functional
- [ ] Tooltip shows "Upgrade to Professional to export" when disabled
- [ ] No console errors

### Settings.tsx - Cloud Backup
- [ ] Starter: Locked state with 🔒 and explanation
- [ ] Professional: Full backup UI visible and functional
- [ ] Enterprise: Full backup UI visible and functional
- [ ] Storage info only shows for Professional+
- [ ] No console errors

---

## Debug Commands

Use these commands in browser console to test different tiers:

```javascript
// Set Starter tier
localStorage.setItem('floinvite_user_tier', 'starter')
console.log('Tier set to:', localStorage.getItem('floinvite_user_tier'))
window.location.reload()

// Set Professional tier
localStorage.setItem('floinvite_user_tier', 'professional')
console.log('Tier set to:', localStorage.getItem('floinvite_user_tier'))
window.location.reload()

// Set Enterprise tier
localStorage.setItem('floinvite_user_tier', 'enterprise')
console.log('Tier set to:', localStorage.getItem('floinvite_user_tier'))
window.location.reload()

// Check if feature is available
import { hasFeature } from './src/utils/featureGating.ts'
console.log('Expected guests (starter):', hasFeature('starter', 'expected_guests')) // false
console.log('Expected guests (professional):', hasFeature('professional', 'expected_guests')) // true
console.log('SMS notifications (starter):', hasFeature('starter', 'sms_notifications')) // false
console.log('SMS notifications (professional):', hasFeature('professional', 'sms_notifications')) // true
console.log('CSV export (starter):', hasFeature('starter', 'csv_export')) // false
console.log('CSV export (professional):', hasFeature('professional', 'csv_export')) // true
console.log('Cloud backup (starter):', hasFeature('starter', 'cloud_backup')) // false
console.log('Cloud backup (professional):', hasFeature('professional', 'cloud_backup')) // true
```

---

## Build Status

✅ Build passes: `npm run build`
✅ No TypeScript errors
✅ All imports resolved
✅ No console warnings

---

## Next Steps

1. **Implement Tier Selection at Signup** - Allow users to choose Professional tier and skip 20-item limit
2. **Add Pre-Signup Payment Flow** - Stripe checkout before account creation
3. **Backend Validation** - Validate tier on PHP endpoints to prevent frontend bypass
4. **Production Testing** - Test with real payment flows and multiple users

---

## Feature Matrix Reference

```typescript
STARTER ($5/month):
✓ Guest check-in (unlimited)
✓ Host management
✓ Visitor logbook
✓ Email notifications
✓ Search & filtering
✗ Expected guests 🔒
✗ Returning visitors 🔒
✗ SMS/WhatsApp notifications 🔒
✗ CSV/JSON export 🔒
✗ Cloud backup 🔒

PROFESSIONAL ($10/month):
✓ Everything from Starter +
✓ Expected guests
✓ Returning visitors
✓ SMS/WhatsApp notifications
✓ CSV/JSON export
✓ Cloud backup
✓ Email support

ENTERPRISE (Custom):
✓ Everything from Professional +
✓ Dedicated support
✓ Custom integrations
```

---

**Status:** Ready for manual testing
**Last Updated:** December 11, 2024
