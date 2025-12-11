# Local Testing Guide - Phase 3A & Phase 2 Integration

**Status:** Ready for local testing
**Dev Server:** http://localhost:5173
**Browser:** Chrome/Firefox recommended

---

## Quick Start

```bash
# Dev server should be running on http://localhost:5173
# Open browser and follow test scenarios below
```

**Before each test:**
- Open DevTools (F12)
- Clear localStorage: `localStorage.clear()`
- Refresh page: `Ctrl+R` or `Cmd+R`
- Check Console for errors

---

## Test Scenario 1: Landing Page → Tier Selection

**Goal:** Verify landing page routes to tier selection

### Steps:
1. ✓ Navigate to http://localhost:5173
2. ✓ See "Floinvite" branding
3. ✓ See two buttons:
   - "Sign In"
   - "Create Account" ← Click this
4. ✓ Should navigate to Tier Selection page
5. ✓ Verify URL shows tier-selection
6. ✓ No console errors

### Expected Result:
- Landing page visible
- "Create Account" button routes to tier selection
- No errors in console

### Actual Result:
_Fill in after testing_

---

## Test Scenario 2: Tier Selection - Starter Path

**Goal:** Test Starter tier selection and account creation

### Steps:
1. ✓ On Tier Selection page
2. ✓ See two pricing cards side-by-side:
   - **Starter** ($5/month)
   - **Professional** ($10/month) - with "RECOMMENDED" badge
3. ✓ Verify Starter features include:
   - ✓ Unlimited guest check-ins
   - ✓ Host management
   - ✓ Visitor logbook & search
   - ✓ Email notifications
   - ✓ Expected guest lookup ← **NEW**
   - ✗ Returning visitor tracking (locked)
   - ✗ SMS & WhatsApp notifications (locked)
   - ✗ CSV/JSON export (locked)
   - ✗ Cloud backup (locked)
4. ✓ See pricing note: "Free for the first 20 items, Then $5/month after 20 items (includes expected guests)"
5. ✓ Click "Continue with Starter"
6. ✓ Should navigate to "Get Started" account form
7. ✓ No payment prompt, no Stripe redirect

### Fill in Account Form:
- Email: `test.starter@example.com`
- Company: `Acme Corp`
- Phone: `(555) 123-4567`
- Password: `TestPassword123!`
- Confirm Password: `TestPassword123!`
- ☑ Accept terms
8. ✓ Click "Create Account"
9. ✓ Account created successfully
10. ✓ Redirected to Settings page

### Verify in localStorage:
Open DevTools Console and run:
```javascript
// Should see account saved as Starter
JSON.parse(localStorage.getItem('floinvite_account'))
// Should show: { email: "test.starter@example.com", company: "Acme Corp", tier: "starter", ... }

// Should see tier set to Starter
localStorage.getItem('floinvite_user_tier')
// Should show: "starter"
```

### Expected Result:
- Account created with tier: "starter"
- No payment required
- Redirected to Settings
- localStorage contains tier information

### Actual Result:
_Fill in after testing_

---

## Test Scenario 3: Starter User - Expected Guests Locked (Before Payment)

**Goal:** Verify expected guests are locked for unpaid Starter users

### Setup:
- You're logged in as Starter user (test.starter@example.com)
- Item count is less than 20

### Steps:
1. ✓ Click "Check-In" in navigation
2. ✓ See "Welcome to Reception" page
3. ✓ See two buttons:
   - "I'm a new visitor" ← Walk-in (enabled)
   - "I'm expected 🔒" ← Expected (locked/disabled)
4. ✓ Click on "I'm expected" button
   - Should NOT navigate anywhere
   - Button appears disabled
   - Opacity reduced
   - Text says "I'm expected 🔒"
   - Red text: "Professional tier only"
5. ✓ See warning box:
   ```
   Expected Guest Lookup - Upgrade to Unlock
   Unlock expected guest lookup with Starter tier ($5/month after 20 items)
   or upgrade to Professional ($10/month) for returning visitor tracking and advanced features.
   ```

### Expected Result:
- Expected guest button is visibly locked
- Clear upgrade messaging
- No ability to click button

### Actual Result:
_Fill in after testing_

---

## Test Scenario 4: Starter User - Feature Gating in Settings

**Goal:** Verify locked features show in Settings

### Steps:
1. ✓ You're on Settings page (logged in as Starter)
2. ✓ Scroll down to "Cloud Backup & Export" section
3. ✓ Section should be locked with:
   - 🔒 Lock icon
   - "Professional Feature Only"
   - Explanation text
   - "Upgrade to Professional" button
4. ✓ Export buttons in logbook should be locked:
   - "CSV 🔒" button disabled
   - "JSON 🔒" button disabled
   - Tooltip: "Upgrade to Professional to export"

