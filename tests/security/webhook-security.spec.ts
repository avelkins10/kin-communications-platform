import { test, expect, Page } from '@playwright/test';
import { qaHelpers, computeTwilioSignature } from '../utils/qa-helpers';

test.describe('Webhook Security Testing', () => {
  let page: Page;
  let testData: any;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
  });

  test.describe('Twilio Signature Verification', () => {
    test('should validate voice webhook signatures', async () => {
      const validPayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing',
        Direction: 'inbound'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(validPayload, '/api/webhooks/twilio/voice');

      // Test with valid signature
      const validResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(validResponse.status()).toBe(200);

      // Test with invalid signature
      const invalidResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': 'invalid-signature-hash',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(invalidResponse.status()).toBe(401);
    });

    test('should validate SMS webhook signatures', async () => {
      const validPayload = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        Body: 'Test message',
        MessageStatus: 'received'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(validPayload, '/api/webhooks/twilio/sms');

      // Test with valid signature
      const validResponse = await page.request.post('/api/webhooks/twilio/sms', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(validResponse.status()).toBe(200);

      // Test with invalid signature
      const invalidResponse = await page.request.post('/api/webhooks/twilio/sms', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': 'invalid-signature-hash',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(invalidResponse.status()).toBe(401);
    });

    test('should validate status webhook signatures', async () => {
      const validPayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        CallStatus: 'completed',
        CallDuration: '120'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(validPayload, '/api/webhooks/twilio/status');

      // Test with valid signature
      const validResponse = await page.request.post('/api/webhooks/twilio/status', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(validResponse.status()).toBe(200);

      // Test with invalid signature
      const invalidResponse = await page.request.post('/api/webhooks/twilio/status', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': 'invalid-signature-hash',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(invalidResponse.status()).toBe(401);
    });

    test('should validate recording webhook signatures', async () => {
      const validPayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        RecordingSid: 'RE1234567890abcdef1234567890abcdef',
        RecordingUrl: 'https://api.twilio.com/2010-04-01/Accounts/AC.../Recordings/RE...',
        RecordingStatus: 'completed'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(validPayload, '/api/webhooks/twilio/recording');

      // Test with valid signature
      const validResponse = await page.request.post('/api/webhooks/twilio/recording', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(validResponse.status()).toBe(200);

      // Test with invalid signature
      const invalidResponse = await page.request.post('/api/webhooks/twilio/recording', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': 'invalid-signature-hash',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(invalidResponse.status()).toBe(401);
    });

    test('should validate transcription webhook signatures', async () => {
      const validPayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        TranscriptionSid: 'TR1234567890abcdef1234567890abcdef',
        TranscriptionText: 'Hello, this is a test transcription',
        TranscriptionStatus: 'completed'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(validPayload, '/api/webhooks/twilio/transcription');

      // Test with valid signature
      const validResponse = await page.request.post('/api/webhooks/twilio/transcription', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(validResponse.status()).toBe(200);

      // Test with invalid signature
      const invalidResponse = await page.request.post('/api/webhooks/twilio/transcription', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': 'invalid-signature-hash',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(invalidResponse.status()).toBe(401);
    });
  });

  test.describe('Request Validation', () => {
    test('should validate required webhook parameters', async () => {
      // Test voice webhook with missing required parameters
      const incompletePayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef'
        // Missing From, To, CallStatus
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(incompletePayload, '/api/webhooks/twilio/voice');

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should validate webhook parameter formats', async () => {
      // Test with invalid phone number format
      const invalidPayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: 'invalid-phone',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(invalidPayload, '/api/webhooks/twilio/voice');

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should validate webhook parameter lengths', async () => {
      // Test with excessively long message body
      const longMessage = 'A'.repeat(2000); // Exceeds typical SMS length
      const invalidPayload = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        Body: longMessage,
        MessageStatus: 'received'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(invalidPayload, '/api/webhooks/twilio/sms');

      const response = await page.request.post('/api/webhooks/twilio/sms', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should sanitize webhook input data', async () => {
      const maliciousPayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing',
        CallerName: '<script>alert("xss")</script>'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(maliciousPayload, '/api/webhooks/twilio/voice');

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(200);
      
      // Verify data was sanitized
      const responseData = await response.json();
      expect(responseData.callerName).not.toContain('<script>');
    });
  });

  test.describe('Replay Attack Protection', () => {
    test('should prevent replay attacks with timestamp validation', async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing',
        Timestamp: oldTimestamp.toString()
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should prevent replay attacks with nonce validation', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing',
        Nonce: 'used-nonce-12345'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      // First request should succeed
      const firstResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(firstResponse.status()).toBe(200);

      // Second request with same nonce should fail
      const secondResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(secondResponse.status()).toBe(403);
    });

    test('should handle concurrent replay attempts', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing',
        Nonce: 'concurrent-nonce-12345'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      // Send multiple concurrent requests with same nonce
      const responses = await Promise.all([
        page.request.post('/api/webhooks/twilio/voice', {
          data: formData,
          headers: { 
            'X-Twilio-Signature': signature,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }),
        page.request.post('/api/webhooks/twilio/voice', {
          data: formData,
          headers: { 
            'X-Twilio-Signature': signature,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }),
        page.request.post('/api/webhooks/twilio/voice', {
          data: formData,
          headers: { 
            'X-Twilio-Signature': signature,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      ]);

      // Only one request should succeed
      const successCount = responses.filter(r => r.status() === 200).length;
      const failureCount = responses.filter(r => r.status() === 403).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(2);
    });
  });

  test.describe('Rate Limiting', () => {
    test('should implement rate limiting for webhook endpoints', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      // Send multiple requests rapidly
      const responses = [];
      for (let i = 0; i < 10; i++) {
        const response = await page.request.post('/api/webhooks/twilio/voice', {
          data: formData,
          headers: { 
            'X-Twilio-Signature': signature,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        responses.push(response);
      }

      // Some requests should be rate limited
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    test('should handle rate limiting with proper headers', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      // Send requests until rate limited
      let response;
      let rateLimited = false;
      
      for (let i = 0; i < 20; i++) {
        response = await page.request.post('/api/webhooks/twilio/voice', {
          data: formData,
          headers: { 
            'X-Twilio-Signature': signature,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (response.status() === 429) {
          rateLimited = true;
          break;
        }
      }

      expect(rateLimited).toBe(true);
      expect(response?.headers()['x-ratelimit-limit']).toBeDefined();
      expect(response?.headers()['x-ratelimit-remaining']).toBeDefined();
      expect(response?.headers()['x-ratelimit-reset']).toBeDefined();
    });

    test('should reset rate limits after time window', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      // Send requests until rate limited
      let rateLimited = false;
      for (let i = 0; i < 20; i++) {
        const response = await page.request.post('/api/webhooks/twilio/voice', {
          data: formData,
          headers: { 
            'X-Twilio-Signature': signature,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        if (response.status() === 429) {
          rateLimited = true;
          break;
        }
      }

      expect(rateLimited).toBe(true);

      // Wait for rate limit reset (simulated)
      await page.waitForTimeout(1000);

      // Request should succeed after reset
      const resetResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(resetResponse.status()).toBe(200);
    });
  });

  test.describe('Input Sanitization', () => {
    test('should sanitize SQL injection attempts', async () => {
      const maliciousPayload = {
        CallSid: "CA1234567890abcdef1234567890abcdef'; DROP TABLE calls; --",
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(maliciousPayload, '/api/webhooks/twilio/voice');

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(200);
      
      // Verify data was sanitized
      const responseData = await response.json();
      expect(responseData.callSid).not.toContain('DROP TABLE');
    });

    test('should sanitize XSS attempts', async () => {
      const maliciousPayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing',
        CallerName: '<img src=x onerror=alert("xss")>'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(maliciousPayload, '/api/webhooks/twilio/voice');

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(200);
      
      // Verify data was sanitized
      const responseData = await response.json();
      expect(responseData.callerName).not.toContain('<img');
      expect(responseData.callerName).not.toContain('onerror');
    });

    test('should sanitize path traversal attempts', async () => {
      const maliciousPayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing',
        RecordingUrl: 'https://api.twilio.com/../../../etc/passwd'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(maliciousPayload, '/api/webhooks/twilio/recording');

      const response = await page.request.post('/api/webhooks/twilio/recording', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(200);
      
      // Verify URL was sanitized
      const responseData = await response.json();
      expect(responseData.recordingUrl).not.toContain('../');
    });

    test('should handle malformed JSON payloads', async () => {
      const malformedPayload = '{"CallSid": "CA1234567890abcdef1234567890abcdef", "From": "+15551234567", "To": "+15559876543", "CallStatus": "ringing",}'; // Trailing comma

      // For negative JSON tests, use JSON content type and omit/invalidate signature
      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: malformedPayload,
        headers: { 
          'Content-Type': 'application/json'
          // No signature header for malformed JSON test
        }
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle webhook processing errors gracefully', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      // Simulate processing error
      await qaHelpers.simulateWebhookProcessingError();

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Should return 500 for processing errors
      expect(response.status()).toBe(500);
    });

    test('should log security violations', async () => {
      const maliciousPayload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      const { formData } = qaHelpers.createWebhookTestData(maliciousPayload, '/api/webhooks/twilio/voice');

      // Send request with invalid signature
      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': 'invalid-signature-hash',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(401);

      // Verify security violation was logged
      await expect(page.locator('[data-testid="security-log"]')).toBeVisible();
    });

    test('should handle webhook timeout scenarios', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      // Simulate timeout
      await qaHelpers.simulateWebhookTimeout();

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Should return 408 for timeout
      expect(response.status()).toBe(408);
    });

    test('should handle webhook payload size limits', async () => {
      // Create oversized payload
      const largeBody = 'A'.repeat(10000); // 10KB message
      const payload = {
        MessageSid: 'SM1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        Body: largeBody,
        MessageStatus: 'received'
      };

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/sms');

      const response = await page.request.post('/api/webhooks/twilio/sms', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Should return 413 for payload too large
      expect(response.status()).toBe(413);
    });
  });

  test.describe('Authentication and Authorization', () => {
    test('should require valid Twilio webhook authentication', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      const { formData } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      // Test without signature header
      const noSignatureResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(noSignatureResponse.status()).toBe(401);

      // Test with empty signature
      const emptySignatureResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': '',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(emptySignatureResponse.status()).toBe(401);
    });

    test('should validate webhook source IP addresses', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      // Simulate request from unauthorized IP
      await qaHelpers.simulateUnauthorizedIP();

      const { formData, signature } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: formData,
        headers: { 
          'X-Twilio-Signature': signature,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should handle webhook authentication failures', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      const { formData } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');

      // Test with multiple invalid signatures
      const invalidSignatures = [
        'invalid-signature-1',
        'invalid-signature-2',
        'invalid-signature-3'
      ];

      for (const signature of invalidSignatures) {
        const response = await page.request.post('/api/webhooks/twilio/voice', {
          data: formData,
          headers: { 
            'X-Twilio-Signature': signature,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        expect(response.status()).toBe(401);
      }
    });
  });

  test.describe('Monitoring and Alerting', () => {
    test('should monitor webhook security events', async () => {
      const payload = {
        CallSid: 'CA1234567890abcdef1234567890abcdef',
        From: '+15551234567',
        To: '+15559876543',
        CallStatus: 'ringing'
      };

      // Send multiple invalid requests to trigger monitoring
      for (let i = 0; i < 5; i++) {
        const { formData } = qaHelpers.createWebhookTestData(payload, '/api/webhooks/twilio/voice');
        await page.request.post('/api/webhooks/twilio/voice', {
          data: formData,
          headers: { 
            'X-Twilio-Signature': 'invalid-signature',
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
      }

      // Verify security monitoring triggered
      await expect(page.locator('[data-testid="security-alert"]')).toBeVisible();
      await expect(page.locator('[data-testid="alert-type"]')).toContainText('Multiple failed webhook attempts');
    });

    test('should generate security reports', async () => {
      // Trigger various security events
      const securityEvents = [
        { type: 'invalid-signature', count: 3 },
        { type: 'rate-limit-exceeded', count: 2 },
        { type: 'malicious-payload', count: 1 }
      ];

      for (const event of securityEvents) {
        for (let i = 0; i < event.count; i++) {
          await qaHelpers.simulateSecurityEvent(event.type);
        }
      }

      // Generate security report
      await page.goto('/dashboard/security/reports');
      await page.click('[data-testid="generate-security-report"]');

      // Verify report generation
      await expect(page.locator('[data-testid="security-report"]')).toBeVisible();
      await expect(page.locator('[data-testid="report-summary"]')).toBeVisible();
    });

    test('should alert on suspicious webhook patterns', async () => {
      // Simulate suspicious pattern (rapid requests from same IP)
      await qaHelpers.simulateSuspiciousPattern();

      // Verify alert triggered
      await expect(page.locator('[data-testid="suspicious-activity-alert"]')).toBeVisible();
      await expect(page.locator('[data-testid="alert-severity"]')).toContainText('High');
    });
  });
});
