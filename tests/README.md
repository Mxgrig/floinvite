# Floinvite Payment Enforcement Tests

## Overview

This directory contains Playwright tests for validating the payment enforcement system in Floinvite. The tests ensure that users who exceed the free tier limit (20 hosts/visitors) are presented with a blocking upgrade prompt.

## Test Files

- **payment-enforcement.spec.ts** - Comprehensive test suite for payment enforcement blocking behavior

## Prerequisites

1. Install Playwright browsers (first time only):
   ```bash
   npx playwright install
   ```

2. Ensure Playwright dependencies are installed:
   ```bash
   npm install
   ```

## Running Tests

### Run all tests
```bash
npm run test
```

### Run payment enforcement tests only
```bash
npm run test:payment
```

### Run tests with visible browser (headed mode)
```bash
npm run test:payment:headed
```

### Run tests with interactive UI
```bash
npm run test:ui
```

### View test report
```bash
npm run test:report
```

## Test Coverage

The payment enforcement test suite validates:

1. **Blocking Prompt Appears** - Upgrade prompt shows when user has 20+ hosts/visitors
2. **UI Elements Hidden** - Header, footer, and main content are hidden when prompt is shown
3. **Close Button Disabled** - Users cannot dismiss the prompt
4. **Alert on Dismiss Attempt** - Alert shows "You must choose a plan to continue using Floinvite"
5. **Payment Options Visible** - Both Starter ($5/mo) and Professional ($10/mo) plans are displayed
6. **Buttons Clickable** - Payment buttons are enabled and functional
7. **Usage Metrics Shown** - Usage bar displays current usage and percentage
8. **Full Screen Coverage** - Prompt covers entire screen (blocking behavior)
9. **Plan Features** - Feature comparison is visible for both plans
10. **Edge Case** - Prompt does NOT appear when under limit (19 items)

## Test Output

Test results are saved to:
- **Screenshots**: `test-results/payment-enforcement-*.png`
- **HTML Report**: `test-results/html-report/`
- **JSON Results**: `test-results/test-results.json`
- **Videos** (on failure): `test-results/`

## Test Scenarios

### Scenario 1: Over Limit (Default)
- 15 hosts + 10 visitors = 25 total (over 20 limit)
- Expected: Blocking upgrade prompt appears

### Scenario 2: Under Limit (Edge Case)
- 10 hosts + 9 visitors = 19 total (under 20 limit)
- Expected: No upgrade prompt appears

## Debugging

### Run with debug mode
```bash
PWDEBUG=1 npm run test:payment:headed
```

### Check console logs
The tests output detailed console logs showing:
- Test step progress
- Validation results (✓ or ✗)
- Summary of passed/failed checks

### View trace
If a test fails, view the trace:
```bash
npx playwright show-trace test-results/trace.zip
```

## CI/CD Integration

To run tests in CI/CD pipeline:

```bash
# Install browsers in CI
npx playwright install --with-deps

# Run tests
npm run test

# Check exit code
echo $?
```

## Troubleshooting

### Tests timing out
- Increase timeout in playwright.config.ts
- Check network connection to https://floinvite.com
- Verify site is accessible

### Upgrade prompt not appearing
- Check localStorage setup in test
- Verify UsageTracker logic in src/utils/usageTracker.ts
- Check App.tsx useEffect that shows upgrade prompt

### Screenshots not saved
- Ensure test-results directory exists and is writable
- Check disk space

## Writing New Tests

To add new test cases:

1. Create a new `.spec.ts` file in the `tests/` directory
2. Import Playwright test utilities:
   ```typescript
   import { test, expect } from '@playwright/test';
   ```
3. Follow the existing test structure
4. Run tests to validate

## Contact

For questions or issues with tests, contact the Floinvite development team.
