import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('API Endpoints Integration Testing', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Authentication Endpoints', () => {
    test('should authenticate user with valid credentials', async () => {
      const response = await page.request.post('/api/auth/signin', {
        data: {
          email: testData.users[0].email,
          password: testData.users[0].password
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.user).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const response = await page.request.post('/api/auth/signin', {
        data: {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should handle user registration', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'securepassword123',
        name: 'New User'
      };

      const response = await page.request.post('/api/auth/register', {
        data: newUser
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.user.email).toBe(newUser.email);
    });

    test('should handle password reset request', async () => {
      const response = await page.request.post('/api/auth/reset-password', {
        data: {
          email: testData.users[0].email
        }
      });

      expect(response.status()).toBe(200);
    });

    test('should handle logout', async () => {
      // First authenticate
      const authResponse = await page.request.post('/api/auth/signin', {
        data: {
          email: testData.users[0].email,
          password: testData.users[0].password
        }
      });
      const authData = await authResponse.json();

      // Then logout
      const response = await page.request.post('/api/auth/logout', {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe('User Management Endpoints', () => {
    let authToken: string;

    test.beforeEach(async () => {
      const authResponse = await page.request.post('/api/auth/signin', {
        data: {
          email: testData.users[0].email,
          password: testData.users[0].password
        }
      });
      const authData = await authResponse.json();
      authToken = authData.token;
    });

    test('should get user profile', async () => {
      const response = await page.request.get('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testData.users[0].email);
    });

    test('should update user profile', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+15551234567'
      };

      const response = await page.request.put('/api/users/profile', {
        data: updateData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.user.name).toBe(updateData.name);
    });

    test('should list all users (admin only)', async () => {
      const response = await page.request.get('/api/users', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.users)).toBe(true);
    });

    test('should create new user (admin only)', async () => {
      const newUser = {
        email: 'admincreated@example.com',
        password: 'securepassword123',
        name: 'Admin Created User',
        role: 'user'
      };

      const response = await page.request.post('/api/users', {
        data: newUser,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.user.email).toBe(newUser.email);
    });

    test('should delete user (admin only)', async () => {
      // First create a user to delete
      const newUser = {
        email: 'todelete@example.com',
        password: 'securepassword123',
        name: 'User To Delete'
      };

      const createResponse = await page.request.post('/api/users', {
        data: newUser,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const createData = await createResponse.json();

      // Then delete the user
      const response = await page.request.delete(`/api/users/${createData.user.id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe('Call Management Endpoints', () => {
    let authToken: string;

    test.beforeEach(async () => {
      const authResponse = await page.request.post('/api/auth/signin', {
        data: {
          email: testData.users[0].email,
          password: testData.users[0].password
        }
      });
      const authData = await authResponse.json();
      authToken = authData.token;
    });

    test('should initiate outbound call', async () => {
      const callData = {
        to: '+15551234567',
        from: '+15559876543',
        context: 'test-call'
      };

      const response = await page.request.post('/api/calls', {
        data: callData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.callSid).toBeDefined();
    });

    test('should get call history', async () => {
      const response = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.calls)).toBe(true);
    });

    test('should get specific call details', async () => {
      // First create a call
      const callData = {
        to: '+15551234567',
        from: '+15559876543',
        context: 'test-call'
      };

      const createResponse = await page.request.post('/api/calls', {
        data: callData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const createData = await createResponse.json();

      // Then get the call details
      const response = await page.request.get(`/api/calls/${createData.callSid}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.call.callSid).toBe(createData.callSid);
    });

    test('should end active call', async () => {
      // First create a call
      const callData = {
        to: '+15551234567',
        from: '+15559876543',
        context: 'test-call'
      };

      const createResponse = await page.request.post('/api/calls', {
        data: callData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const createData = await createResponse.json();

      // Then end the call
      const response = await page.request.post(`/api/calls/${createData.callSid}/end`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe('SMS Management Endpoints', () => {
    let authToken: string;

    test.beforeEach(async () => {
      const authResponse = await page.request.post('/api/auth/signin', {
        data: {
          email: testData.users[0].email,
          password: testData.users[0].password
        }
      });
      const authData = await authResponse.json();
      authToken = authData.token;
    });

    test('should send SMS message', async () => {
      const messageData = {
        to: '+15551234567',
        from: '+15559876543',
        body: 'Test message from API'
      };

      const response = await page.request.post('/api/sms', {
        data: messageData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.messageSid).toBeDefined();
    });

    test('should get SMS history', async () => {
      const response = await page.request.get('/api/sms', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.messages)).toBe(true);
    });

    test('should get specific SMS details', async () => {
      // First send a message
      const messageData = {
        to: '+15551234567',
        from: '+15559876543',
        body: 'Test message for details'
      };

      const sendResponse = await page.request.post('/api/sms', {
        data: messageData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const sendData = await sendResponse.json();

      // Then get the message details
      const response = await page.request.get(`/api/sms/${sendData.messageSid}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.message.messageSid).toBe(sendData.messageSid);
    });
  });

  test.describe('Configuration Endpoints', () => {
    let authToken: string;

    test.beforeEach(async () => {
      const authResponse = await page.request.post('/api/auth/signin', {
        data: {
          email: testData.users[0].email,
          password: testData.users[0].password
        }
      });
      const authData = await authResponse.json();
      authToken = authData.token;
    });

    test('should get system configuration', async () => {
      const response = await page.request.get('/api/config', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.config).toBeDefined();
    });

    test('should update system configuration', async () => {
      const configData = {
        maxConcurrentCalls: 10,
        defaultCallTimeout: 300,
        enableRecording: true
      };

      const response = await page.request.put('/api/config', {
        data: configData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.config.maxConcurrentCalls).toBe(configData.maxConcurrentCalls);
    });

    test('should get Twilio configuration', async () => {
      const response = await page.request.get('/api/config/twilio', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.twilioConfig).toBeDefined();
    });

    test('should update Twilio configuration', async () => {
      const twilioConfig = {
        accountSid: 'AC_test_account_sid',
        authToken: 'test_auth_token',
        phoneNumber: '+15551234567'
      };

      const response = await page.request.put('/api/config/twilio', {
        data: twilioConfig,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.twilioConfig.accountSid).toBe(twilioConfig.accountSid);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async () => {
      const response = await page.request.get('/api/non-existent-endpoint');
      expect(response.status()).toBe(404);
    });

    test('should handle 405 for unsupported methods', async () => {
      const response = await page.request.delete('/api/auth/signin');
      expect(response.status()).toBe(405);
    });

    test('should handle 400 for malformed requests', async () => {
      const response = await page.request.post('/api/auth/signin', {
        data: 'invalid-json'
      });
      expect(response.status()).toBe(400);
    });

    test('should handle 500 for server errors', async () => {
      // Simulate server error
      await qaHelpers.simulateTwilioServiceFailure('api', 'server-error');

      const response = await page.request.get('/api/calls');
      expect(response.status()).toBe(500);
    });
  });

  test.describe('Rate Limiting', () => {
    test('should enforce rate limits on API endpoints', async () => {
      const requests = [];
      
      // Send multiple requests rapidly
      for (let i = 0; i < 20; i++) {
        requests.push(
          page.request.get('/api/calls')
        );
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    test('should include rate limit headers', async () => {
      const response = await page.request.get('/api/calls');
      
      expect(response.headers()['x-ratelimit-limit']).toBeDefined();
      expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers()['x-ratelimit-reset']).toBeDefined();
    });
  });

  test.describe('Data Validation', () => {
    let authToken: string;

    test.beforeEach(async () => {
      const authResponse = await page.request.post('/api/auth/signin', {
        data: {
          email: testData.users[0].email,
          password: testData.users[0].password
        }
      });
      const authData = await authResponse.json();
      authToken = authData.token;
    });

    test('should validate required fields', async () => {
      const response = await page.request.post('/api/calls', {
        data: {
          // Missing required 'to' field
          from: '+15559876543'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.errors).toContain('to is required');
    });

    test('should validate field formats', async () => {
      const response = await page.request.post('/api/calls', {
        data: {
          to: 'invalid-phone-number',
          from: '+15559876543'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.errors).toContain('to must be a valid phone number');
    });

    test('should validate field lengths', async () => {
      const longMessage = 'A'.repeat(2000);
      
      const response = await page.request.post('/api/sms', {
        data: {
          to: '+15551234567',
          from: '+15559876543',
          body: longMessage
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.errors).toContain('body exceeds maximum length');
    });
  });
});
