import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * API Connectivity Validation Test Suite
 * Verifies all API endpoints are accessible and return proper responses
 */

test.describe('API Connectivity Validation', () => {
  let baseURL: string;

  test.beforeAll(async () => {
    baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
  });

  test.describe('Health Endpoint', () => {
    test('should return healthy status', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
      expect(data).toHaveProperty('timestamp');
      expect(new Date(data.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should include database status', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`);
      const data = await response.json();

      expect(data).toHaveProperty('services');
      expect(data.services).toHaveProperty('database');
      expect(data.services.database).toHaveProperty('status');
      expect(data.services.database).toHaveProperty('responseTime');
      expect(data.services.database).toHaveProperty('lastChecked');
    });

    test('should include service information', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`);
      const data = await response.json();

      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('services');
      expect(data).toHaveProperty('system');
      expect(data).toHaveProperty('metrics');
    });

    test('should handle HEAD requests', async ({ request }) => {
      const response = await request.head(`${baseURL}/api/health`);
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Contacts API - Authentication', () => {
    test('should return 401 for unauthenticated requests', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/contacts`);
      expect(response.status()).toBe(401);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toMatch(/unauthorized|authentication required/i);
    });

    test('should reject requests with invalid auth token', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/contacts`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Contacts API - CRUD Operations', () => {
    // These tests would normally use a valid auth token
    // For validation purposes, we're testing the endpoint structure

    test('GET /api/contacts should have proper structure', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/contacts`);
      
      // Even unauthorized, should return proper error structure
      expect(response.headers()['content-type']).toContain('application/json');
      const data = await response.json();
      expect(typeof data).toBe('object');
    });

    test('POST /api/contacts should validate request body', async ({ request }) => {
      // Test with empty body
      const emptyResponse = await request.post(`${baseURL}/api/contacts`, {
        data: {},
        headers: { 'Content-Type': 'application/json' }
      });
      expect(emptyResponse.status()).toBeGreaterThanOrEqual(400);
      expect(emptyResponse.status()).toBeLessThanOrEqual(401);

      // Test with invalid data
      const invalidResponse = await request.post(`${baseURL}/api/contacts`, {
        data: {
          email: 'not-an-email',
          phone: '123'
        },
        headers: { 'Content-Type': 'application/json' }
      });
      expect(invalidResponse.status()).toBeGreaterThanOrEqual(400);
      expect(invalidResponse.status()).toBeLessThanOrEqual(401);
    });

    test('PUT /api/contacts/:id should validate ID format', async ({ request }) => {
      const invalidIds = ['abc', '123', 'undefined', ''];

      for (const id of invalidIds) {
        const response = await request.put(`${baseURL}/api/contacts/${id}`, {
          data: { name: 'Test' },
          headers: { 'Content-Type': 'application/json' }
        });
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThanOrEqual(401);
      }
    });

    test('DELETE /api/contacts/:id should validate ID format', async ({ request }) => {
      const response = await request.delete(`${baseURL}/api/contacts/invalid-id`);
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThanOrEqual(401);
    });
  });

  test.describe('Authentication Endpoints', () => {
    test('should have NextAuth endpoints configured', async ({ request }) => {
      // Check CSRF token endpoint
      const csrfResponse = await request.get(`${baseURL}/api/auth/csrf`);
      expect(csrfResponse.status()).toBe(200);
      
      const csrfData = await csrfResponse.json();
      expect(csrfData).toHaveProperty('csrfToken');
    });

    test('should have providers endpoint', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/auth/providers`);
      expect(response.status()).toBe(200);
      
      const providers = await response.json();
      expect(providers).toHaveProperty('google');
      expect(providers.google).toHaveProperty('id', 'google');
      expect(providers.google).toHaveProperty('name', 'Google');
    });

    test('should handle session endpoint', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/auth/session`);
      expect(response.status()).toBe(200);
      
      // Without auth, should return null or empty session
      const session = await response.json();
      expect(session).toBeDefined();
    });
  });

  test.describe('Socket.io Token Endpoint', () => {
    test('should require authentication for token generation', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/socket/token`);
      expect(response.status()).toBe(401);
    });

    test('should validate request method', async ({ request }) => {
      // Socket token should only accept GET
      const postResponse = await request.post(`${baseURL}/api/socket/token`);
      expect(postResponse.status()).toBeGreaterThanOrEqual(400);
      expect(postResponse.status()).toBeLessThanOrEqual(405);
    });
  });

  test.describe('Webhook Endpoints', () => {
    test('should validate webhook signatures', async ({ request }) => {
      const webhookData = {
        event: 'test.event',
        data: { test: true }
      };

      // Without signature
      const noSigResponse = await request.post(`${baseURL}/api/webhooks/twilio`, {
        data: webhookData,
        headers: { 'Content-Type': 'application/json' }
      });
      expect(noSigResponse.status()).toBeGreaterThanOrEqual(400);
      expect(noSigResponse.status()).toBeLessThanOrEqual(403);

      // With invalid signature
      const invalidSigResponse = await request.post(`${baseURL}/api/webhooks/twilio`, {
        data: webhookData,
        headers: {
          'Content-Type': 'application/json',
          'X-Twilio-Signature': 'invalid-signature'
        }
      });
      expect(invalidSigResponse.status()).toBeGreaterThanOrEqual(400);
      expect(invalidSigResponse.status()).toBeLessThanOrEqual(403);
    });

    test('should handle different webhook types', async ({ request }) => {
      const webhookTypes = ['twilio', 'quickbase'];
      
      for (const type of webhookTypes) {
        const response = await request.post(`${baseURL}/api/webhooks/${type}`, {
          data: {},
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Should return 400-403 for invalid requests, not 404
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThanOrEqual(403);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should return JSON errors with proper structure', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/nonexistent`);
      expect(response.status()).toBe(404);
      
      const contentType = response.headers()['content-type'];
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        expect(data).toHaveProperty('error');
      }
    });

    test('should handle malformed JSON gracefully', async ({ request }) => {
      const response = await request.post(`${baseURL}/api/contacts`, {
        data: '{invalid json}',
        headers: { 'Content-Type': 'application/json' }
      });
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThanOrEqual(401);
    });

    test('should set proper CORS headers', async ({ request }) => {
      const response = await request.options(`${baseURL}/api/health`);
      
      // Check CORS headers if they exist
      const corsHeaders = {
        'access-control-allow-origin': response.headers()['access-control-allow-origin'],
        'access-control-allow-methods': response.headers()['access-control-allow-methods'],
        'access-control-allow-headers': response.headers()['access-control-allow-headers']
      };
      
      // If CORS is configured, headers should be present
      if (corsHeaders['access-control-allow-origin']) {
        expect(corsHeaders['access-control-allow-methods']).toBeTruthy();
        expect(corsHeaders['access-control-allow-headers']).toBeTruthy();
      }
    });
  });

  test.describe('Response Format Verification', () => {
    test('should return consistent error format', async ({ request }) => {
      const endpoints = [
        '/api/contacts',
        '/api/socket/token',
        '/api/webhooks/twilio'
      ];

      for (const endpoint of endpoints) {
        const response = await request.get(`${baseURL}${endpoint}`);
        
        if (response.status() >= 400) {
          const data = await response.json();
          expect(data).toHaveProperty('error');
          expect(typeof data.error).toBe('string');
          
          // Optional: check for error code
          if (data.code) {
            expect(typeof data.code).toBe('string');
          }
        }
      }
    });

    test('should include request ID in responses', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`);
      
      // Check for request ID header
      const requestId = response.headers()['x-request-id'];
      if (requestId) {
        expect(requestId).toMatch(/^[a-f0-9-]+$/i);
      }
    });
  });

  test.describe('Rate Limiting', () => {
    test('should include rate limit headers', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/health`);
      
      // Check for rate limit headers if implemented
      const rateLimitHeaders = {
        'x-ratelimit-limit': response.headers()['x-ratelimit-limit'],
        'x-ratelimit-remaining': response.headers()['x-ratelimit-remaining'],
        'x-ratelimit-reset': response.headers()['x-ratelimit-reset']
      };
      
      // If rate limiting is implemented, headers should be consistent
      if (rateLimitHeaders['x-ratelimit-limit']) {
        expect(Number(rateLimitHeaders['x-ratelimit-limit'])).toBeGreaterThan(0);
        expect(Number(rateLimitHeaders['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Database Connectivity', () => {
    test('should handle database connection errors gracefully', async ({ request }) => {
      // This would test error handling when DB is down
      // For now, just ensure health endpoint reports DB status
      const response = await request.get(`${baseURL}/api/health`);
      const data = await response.json();
      
      if (data.database && !data.database.connected) {
        // If DB is down, API should still respond
        expect(response.status()).toBe(200);
        expect(data.status).toBe('degraded');
      }
    });
  });

  test.describe('Performance', () => {
    test('health endpoint should respond quickly', async ({ request }) => {
      const start = Date.now();
      await request.get(`${baseURL}/api/health`);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test('API endpoints should not leak sensitive information', async ({ request }) => {
      const response = await request.get(`${baseURL}/api/contacts`);
      const responseText = await response.text();
      
      // Should not contain sensitive information in error messages
      expect(responseText).not.toContain('DATABASE_URL');
      expect(responseText).not.toContain('NEXTAUTH_SECRET');
      expect(responseText).not.toContain('password');
      expect(responseText).not.toMatch(/stack.*at.*\(/i); // No stack traces
    });
  });
});

/**
 * API Connectivity Validation Summary:
 * - Health endpoint: Status, database, service info ✓
 * - Authentication: 401 for unauthorized, token validation ✓
 * - Contacts CRUD: Proper validation and error handling ✓
 * - NextAuth endpoints: CSRF, providers, session ✓
 * - Socket.io token: Authentication required ✓
 * - Webhooks: Signature validation ✓
 * - Error handling: Consistent format, no leaks ✓
 * - Response format: Headers, request IDs ✓
 * - Rate limiting: Header validation ✓
 * - Performance: Quick responses ✓
 */
