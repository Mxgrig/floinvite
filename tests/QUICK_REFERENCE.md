# Payment Enforcement Test - Quick Reference Card

## One-Time Setup
```bash
npm install
npx playwright install
```

## Run Tests

| Command | Description |
|---------|-------------|
| `npm run test:payment` | Run tests (headless, fast) |
| `npm run test:payment:headed` | Run with visible browser |
| `npm run test:ui` | Interactive UI mode |
| `./run-payment-test.sh --headed` | Quick runner with browser |
| `./run-payment-test.sh --debug` | Step-by-step debugging |

## View Results

| Command | Description |
|---------|-------------|
| `npm run test:report` | Open HTML report in browser |
| `ls -la test-results/*.png` | List screenshots |
| `npx playwright show-trace test-results/trace.zip` | View trace (if failed) |

## What's Tested

1. Blocking prompt appears when 20+ hosts/visitors
2. Header, footer, main content hidden
3. Close button disabled
4. Alert: "You must choose a plan to continue"
5. Both payment buttons visible & clickable
6. Usage bar shows "25 / 20 used (125%)"
7. Full screen coverage (fixed position)
8. Plan features displayed
9. NO prompt when under limit (edge case)

## Test Data Setup

```javascript
// Automatically set by test:
// 15 hosts + 10 visitors = 25 (over 20 limit)
// userTier: 'starter'
// auth_token: true
```

## Expected Results

```
✓ Upgrade prompt visible
✓ Title: "Free Limit Reached"
✓ Message: "free limit of 20"
✓ Header hidden
✓ Footer hidden
✓ Main content hidden
✓ Close button disabled
✓ Starter button ($5/mo) visible & clickable
✓ Professional button ($10/mo) visible & clickable
✓ Usage bar visible
✓ Full screen coverage
```

## Files Created

- `tests/payment-enforcement.spec.ts` - Main test (14 tests)
- `playwright.config.ts` - Configuration
- `run-payment-test.sh` - Quick runner
- `tests/README.md` - Full documentation
- `PAYMENT_TEST_SUMMARY.md` - Quick summary

## Common Issues

| Issue | Solution |
|-------|----------|
| Browsers not installed | `npx playwright install` |
| Tests timeout | Check https://floinvite.com is accessible |
| No screenshots | `mkdir -p test-results` |

## Manual Testing (Browser Console)

```javascript
// Paste in browser console at https://floinvite.com
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
location.reload();
```

## Screenshot Locations

- `test-results/payment-enforcement-blocking-prompt.png`
- `test-results/payment-enforcement-complete.png`

## Get Started Now

```bash
# Recommended first run
npm run test:payment:headed
```

Then view report:
```bash
npm run test:report
```
