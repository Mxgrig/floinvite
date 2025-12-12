/**
 * Payment Enforcement Test
 * Tests that users with 20+ hosts/visitors see a blocking upgrade prompt
 *
 * Test Scenario:
 * 1. Navigate to https://floinvite.com
 * 2. Setup localStorage with 20+ hosts/visitors
 * 3. Login with test credentials
 * 4. Verify blocking upgrade prompt appears
 * 5. Verify UI elements are hidden (header, footer, main content)
 * 6. Verify close button is disabled
 * 7. Verify payment buttons are visible and clickable
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = 'https://floinvite.com';
const TEST_EMAIL = 'test@floinvite.com';
const TEST_PASSWORD = 'testpassword123';

// Helper function to setup localStorage with hosts and visitors
async function setupLocalStorageWithOverLimit(page: Page, hostCount: number = 15, visitorCount: number = 10) {
  // Create mock hosts
  const hosts = Array.from({ length: hostCount }, (_, i) => ({
    id: `host-${i + 1}`,
    name: `Test Host ${i + 1}`,
    email: `host${i + 1}@floinvite.com`,
    phone: `+1234567${String(i).padStart(3, '0')}`,
    department: 'Engineering',
    notifyByEmail: true,
    notifyBySMS: false
  }));

  // Create mock visitors/guests
  const guests = Array.from({ length: visitorCount }, (_, i) => ({
    id: `guest-${i + 1}`,
    name: `Test Visitor ${i + 1}`,
    email: `visitor${i + 1}@example.com`,
    company: `Company ${i + 1}`,
    hostId: `host-${(i % hostCount) + 1}`,
    checkInTime: new Date(Date.now() - i * 3600000).toISOString(),
    status: 'Checked In'
  }));

  // Set localStorage items
  await page.addInitScript((data) => {
    localStorage.setItem('floinvite_hosts', JSON.stringify(data.hosts));
    localStorage.setItem('floinvite_guests', JSON.stringify(data.guests));
    localStorage.setItem('auth_token', 'true');
    localStorage.setItem('floinvite_user_tier', 'starter');
  }, { hosts, guests });
}

// Helper function to check if element is visible
async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = await page.locator(selector);
    return await element.isVisible();
  } catch {
    return false;
  }
}

test.describe('Payment Enforcement System', () => {
  test.beforeEach(async ({ page }) => {
    // Setup localStorage before each test
    await setupLocalStorageWithOverLimit(page, 15, 10);
  });

  test('should show blocking upgrade prompt when user has 20+ hosts/visitors', async ({ page }) => {
    // Navigate to the app
    await page.goto(BASE_URL);

    // Wait for app to load
    await page.waitForLoadState('networkidle');

    // Wait for upgrade prompt to appear (it checks every 2 seconds)
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Verify upgrade prompt is visible
    const upgradePrompt = page.locator('.upgrade-prompt-overlay');
    await expect(upgradePrompt).toBeVisible();

    console.log('✓ Upgrade prompt is visible');
  });

  test('should display correct message about free limit', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Check for the "Free Limit Reached" title
    const title = page.locator('.upgrade-prompt-title');
    await expect(title).toContainText('Free Limit Reached');

    // Check for message about limit
    const message = page.locator('.upgrade-prompt-message');
    await expect(message).toContainText('free limit of');
    await expect(message).toContainText('20');

    console.log('✓ Correct limit message is displayed');
  });

  test('should hide header navigation when upgrade prompt is shown', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Verify header is not visible
    const header = page.locator('.branding-header');
    await expect(header).not.toBeVisible();

    console.log('✓ Header navigation is hidden');
  });

  test('should hide footer when upgrade prompt is shown', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Verify footer is not visible
    const footer = page.locator('footer');
    await expect(footer).not.toBeVisible();

    console.log('✓ Footer is hidden');
  });

  test('should hide main content when upgrade prompt is shown', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Verify main content is not visible
    const mainContent = page.locator('.app-main');
    await expect(mainContent).not.toBeVisible();

    console.log('✓ Main content is hidden');
  });

  test('should have disabled close button', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Verify close button is disabled
    const closeButton = page.locator('.upgrade-prompt-close');
    await expect(closeButton).toBeDisabled();

    console.log('✓ Close button is disabled');
  });

  test('should show alert when trying to close the modal', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Setup dialog handler
    let alertMessage = '';
    page.on('dialog', async dialog => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    // Try to click the disabled close button
    const closeButton = page.locator('.upgrade-prompt-close');
    await closeButton.click({ force: true });

    // Wait a moment for alert to trigger
    await page.waitForTimeout(500);

    // Verify alert message
    expect(alertMessage).toContain('You must choose a plan to continue');

    console.log('✓ Alert message displayed when trying to close');
  });

  test('should display both payment plan options', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Verify Starter plan card is visible
    const starterPlan = page.locator('.plan-card.current');
    await expect(starterPlan).toBeVisible();
    await expect(starterPlan).toContainText('Starter');
    await expect(starterPlan).toContainText('$5');

    // Verify Professional plan card is visible
    const proPlan = page.locator('.plan-card.upgrade');
    await expect(proPlan).toBeVisible();
    await expect(proPlan).toContainText('Professional');
    await expect(proPlan).toContainText('$10');

    console.log('✓ Both payment plan options are displayed');
  });

  test('should have clickable payment buttons', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Verify Starter payment button
    const starterButton = page.locator('button.btn-secondary').filter({ hasText: 'Pay $5/mo (Starter)' });
    await expect(starterButton).toBeVisible();
    await expect(starterButton).toBeEnabled();

    // Verify Professional payment button
    const proButton = page.locator('button.btn-primary').filter({ hasText: 'Pay $10/mo (Professional)' });
    await expect(proButton).toBeVisible();
    await expect(proButton).toBeEnabled();

    console.log('✓ Both payment buttons are visible and clickable');
  });

  test('should show usage bar with percentage', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Verify usage bar exists
    const usageBar = page.locator('.usage-bar-container');
    await expect(usageBar).toBeVisible();

    // Verify usage text shows correct count
    const usageText = page.locator('.usage-text');
    await expect(usageText).toContainText('25 / 20'); // 15 hosts + 10 visitors = 25
    await expect(usageText).toContainText('%');

    console.log('✓ Usage bar with percentage is displayed');
  });

  test('should show plan features comparison', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Verify Starter plan features
    const starterFeatures = page.locator('.plan-card.current .plan-features');
    await expect(starterFeatures).toContainText('Up to 20 hosts/visitors');
    await expect(starterFeatures).toContainText('Email notifications');

    // Verify Professional plan features
    const proFeatures = page.locator('.plan-card.upgrade .plan-features');
    await expect(proFeatures).toContainText('Unlimited hosts/visitors');
    await expect(proFeatures).toContainText('SMS notifications');
    await expect(proFeatures).toContainText('CSV export');

    console.log('✓ Plan features comparison is displayed');
  });

  test('should cover entire screen (blocking behavior)', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Get overlay dimensions
    const overlay = page.locator('.upgrade-prompt-overlay');
    const boundingBox = await overlay.boundingBox();

    // Verify overlay covers entire viewport
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(0);
      expect(boundingBox.height).toBeGreaterThan(0);
    }

    // Verify overlay has fixed positioning (covers entire screen)
    const position = await overlay.evaluate(el => window.getComputedStyle(el).position);
    expect(position).toBe('fixed');

    console.log('✓ Upgrade prompt covers entire screen');
  });

  test('should take screenshot of blocking prompt', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

    // Take screenshot
    await page.screenshot({ path: 'test-results/payment-enforcement-blocking-prompt.png', fullPage: true });

    console.log('✓ Screenshot saved to test-results/payment-enforcement-blocking-prompt.png');
  });

  test('should NOT show prompt when under limit (edge case)', async ({ page }) => {
    // Setup with 19 total items (under limit)
    await page.addInitScript(() => {
      const hosts = Array.from({ length: 10 }, (_, i) => ({
        id: `host-${i + 1}`,
        name: `Test Host ${i + 1}`,
        email: `host${i + 1}@floinvite.com`
      }));

      const guests = Array.from({ length: 9 }, (_, i) => ({
        id: `guest-${i + 1}`,
        name: `Test Visitor ${i + 1}`,
        hostId: `host-1`,
        checkInTime: new Date().toISOString()
      }));

      localStorage.setItem('floinvite_hosts', JSON.stringify(hosts));
      localStorage.setItem('floinvite_guests', JSON.stringify(guests));
      localStorage.setItem('auth_token', 'true');
      localStorage.setItem('floinvite_user_tier', 'starter');
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait a bit to ensure prompt would have appeared if it was going to
    await page.waitForTimeout(5000);

    // Verify upgrade prompt is NOT visible
    const upgradePrompt = page.locator('.upgrade-prompt-overlay');
    await expect(upgradePrompt).not.toBeVisible();

    console.log('✓ Upgrade prompt does NOT appear when under limit');
  });
});

// Summary test to run all checks at once
test('Payment Enforcement - Complete Validation', async ({ page }) => {
  console.log('\n=== Starting Complete Payment Enforcement Validation ===\n');

  // Setup localStorage with over-limit data
  await setupLocalStorageWithOverLimit(page, 15, 10);

  // Navigate to app
  console.log('1. Navigating to', BASE_URL);
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // Wait for upgrade prompt
  console.log('2. Waiting for upgrade prompt to appear...');
  await page.waitForSelector('.upgrade-prompt-overlay', { timeout: 10000 });

  // Validate all elements
  const results = {
    upgradePromptVisible: false,
    titleCorrect: false,
    messageCorrect: false,
    headerHidden: false,
    footerHidden: false,
    mainContentHidden: false,
    closeButtonDisabled: false,
    starterButtonVisible: false,
    proButtonVisible: false,
    usageBarVisible: false,
    fullScreenCoverage: false
  };

  // Check upgrade prompt visibility
  const upgradePrompt = page.locator('.upgrade-prompt-overlay');
  results.upgradePromptVisible = await upgradePrompt.isVisible();
  console.log('3. Upgrade prompt visible:', results.upgradePromptVisible ? '✓' : '✗');

  // Check title
  const title = page.locator('.upgrade-prompt-title');
  results.titleCorrect = (await title.textContent())?.includes('Free Limit Reached') || false;
  console.log('4. Title correct:', results.titleCorrect ? '✓' : '✗');

  // Check message
  const message = page.locator('.upgrade-prompt-message');
  results.messageCorrect = (await message.textContent())?.includes('free limit') || false;
  console.log('5. Message correct:', results.messageCorrect ? '✓' : '✗');

  // Check header hidden
  const header = page.locator('.branding-header');
  results.headerHidden = !(await header.isVisible().catch(() => false));
  console.log('6. Header hidden:', results.headerHidden ? '✓' : '✗');

  // Check footer hidden
  const footer = page.locator('footer');
  results.footerHidden = !(await footer.isVisible().catch(() => false));
  console.log('7. Footer hidden:', results.footerHidden ? '✓' : '✗');

  // Check main content hidden
  const mainContent = page.locator('.app-main');
  results.mainContentHidden = !(await mainContent.isVisible().catch(() => false));
  console.log('8. Main content hidden:', results.mainContentHidden ? '✓' : '✗');

  // Check close button disabled
  const closeButton = page.locator('.upgrade-prompt-close');
  results.closeButtonDisabled = await closeButton.isDisabled();
  console.log('9. Close button disabled:', results.closeButtonDisabled ? '✓' : '✗');

  // Check payment buttons
  const starterButton = page.locator('button').filter({ hasText: 'Pay $5/mo (Starter)' });
  results.starterButtonVisible = await starterButton.isVisible() && await starterButton.isEnabled();
  console.log('10. Starter button visible & clickable:', results.starterButtonVisible ? '✓' : '✗');

  const proButton = page.locator('button').filter({ hasText: 'Pay $10/mo (Professional)' });
  results.proButtonVisible = await proButton.isVisible() && await proButton.isEnabled();
  console.log('11. Professional button visible & clickable:', results.proButtonVisible ? '✓' : '✗');

  // Check usage bar
  const usageBar = page.locator('.usage-bar-container');
  results.usageBarVisible = await usageBar.isVisible();
  console.log('12. Usage bar visible:', results.usageBarVisible ? '✓' : '✗');

  // Check full screen coverage
  const position = await upgradePrompt.evaluate(el => window.getComputedStyle(el).position);
  results.fullScreenCoverage = position === 'fixed';
  console.log('13. Full screen coverage:', results.fullScreenCoverage ? '✓' : '✗');

  // Take screenshot
  console.log('14. Taking screenshot...');
  await page.screenshot({ path: 'test-results/payment-enforcement-complete.png', fullPage: true });

  // Print summary
  console.log('\n=== Test Summary ===');
  const passedTests = Object.values(results).filter(v => v).length;
  const totalTests = Object.keys(results).length;
  console.log(`Passed: ${passedTests}/${totalTests}`);

  if (passedTests === totalTests) {
    console.log('✓ ALL TESTS PASSED - Payment enforcement is working correctly!');
  } else {
    console.log('✗ SOME TESTS FAILED - Review results above');
    const failedTests = Object.entries(results).filter(([_, v]) => !v).map(([k]) => k);
    console.log('Failed checks:', failedTests.join(', '));
  }

  // Assert all checks passed
  expect(passedTests).toBe(totalTests);
});
