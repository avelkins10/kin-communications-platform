import { chromium } from 'playwright';

async function main() {
  const targetPath = process.argv[2] ?? '/dashboard/queue';
  const baseUrl = 'http://localhost:4100';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[console] ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    errors.push(`[pageerror] ${error.message}`);
  });

  try {
    // Login first
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.fill('input#email', 'test@example.com');
    await page.fill('input#password', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.goto(`${baseUrl}${targetPath}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
  } catch (error) {
    errors.push(`[script] ${(error as Error).message}`);
  } finally {
    await browser.close();
  }

  if (errors.length === 0) {
    console.log(`No console errors for ${targetPath}.`);
  } else {
    console.log(`Console errors for ${targetPath}:`);
    for (const err of errors) {
      console.log(err);
    }
  }
}

main();
