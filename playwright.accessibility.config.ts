import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for accessibility testing
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'accessibility-report' }],
    ['json', { outputFile: 'test-results/accessibility-results.json' }],
    ['junit', { outputFile: 'test-results/accessibility-results.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each action */
    actionTimeout: 10000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
    
    /* Set user agent */
    userAgent: 'Mozilla/5.0 (compatible; Playwright Accessibility Tests)',
    
    /* Set viewport */
    viewport: { width: 1280, height: 720 },
    
    /* Set locale */
    locale: 'en-US',
    
    /* Set timezone */
    timezoneId: 'America/New_York'
  },
  
  /* Configure projects for accessibility testing */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable accessibility testing
        launchOptions: {
          args: ['--enable-accessibility-object-model']
        }
      },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    /* Test against mobile viewports for accessibility. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  
  /* Test output directory */
  outputDir: 'test-results/',
  
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  
  /* Global timeout for each expect assertion */
  expect: {
    timeout: 5 * 1000,
  },
  
  /* Maximum time the whole test suite can run for. */
  globalTimeout: 60 * 60 * 1000,
  
  /* Test match patterns */
  testMatch: [
    '**/*.accessibility.spec.ts',
    '**/*.accessibility.test.ts'
  ],
  
  /* Test ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**'
  ],
  
  /* Maximum number of test failures before stopping */
  maxFailures: process.env.CI ? 10 : undefined,
  
  /* Preserve output directory */
  preserveOutput: 'always',
  
  /* Update snapshots */
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',
})
