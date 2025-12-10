import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set viewport to see the full page
  await page.setViewportSize({ width: 1280, height: 800 });

  // Navigate to localhost
  await page.goto('http://localhost:5173/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot
  await page.screenshot({ path: '/tmp/landing-page.png', fullPage: true });

  // Get the text content of the page
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Page text content:');
  console.log(bodyText);

  // Check for specific elements
  const title = await page.evaluate(() => document.title);
  console.log('\nPage title:', title);

  // Check for Sign In button
  const hasSignIn = await page.evaluate(() => {
    return document.body.innerText.includes('Sign In');
  });
  console.log('Has Sign In button:', hasSignIn);

  // Check for Create Account button
  const hasCreateAccount = await page.evaluate(() => {
    return document.body.innerText.includes('Create Account');
  });
  console.log('Has Create Account button:', hasCreateAccount);

  // Check for Learn More button
  const hasLearnMore = await page.evaluate(() => {
    return document.body.innerText.includes('Learn how this works');
  });
  console.log('Has Learn More button:', hasLearnMore);

  // Check for "Everything You Need" text
  const hasEverythingYouNeed = await page.evaluate(() => {
    return document.body.innerText.includes('Everything You Need');
  });
  console.log('Has "Everything You Need" text:', hasEverythingYouNeed);

  console.log('\nScreenshot saved to: /tmp/landing-page.png');

  await browser.close();
})();
