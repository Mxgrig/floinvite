import { chromium } from 'playwright';

const pages = [
  { route: '/', name: 'Landing' },
  { route: '/signin', name: 'Sign In' },
  { route: '/createaccount', name: 'Create Account' },
  { route: '/pricing', name: 'Pricing' },
  { route: '/marketing', name: 'Marketing' },
  { route: '/privacy', name: 'Privacy Policy' },
  { route: '/terms', name: 'Terms of Service' },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1280, height: 800 });

  for (const p of pages) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${p.name} (${p.route})`);
    console.log('='.repeat(60));

    try {
      await page.goto(`http://localhost:5173${p.route}`);
      await page.waitForLoadState('networkidle');

      // Get page title
      const title = await page.evaluate(() => document.title);
      console.log(`Title: ${title}`);

      // Get H1 elements
      const h1s = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('h1')).map(el => el.textContent.trim());
      });
      console.log(`H1 elements:`, h1s.length > 0 ? h1s : 'None');

      // Get H2 elements
      const h2s = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('h2')).map(el => el.textContent.trim()).slice(0, 3);
      });
      console.log(`H2 elements (first 3):`, h2s.length > 0 ? h2s : 'None');

      // Get first 300 chars of text content
      const bodyText = await page.evaluate(() => {
        return document.body.innerText.substring(0, 300);
      });
      console.log(`Text preview:\n${bodyText}`);

      // Take screenshot
      const filename = `/tmp/page-${p.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: filename });
      console.log(`Screenshot: ${filename}`);

    } catch (error) {
      console.log(`ERROR: ${error.message}`);
    }
  }

  await browser.close();
  console.log('\n✅ All pages audited!');
})();