### Expected Result:
- Cloud backup section shows lock icon
- Export buttons disabled with lock icons
- Clear upgrade messaging

### Actual Result:
_Fill in after testing_

---

## Test Scenario 5: Professional Tier Selection Path

**Goal:** Test Professional tier selection (no payment upfront)

### Setup:
- Clear localStorage: `localStorage.clear()`
- Refresh page
- Go back to landing page

### Steps:
1. ✓ Navigate to http://localhost:5173
2. ✓ Click "Create Account"
3. ✓ On Tier Selection page
4. ✓ Click "Continue with Professional"
5. ✓ Should navigate to "Get Started" account form
6. ✓ No payment form, no Stripe redirect ← **KEY TEST**
7. ✓ Fill in form:
   - Email: `test.pro@example.com`
   - Company: `Tech Inc`
   - Phone: `(555) 987-6543`
   - Password: `ProPassword123!`
   - Confirm Password: `ProPassword123!`
   - ☑ Accept terms
8. ✓ Click "Create Account"
9. ✓ Redirected to Settings

### Verify in localStorage:
```javascript
JSON.parse(localStorage.getItem('floinvite_account'))
// Should show: tier: "professional"

localStorage.getItem('floinvite_user_tier')
// Should show: "professional"
```

### Expected Result:
- No payment form at signup
- Professional tier set in localStorage
- Full feature access

### Actual Result:
_Fill in after testing_

---

## Test Scenario 6: Professional User - All Features Unlocked

**Goal:** Verify Professional users can access all features

### Setup:
- Logged in as Professional user (test.pro@example.com)

### Steps:

#### Check-In Page:
1. ✓ Click "Check-In"
2. ✓ "I'm expected" button is ENABLED (no lock, no opacity)
3. ✓ Can click and search for expected guests
4. ✓ No warning message

#### Settings Page:
1. ✓ "Cloud Backup & Export" section is VISIBLE and ENABLED
2. ✓ No lock icon
3. ✓ Can interact with backup/export buttons
4. ✓ "Manage Subscription" button visible

#### Host Management:
1. ✓ Click "Hosts"
2. ✓ When adding/editing host:
   - Email notification: ☑ enabled
   - SMS notification: ☑ enabled (NOT grayed out)
   - WhatsApp notification: ☑ enabled (NOT grayed out)
   - Both: ☑ enabled (NOT grayed out)
3. ✓ SMS carrier dropdown available (not disabled)

#### Logbook:
1. ✓ Click "Logbook"
2. ✓ Export buttons are ENABLED:
   - "CSV ✓" button active
   - "JSON ✓" button active
3. ✓ No lock icons
4. ✓ Can interact with export buttons

### Expected Result:
- All professional features fully accessible
- No lock icons or restrictions
- SMS/WhatsApp notification options enabled

### Actual Result:
_Fill in after testing_

---

## Test Scenario 7: 20-Item Limit & Upgrade Prompt (Starter)

**Goal:** Test the 20-item limit and upgrade prompt for Starter tier

### Setup:
- Logged in as Starter user (test.starter@example.com)
- Item count is less than 20

### Steps:
1. ✓ Add hosts via "Import CSV" or "Add Host" manually
2. ✓ Check in guests repeatedly until you reach 20 items
   - You can add multiple guests to same host
   - Each check-in counts as 1 item
3. ✓ After 20th check-in, upgrade prompt should appear:
   ```
   You've Reached Your Limit
   Your free trial of 20 items is up.

   [Continue with Starter (limited)]
   [Upgrade to Professional Now]
   [Maybe Later]
   ```
4. ✓ Click "Maybe Later"
5. ✓ Modal closes, return to app
6. ✓ Can still view logbook with 20+ items
7. ✓ Cannot add new items (or see warning)

### Expected Result:
- Gentle upgrade prompt at 20 items
- User can dismiss and continue
- Feature still works with 20+ items

### Actual Result:
_Fill in after testing_

---

## Test Scenario 8: Feature Gating - Expected Guests Unlock

**Goal:** Verify expected guests become available after payment

### Setup:
- Logged in as Starter user
- Item count >= 20
- Have expected guests imported

### Steps:
1. ✓ Reach upgrade prompt
2. ✓ Click "Upgrade to Professional Now"
3. ✓ Should go to Stripe checkout (or payment form)
4. ✓ After payment simulated:
   - User tier updates to Professional (or Starter Professional)
   - localStorage updates
5. ✓ Return to app
6. ✓ Go to Check-In
7. ✓ "I'm expected" button should now be enabled
8. ✓ Can search and select expected guests

### Expected Result:
- Expected guests unlock after upgrade
- Feature becomes immediately available
- No app restart needed

### Actual Result:
_Fill in after testing_

---

## Test Scenario 9: Mobile Responsiveness

**Goal:** Test tier selection and features on mobile devices

