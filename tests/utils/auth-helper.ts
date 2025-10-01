import { Page } from '@playwright/test';

/**
 * Authentication helper for Playwright tests
 * Provides utilities for handling authentication in test scenarios
 */

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  department?: string;
}

/**
 * Mock authentication for testing purposes
 * This simulates a logged-in user without going through the full OAuth flow
 */
export async function loginAsTestUser(page: Page, user: TestUser = getDefaultTestUser()): Promise<void> {
  // Set up mock session data in localStorage/sessionStorage
  await page.evaluate((userData) => {
    // Mock NextAuth session
    const mockSession = {
      user: userData,
      accessToken: 'mock-access-token',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };
    
    // Store in sessionStorage (NextAuth typically uses this)
    sessionStorage.setItem('next-auth.session-token', JSON.stringify(mockSession));
    
    // Also set a flag to indicate we're in test mode
    sessionStorage.setItem('test-auth-mode', 'true');
  }, user);
  
  // Navigate to dashboard to trigger auth check
  await page.goto('/dashboard');
  
  // Wait for the page to load and verify we're authenticated
  await page.waitForLoadState('networkidle');
}

/**
 * Logout the test user
 */
export async function logoutTestUser(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clear session data
    sessionStorage.removeItem('next-auth.session-token');
    sessionStorage.removeItem('test-auth-mode');
    localStorage.removeItem('next-auth.session-token');
  });
  
  // Navigate to login page
  await page.goto('/login');
}

/**
 * Get default test user data
 */
export function getDefaultTestUser(): TestUser {
  return {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    department: 'engineering',
  };
}

/**
 * Create a test user with specific properties
 */
export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  return {
    ...getDefaultTestUser(),
    ...overrides,
  };
}

/**
 * Check if user is authenticated in the current page
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    const sessionToken = sessionStorage.getItem('next-auth.session-token');
    return !!sessionToken;
  });
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuthentication(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForFunction(() => {
    const sessionToken = sessionStorage.getItem('next-auth.session-token');
    return !!sessionToken;
  }, { timeout });
}

/**
 * Mock API responses for authenticated endpoints
 * This can be used to mock API calls that require authentication
 */
export async function mockAuthenticatedAPI(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    
    // Mock responses for common authenticated endpoints
    if (url.pathname === '/api/contacts') {
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            contacts: [
              { id: '1', name: 'Test Contact 1', email: 'contact1@example.com' },
              { id: '2', name: 'Test Contact 2', email: 'contact2@example.com' },
            ],
          }),
        });
        return;
      }
    }
    
    if (url.pathname === '/api/socket/token') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-socket-token',
        }),
      });
      return;
    }
    
    // For other API calls, continue with the original request
    await route.continue();
  });
}

/**
 * Setup test environment with authentication
 * This is a convenience function that sets up both auth and API mocking
 */
export async function setupAuthenticatedTest(page: Page, user?: TestUser): Promise<void> {
  await mockAuthenticatedAPI(page);
  await loginAsTestUser(page, user);
}

/**
 * Cleanup test environment
 */
export async function cleanupTest(page: Page): Promise<void> {
  await logoutTestUser(page);
  await page.unroute('**/api/**');
}
















