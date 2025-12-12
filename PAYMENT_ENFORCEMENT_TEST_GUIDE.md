# Payment Enforcement Test Guide

## Overview

This guide provides comprehensive instructions for testing the Floinvite payment enforcement system using Playwright automated tests.

## What is Being Tested?

The payment enforcement system ensures that users who exceed the free tier limit (20 hosts/visitors total) are presented with a **blocking upgrade prompt** that:

1. Covers the entire screen
2. Hides all UI elements (header, footer, main content)
3. Cannot be dismissed
4. Requires user to select a payment plan to continue

## Quick Start

### 1. Install Dependencies

```bash
# Install npm packages
npm install

# Install Playwright browsers (first time only)
npx playwright install
```

### 2. Run Tests

```bash
# Run all payment enforcement tests
npm run test:payment

# Run with visible browser
npm run test:payment:headed

# Run with interactive UI
npm run test:ui

# Quick runner script
./run-payment-test.sh --headed
```

### 3. View Results

```bash
# Open HTML report
npm run test:report

# View screenshots
ls -la test-results/*.png
```

## Test Scenarios

### Scenario 1: Blocking Prompt Appears (Default Test)

**Setup:**
- 15 hosts in localStorage
- 10 visitors in localStorage
- Total: 25 items (exceeds 20 limit)
- User tier: 'starter'

**Expected Behavior:**
1. Upgrade prompt appears after page load
2. Prompt title: "Free Limit Reached"
3. Message mentions "free limit of 20 hosts/visitors"
4. Usage bar shows "25 / 20 used (125%)"

### Scenario 2: UI Elements Hidden

**Expected Behavior:**
1. Header navigation is not visible
2. Footer is not visible
3. Main content area is not visible
4. Only upgrade prompt is displayed

### Scenario 3: Close Button Disabled

**Expected Behavior:**
1. Close button (X) is present but disabled
2. Clicking close button shows alert
3. Alert message: "You must choose a plan to continue using Floinvite"
4. Prompt remains visible after alert

### Scenario 4: Payment Options Displayed

**Expected Behavior:**
1. Starter plan card shows:
   - Title: "Starter (Current)"
   - Price: "$5/month"
   - Features: Up to 20 hosts/visitors, Email notifications, etc.
   - Button: "Pay $5/mo (Starter)"

2. Professional plan card shows:
   - Title: "Professional"
   - Price: "$10/month"
   - Features: Unlimited hosts/visitors, SMS notifications, etc.
   - Button: "Pay $10/mo (Professional)"

### Scenario 5: Buttons Are Clickable

**Expected Behavior:**
1. Both payment buttons are visible
2. Both buttons are enabled (not disabled)
3. Buttons can be clicked
4. Clicking triggers payment flow (Stripe redirect)

### Scenario 6: Under Limit (Edge Case)

**Setup:**
- 10 hosts in localStorage
- 9 visitors in localStorage
- Total: 19 items (under 20 limit)

**Expected Behavior:**
1. Upgrade prompt does NOT appear
2. Normal app interface is visible
3. User can navigate freely

## Test File Structure

```
/home/grig/Projects/floinvite/
├── tests/
│   ├── payment-enforcement.spec.ts    # Main test file
│   └── README.md                       # Test documentation
├── playwright.config.ts                # Playwright configuration
├── run-payment-test.sh                 # Quick test runner
└── package.json                        # NPM scripts
```

## Available NPM Scripts

```json
{
  "test": "playwright test",                    // Run all tests
  "test:ui": "playwright test --ui",            // Interactive UI mode
  "test:payment": "playwright test payment-enforcement.spec.ts",
  "test:payment:headed": "playwright test payment-enforcement.spec.ts --headed",
  "test:report": "playwright show-report test-results/html-report"
}
```

## Test Output Files

After running tests, the following files are created:

```
test-results/
├── payment-enforcement-blocking-prompt.png    # Screenshot of blocking prompt
├── payment-enforcement-complete.png           # Screenshot of complete validation
├── html-report/                               # HTML test report
│   └── index.html
├── test-results.json                          # JSON test results
└── videos/                                    # Videos (on failure only)
```

## Debugging Tests

### Method 1: Debug Mode

```bash
# Run with debug flag
./run-payment-test.sh --debug

# Or with npm
PWDEBUG=1 npm run test:payment:headed
```

This will:
- Open browser in headed mode
- Pause before each action
- Show Playwright Inspector
- Allow step-by-step debugging

### Method 2: View Trace

If a test fails:

```bash
# Generate trace
npm run test:payment

# View trace
npx playwright show-trace test-results/trace.zip
```

### Method 3: Console Logs

All tests output detailed console logs:

```
=== Starting Complete Payment Enforcement Validation ===

1. Navigating to https://floinvite.com
2. Waiting for upgrade prompt to appear...
3. Upgrade prompt visible: ✓
4. Title correct: ✓
5. Message correct: ✓
6. Header hidden: ✓
7. Footer hidden: ✓
8. Main content hidden: ✓
9. Close button disabled: ✓
10. Starter button visible & clickable: ✓
11. Professional button visible & clickable: ✓
12. Usage bar visible: ✓
13. Full screen coverage: ✓
14. Taking screenshot...

=== Test Summary ===
Passed: 12/12
✓ ALL TESTS PASSED - Payment enforcement is working correctly!
```

