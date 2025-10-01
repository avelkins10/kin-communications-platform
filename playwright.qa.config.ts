import { defineConfig, devices } from '@playwright/test'

/**
 * QA Testing Configuration for Multi-Browser Testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
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
    ['html', { outputFolder: 'playwright-qa-report' }],
    ['json', { outputFile: 'test-results/qa-results.json' }],
    ['junit', { outputFile: 'test-results/qa-results.xml' }],
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
    actionTimeout: 15000,
    
    /* Global timeout for navigation */
    navigationTimeout: 30000,
    /* Ignore HTTPS errors for local development */
    ignoreHTTPSErrors: true,
    
    /* Set user agent */
    userAgent: 'Mozilla/5.0 (compatible; Playwright QA Tests)',
    
    /* Set viewport */
    viewport: { width: 1280, height: 720 },
    
    /* Set locale */
    locale: 'en-US',
    
    /* Set timezone */
    timezoneId: 'America/New_York'
  },
  
  /* Configure projects for comprehensive browser testing */
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome-specific settings
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
          ]
        }
      },
    },
    
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        // Firefox-specific settings
        launchOptions: {
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true
          }
        }
      },
    },
    
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        // Safari-specific settings
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
    },
    
    // Mobile Browsers
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        // Mobile Chrome settings
        launchOptions: {
          args: [
            '--disable-web-security',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
          ]
        }
      },
    },
    
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Mobile Safari settings
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
    },
    
    // Branded Browsers
    {
      name: 'Microsoft Edge',
      use: { 
        ...devices['Desktop Edge'], 
        channel: 'msedge',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
          ]
        }
      },
    },
    
    {
      name: 'Google Chrome',
      use: { 
        ...devices['Desktop Chrome'], 
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
          ]
        }
      },
    },

    // Tablet Testing
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
        launchOptions: {
          args: ['--disable-web-security']
        }
      },
    },

    // High DPI Testing
    {
      name: 'High DPI Chrome',
      use: { 
        ...devices['Desktop Chrome HiDPI'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--force-device-scale-factor=2',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
          ]
        }
      },
    },

    // Accessibility Testing
    {
      name: 'Accessibility Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-web-security',
            '--force-renderer-accessibility',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
          ]
        }
      },
    }
  ],
  
  /* Run your local dev server before starting the tests */
  webServer: process.env.CI ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      TEST_MODE: 'true',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/kin_communications_e2e',
      NEXTAUTH_SECRET: 'e2e-test-secret-key',
      NEXTAUTH_URL: 'http://localhost:3000',
      TWILIO_ACCOUNT_SID: 'test-account-sid',
      TWILIO_AUTH_TOKEN: 'test-auth-token',
      TWILIO_PHONE_NUMBER: '+15551234567',
      TWILIO_WEBHOOK_URL: 'https://test.ngrok.io',
      QUICKBASE_REALM: 'test-realm',
      QUICKBASE_USER_TOKEN: 'test-user-token',
      QUICKBASE_APP_ID: 'test-app-id',
      SOCKET_IO_CORS_ORIGIN: 'http://localhost:3000'
    }
  },
  
  /* Global setup and teardown */
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  
  /* Test output directory */
  outputDir: 'test-results/qa/',
  
  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  
  /* Maximum time the whole suite can run. */
  globalTimeout: 60 * 60 * 1000,
  
  /* Maximum time expect() should wait for assertions. */
  expect: {
    timeout: 10 * 1000,
  },
  
  
  /* Test match patterns for QA testing */
  testMatch: [
    'tests/e2e/**/*.spec.ts',
    'tests/cross-browser/**/*.spec.ts',
    'tests/security/**/*.spec.ts',
    'tests/performance/**/*.spec.ts',
    'tests/mobile/**/*.spec.ts'
  ],
  
  /* Test ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/.next/**',
    'tests/api/**/*.spec.ts', // API tests run separately
    'tests/lib/**/*.spec.ts'  // Unit tests run separately
  ],
  
  /* Maximum number of test failures before stopping */
  maxFailures: process.env.CI ? 5 : undefined,
  
  /* Preserve output directory */
  preserveOutput: 'always',
  
  /* Update snapshots */
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',
})