### Setup:
- Open DevTools (F12)
- Click Device Emulation
- Select "iPhone 12" or similar

### Steps:
1. ✓ Navigate to http://localhost:5173
2. ✓ Landing page responsive:
   - Text readable
   - Buttons touch-size (48px+)
   - No horizontal scroll
3. ✓ Click "Create Account"
4. ✓ Tier Selection page responsive:
   - Cards stack vertically on small screens
   - Text readable
   - Buttons clickable
   - "RECOMMENDED" badge visible
5. ✓ Account form responsive:
   - Form fields full width
   - Labels visible
   - Buttons clickable
6. ✓ Settings page responsive:
   - Content reflows
   - Lock icons visible
   - Buttons accessible

### Expected Result:
- All pages render correctly on mobile
- Touch targets at least 48px
- No horizontal scrolling
- Text readable without zoom

### Actual Result:
_Fill in after testing_

---

## Test Scenario 10: Data Persistence

**Goal:** Verify data persists across browser refresh

### Setup:
- Logged in as Starter user
- Have added some hosts/guests

### Steps:
1. ✓ Note current logbook entries
2. ✓ Press F5 (refresh page)
3. ✓ Should stay logged in (no redirect to landing)
4. ✓ Logbook should show same entries
5. ✓ User tier should be "starter" (check localStorage)
6. ✓ Account data should be intact
7. ✓ Close browser completely
8. ✓ Reopen browser
9. ✓ Navigate back to http://localhost:5173
10. ✓ Should still be logged in
11. ✓ All data intact

### Expected Result:
- Data persists across refresh
- Data persists across browser close
- No data loss
- Tier information preserved

### Actual Result:
_Fill in after testing_

---

## Test Scenario 11: Console Errors Check

**Goal:** Verify no errors in browser console

### Steps:
1. ✓ Open DevTools (F12)
2. ✓ Go to Console tab
3. ✓ Clear console
4. ✓ Perform all above test scenarios
5. ✓ Watch for errors as you navigate
6. ✓ No red error messages
7. ✓ No warnings related to features

### Expected Errors:
- None

### Actual Errors:
_Fill in after testing_

---

## Test Scenario 12: Feature Matrix Verification

**Goal:** Verify feature gating matrix matches tiers

### Open DevTools Console and run:
```javascript
// Test feature availability
import { hasFeature } from './src/utils/featureGating';

// Starter features
console.log('Starter - guest_checkin:', hasFeature('starter', 'guest_checkin')); // true
console.log('Starter - expected_guests:', hasFeature('starter', 'expected_guests')); // true ← NEW
console.log('Starter - returning_visitors:', hasFeature('starter', 'returning_visitors')); // false
console.log('Starter - sms_notifications:', hasFeature('starter', 'sms_notifications')); // false
console.log('Starter - csv_export:', hasFeature('starter', 'csv_export')); // false

// Professional features
console.log('Professional - expected_guests:', hasFeature('professional', 'expected_guests')); // true
console.log('Professional - returning_visitors:', hasFeature('professional', 'returning_visitors')); // true
console.log('Professional - sms_notifications:', hasFeature('professional', 'sms_notifications')); // true
console.log('Professional - csv_export:', hasFeature('professional', 'csv_export')); // true
```

### Expected Results:
- Starter has: guest_checkin, host_management, visitor_logbook, email_notifications, expected_guests
- Starter missing: returning_visitors, sms_notifications, csv_export, cloud_backup
- Professional has: everything

### Actual Results:
_Fill in after testing_

---

## Summary Checklist

- [ ] Test 1: Landing → Tier Selection ✓
- [ ] Test 2: Starter tier selection ✓
- [ ] Test 3: Expected guests locked (unpaid Starter) ✓
- [ ] Test 4: Feature gating in Settings ✓
- [ ] Test 5: Professional tier selection ✓
- [ ] Test 6: Professional features unlocked ✓
- [ ] Test 7: 20-item limit & upgrade prompt ✓
- [ ] Test 8: Expected guests unlock after payment ✓
- [ ] Test 9: Mobile responsiveness ✓
- [ ] Test 10: Data persistence ✓
- [ ] Test 11: No console errors ✓
- [ ] Test 12: Feature matrix verification ✓

---

## Issues Found

_Document any issues discovered during testing_

### Issue 1:
- **Description:**
- **Severity:**
- **Steps to Reproduce:**
- **Expected Behavior:**
- **Actual Behavior:**
- **Screenshot:**

---

## Sign-Off

- [ ] All tests passed
- [ ] No critical issues
- [ ] No console errors
- [ ] Ready for production

**Tested By:** _________
**Date:** _________
**Browser/OS:** _________

---

**Next Steps After Testing:**
1. Document any issues found
2. Fix critical bugs
3. Re-test affected scenarios
4. Commit changes to git
5. Push to production
