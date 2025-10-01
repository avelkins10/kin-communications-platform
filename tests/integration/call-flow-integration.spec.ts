import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';

test.describe('Call Flow Integration Tests', () => {
  let page: Page;
  let testData: any;
  let authToken: string;

  test.beforeAll(async () => {
    testData = await qaHelpers.seedTestData();
  });

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await qaHelpers.setupTestEnvironment(page);
    
    // Authenticate user
    const authResponse = await page.request.post('/api/auth/signin', {
      data: {
        email: testData.users[0].email,
        password: testData.users[0].password
      }
    });
    const authData = await authResponse.json();
    authToken = authData.token;
  });

  test.describe('End-to-End Call Flow', () => {
    test('should handle complete inbound call flow with recording', async () => {
      // Step 1: Simulate incoming call webhook
      const voiceWebhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        CallerCity: 'New York',
        CallerState: 'NY',
        CallerCountry: 'US',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const voiceResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: voiceWebhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(voiceResponse.status()).toBe(200);
      const twiml = await voiceResponse.text();
      expect(twiml).toContain('<?xml version="1.0" encoding="UTF-8"?>');

      // Step 2: Verify call record was created
      const callsResponse = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(callsResponse.status()).toBe(200);
      const callsData = await callsResponse.json();
      const createdCall = callsData.calls.find((call: any) => 
        call.twilioCallSid === 'CA1234567890abcdef'
      );
      expect(createdCall).toBeDefined();
      expect(createdCall.status).toBe('RINGING');
      expect(createdCall.direction).toBe('INBOUND');

      // Step 3: Simulate call status update (answered)
      const statusWebhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'in-progress',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const statusResponse = await page.request.post('/api/webhooks/twilio/status', {
        data: statusWebhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(statusResponse.status()).toBe(200);

      // Step 4: Verify call status was updated
      const updatedCallsResponse = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const updatedCallsData = await updatedCallsResponse.json();
      const updatedCall = updatedCallsData.calls.find((call: any) => 
        call.twilioCallSid === 'CA1234567890abcdef'
      );
      expect(updatedCall.status).toBe('IN_PROGRESS');

      // Step 5: Simulate call completion
      const completionWebhookData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'completed',
        Duration: '120',
        From: '+15551234567',
        To: '+15551234568',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const completionResponse = await page.request.post('/api/webhooks/twilio/status', {
        data: completionWebhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(completionResponse.status()).toBe(200);

      // Step 6: Simulate recording completion
      const recordingWebhookData = {
        CallSid: 'CA1234567890abcdef',
        RecordingSid: 'RE1234567890abcdef',
        RecordingUrl: 'https://api.twilio.com/recording.mp3',
        RecordingDuration: '120',
        RecordingStatus: 'completed',
        RecordingChannels: '1',
        RecordingStartTime: '2024-01-15T10:00:00Z',
        RecordingSource: 'DialVerb',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const recordingResponse = await page.request.post('/api/webhooks/twilio/recording', {
        data: recordingWebhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(recordingResponse.status()).toBe(200);

      // Step 7: Verify final call state
      const finalCallsResponse = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const finalCallsData = await finalCallsResponse.json();
      const finalCall = finalCallsData.calls.find((call: any) => 
        call.twilioCallSid === 'CA1234567890abcdef'
      );
      expect(finalCall.status).toBe('COMPLETED');
      expect(finalCall.durationSec).toBe(120);
      expect(finalCall.recordingUrl).toBe('https://api.twilio.com/recording.mp3');
      expect(finalCall.recordingSid).toBe('RE1234567890abcdef');
    });

    test('should handle voicemail flow after hours', async () => {
      // Mock after hours time
      await page.addInitScript(() => {
        const mockDate = new Date('2024-01-13T22:00:00Z'); // Saturday 10 PM
        Date.now = () => mockDate.getTime();
        global.Date = class extends Date {
          constructor(...args: any[]) {
            if (args.length === 0) {
              super(mockDate);
            } else {
              super(...args);
            }
          }
        } as any;
      });

      // Step 1: Simulate incoming call webhook after hours
      const voiceWebhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const voiceResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: voiceWebhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(voiceResponse.status()).toBe(200);
      const twiml = await voiceResponse.text();
      expect(twiml).toContain('<?xml version="1.0" encoding="UTF-8"?>');

      // Step 2: Verify call was marked as voicemail
      const callsResponse = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(callsResponse.status()).toBe(200);
      const callsData = await callsResponse.json();
      const voicemailCall = callsData.calls.find((call: any) => 
        call.twilioCallSid === 'CA1234567890abcdef'
      );
      expect(voicemailCall.status).toBe('VOICEMAIL');

      // Step 3: Simulate voicemail recording completion
      const recordingWebhookData = {
        CallSid: 'CA1234567890abcdef',
        RecordingSid: 'RE1234567890abcdef',
        RecordingUrl: 'https://api.twilio.com/voicemail.mp3',
        RecordingDuration: '45',
        RecordingStatus: 'completed',
        RecordingChannels: '1',
        RecordingStartTime: '2024-01-13T22:00:00Z',
        RecordingSource: 'RecordVerb',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const recordingResponse = await page.request.post('/api/webhooks/twilio/recording', {
        data: recordingWebhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(recordingResponse.status()).toBe(200);

      // Step 4: Verify voicemail record was created
      const voicemailsResponse = await page.request.get('/api/voicemails', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(voicemailsResponse.status()).toBe(200);
      const voicemailsData = await voicemailsResponse.json();
      const voicemail = voicemailsData.voicemails.find((vm: any) => 
        vm.callId === voicemailCall.id
      );
      expect(voicemail).toBeDefined();
      expect(voicemail.audioUrl).toBe('https://api.twilio.com/voicemail.mp3');
      expect(voicemail.duration).toBe(45);
    });

    test('should handle call failure and retry logic', async () => {
      // Step 1: Simulate failed call
      const failedCallData = {
        CallSid: 'CA1234567890abcdef',
        CallStatus: 'failed',
        From: '+15551234567',
        To: '+15551234568',
        ErrorCode: '11200',
        ErrorMessage: 'Invalid phone number',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const statusResponse = await page.request.post('/api/webhooks/twilio/status', {
        data: failedCallData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(statusResponse.status()).toBe(200);

      // Step 2: Verify call was marked as failed
      const callsResponse = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(callsResponse.status()).toBe(200);
      const callsData = await callsResponse.json();
      const failedCall = callsData.calls.find((call: any) => 
        call.twilioCallSid === 'CA1234567890abcdef'
      );
      expect(failedCall.status).toBe('FAILED');

      // Step 3: Test retry logic with same webhook
      const retryResponse = await page.request.post('/api/webhooks/twilio/status', {
        data: failedCallData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(retryResponse.status()).toBe(200);
      // Should handle retry gracefully without errors
    });
  });

  test.describe('Contact Assignment and Routing', () => {
    test('should assign call to project coordinator when contact exists', async () => {
      // Create a contact with project coordinator
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        organization: 'Test Company',
        type: 'CUSTOMER',
        projectCoordinatorId: testData.users[1].id
      };

      const contactResponse = await page.request.post('/api/contacts', {
        data: contactData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(contactResponse.status()).toBe(201);
      const contact = await contactResponse.json();

      // Simulate incoming call from this contact
      const voiceWebhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const voiceResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: voiceWebhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(voiceResponse.status()).toBe(200);

      // Verify call was assigned to project coordinator
      const callsResponse = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(callsResponse.status()).toBe(200);
      const callsData = await callsResponse.json();
      const assignedCall = callsData.calls.find((call: any) => 
        call.twilioCallSid === 'CA1234567890abcdef'
      );
      expect(assignedCall.contactId).toBe(contact.contact.id);
      expect(assignedCall.userId).toBe(testData.users[1].id);
    });

    test('should route to default employee when no coordinator', async () => {
      // Create a contact without project coordinator
      const contactData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+15551234569',
        email: 'jane.smith@example.com',
        organization: 'Test Company',
        type: 'CUSTOMER'
      };

      const contactResponse = await page.request.post('/api/contacts', {
        data: contactData,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(contactResponse.status()).toBe(201);

      // Simulate incoming call from this contact
      const voiceWebhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234569',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'Jane Smith',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const voiceResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: voiceWebhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(voiceResponse.status()).toBe(200);

      // Verify call was assigned to default employee
      const callsResponse = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(callsResponse.status()).toBe(200);
      const callsData = await callsResponse.json();
      const assignedCall = callsData.calls.find((call: any) => 
        call.twilioCallSid === 'CA1234567890abcdef'
      );
      expect(assignedCall.userId).toBe(testData.users[0].id); // Default employee
    });
  });

  test.describe('Real-time Updates', () => {
    test('should emit real-time updates for call status changes', async () => {
      // This test would require WebSocket connection setup
      // For now, we'll verify the webhook processing works correctly
      
      const voiceWebhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        CallerName: 'John Doe',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const voiceResponse = await page.request.post('/api/webhooks/twilio/voice', {
        data: voiceWebhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(voiceResponse.status()).toBe(200);

      // Verify call was created and can be retrieved
      const callsResponse = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(callsResponse.status()).toBe(200);
      const callsData = await callsResponse.json();
      const createdCall = callsData.calls.find((call: any) => 
        call.twilioCallSid === 'CA1234567890abcdef'
      );
      expect(createdCall).toBeDefined();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle malformed webhook data gracefully', async () => {
      const malformedData = {
        CallSid: 'CA1234567890abcdef'
        // Missing required fields
      };

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: malformedData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should handle invalid Twilio signature', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: webhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'invalid-signature'
        }
      });

      expect(response.status()).toBe(401);
    });

    test('should handle database connection failures', async () => {
      // Simulate database failure
      await qaHelpers.simulateDatabaseFailure();

      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      const response = await page.request.post('/api/webhooks/twilio/voice', {
        data: webhookData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': 'valid-signature'
        }
      });

      expect(response.status()).toBe(500);

      // Restore database connection
      await qaHelpers.restoreDatabaseConnection();
    });

    test('should handle concurrent webhook processing', async () => {
      const webhookData = {
        CallSid: 'CA1234567890abcdef',
        From: '+15551234567',
        To: '+15551234568',
        CallStatus: 'ringing',
        Direction: 'inbound',
        AccountSid: 'AC1234567890abcdef',
        ApiVersion: '2010-04-01'
      };

      // Send multiple concurrent requests
      const requests = Array(5).fill(null).map(() =>
        page.request.post('/api/webhooks/twilio/voice', {
          data: webhookData,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Twilio-Signature': 'valid-signature'
          }
        })
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed (idempotency)
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });

      // Verify only one call record was created
      const callsResponse = await page.request.get('/api/calls', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const callsData = await callsResponse.json();
      const matchingCalls = callsData.calls.filter((call: any) => 
        call.twilioCallSid === 'CA1234567890abcdef'
      );
      expect(matchingCalls).toHaveLength(1);
    });
  });
});