## Customizing Tests

### Change Host/Visitor Count

Edit the test file to modify counts:

```typescript
// In payment-enforcement.spec.ts
await setupLocalStorageWithOverLimit(page, 15, 10);  // 15 hosts, 10 visitors
```

### Test Different Browsers

```bash
# Chrome
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari
npx playwright test --project=webkit

# Mobile
npx playwright test --project="Mobile Chrome"
```

### Add New Test Cases

```typescript
test('should show custom behavior', async ({ page }) => {
  // Setup
  await setupLocalStorageWithOverLimit(page, 25, 5);

  // Navigate
  await page.goto('https://floinvite.com');

  // Assert
  const prompt = page.locator('.upgrade-prompt-overlay');
  await expect(prompt).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Payment Enforcement Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run payment enforcement tests
        run: npm run test:payment

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/
```

## Manual Testing Checklist

If you want to manually verify the payment enforcement:

1. Open https://floinvite.com in browser
2. Open DevTools (F12)
3. Go to Console tab
4. Run this code:

```javascript
// Setup localStorage with over-limit data
const hosts = Array.from({ length: 15 }, (_, i) => ({
  id: `host-${i + 1}`,
  name: `Test Host ${i + 1}`,
  email: `host${i + 1}@floinvite.com`
}));

const guests = Array.from({ length: 10 }, (_, i) => ({
  id: `guest-${i + 1}`,
  name: `Test Visitor ${i + 1}`,
  hostId: `host-1`,
  checkInTime: new Date().toISOString()
}));

localStorage.setItem('floinvite_hosts', JSON.stringify(hosts));
localStorage.setItem('floinvite_guests', JSON.stringify(guests));
localStorage.setItem('auth_token', 'true');
localStorage.setItem('floinvite_user_tier', 'starter');

// Reload page
location.reload();
```

5. Verify:
   - Upgrade prompt appears
   - Header/footer/main content are hidden
   - Close button is disabled
   - Both payment buttons are visible
   - Alert appears when trying to close

## Troubleshooting

### Test Timeout

**Problem:** Tests timeout waiting for upgrade prompt

**Solution:**
- Check if site is accessible: `curl https://floinvite.com`
- Verify UsageTracker logic in `src/utils/usageTracker.ts`
- Check App.tsx useEffect interval (currently 2 seconds)
- Increase timeout in playwright.config.ts

### Prompt Not Appearing

**Problem:** Upgrade prompt doesn't show in test

**Solution:**
- Verify localStorage setup in test
- Check browser console for errors
- Ensure userTier is 'starter' in localStorage
- Verify total hosts + visitors > 20

### Screenshots Not Saved

**Problem:** Screenshot files not created

**Solution:**
- Check test-results directory exists and is writable
- Verify disk space
- Check file permissions
- Ensure test is reaching screenshot step

### Browser Not Found

**Problem:** "Browser not found" error

**Solution:**
```bash
# Reinstall Playwright browsers
npx playwright install

# Or install specific browser
npx playwright install chromium
```

## Expected Test Results

When all tests pass, you should see:

```
Running 14 tests using 1 worker

  ✓ [chromium] › payment-enforcement.spec.ts:48:3 › Payment Enforcement System › should show blocking upgrade prompt
  ✓ [chromium] › payment-enforcement.spec.ts:62:3 › Payment Enforcement System › should display correct message
  ✓ [chromium] › payment-enforcement.spec.ts:76:3 › Payment Enforcement System › should hide header navigation
  ✓ [chromium] › payment-enforcement.spec.ts:88:3 › Payment Enforcement System › should hide footer
  ✓ [chromium] › payment-enforcement.spec.ts:100:3 › Payment Enforcement System › should hide main content
  ✓ [chromium] › payment-enforcement.spec.ts:112:3 › Payment Enforcement System › should have disabled close button
  ✓ [chromium] › payment-enforcement.spec.ts:124:3 › Payment Enforcement System › should show alert when trying to close
  ✓ [chromium] › payment-enforcement.spec.ts:145:3 › Payment Enforcement System › should display both payment plans
  ✓ [chromium] › payment-enforcement.spec.ts:165:3 › Payment Enforcement System › should have clickable payment buttons
  ✓ [chromium] › payment-enforcement.spec.ts:181:3 › Payment Enforcement System › should show usage bar
  ✓ [chromium] › payment-enforcement.spec.ts:197:3 › Payment Enforcement System › should show plan features
  ✓ [chromium] › payment-enforcement.spec.ts:213:3 › Payment Enforcement System › should cover entire screen
  ✓ [chromium] › payment-enforcement.spec.ts:233:3 › Payment Enforcement System › should take screenshot
  ✓ [chromium] › payment-enforcement.spec.ts:244:3 › Payment Enforcement System › should NOT show prompt under limit

  14 passed (45s)
```

## Contact & Support

For issues or questions:
- Check test output and logs
- Review test-results/html-report/
- Examine screenshots in test-results/
- Contact Floinvite development team

## Next Steps

After confirming payment enforcement works:

1. Test Stripe integration (payment flow)
2. Verify subscription status updates
3. Test tier upgrades (starter -> professional)
4. Validate feature unlocking after payment
5. Test subscription cancellation flow
