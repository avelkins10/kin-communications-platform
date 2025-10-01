import { test, expect, Page } from '@playwright/test';
import { qaHelpers } from '../utils/qa-helpers';
import { DatabaseHelper } from '../utils/test-helpers';

test.describe('Quickbase Webhook Integration', () => {
  let dbHelper: DatabaseHelper;
  let testContactId: string;
  let testUserId: string;
  let testCallId: string;

  test.beforeEach(async () => {
    dbHelper = new DatabaseHelper();
    
    // Create test contact with Quickbase ID
    const testContact = await dbHelper.createContact({
      firstName: 'Test',
      lastName: 'Customer',
      phone: '+1234567890',
      email: 'test@example.com',
      type: 'CUSTOMER',
      quickbaseId: 'qb_test_123',
      projectStatus: 'PRE_PTO'
    });
    testContactId = testContact.id;

    // Create test user with Quickbase user ID
    const testUser = await dbHelper.createUser({
      email: 'testuser@example.com',
      name: 'Test User',
      quickbaseUserId: 'qb_user_123',
      department: 'Support'
    });
    testUserId = testUser.id;

    // Create test call
    const testCall = await dbHelper.createCall({
      callSid: 'CA_test_123',
      from: '+1234567890',
      to: '+0987654321',
      direction: 'INBOUND',
      status: 'RINGING',
      contactId: testContactId,
      userId: testUserId
    });
    testCallId = testCall.id;
  });

  test.afterEach(async () => {
    // Clean up test data
    if (testCallId) await dbHelper.deleteCall(testCallId);
    if (testContactId) await dbHelper.deleteContact(testContactId);
    if (testUserId) await dbHelper.deleteUser(testUserId);
  });

  test('voice webhook with Quickbase lookup success', async ({ request }) => {
    // Mock Quickbase customer lookup
    const mockQBCustomer = {
      id: 'qb_test_123',
      name: 'Test Customer',
      phone: '+1234567890',
      email: 'test@example.com',
      projectCoordinatorId: 'qb_user_123',
      projectStatus: 'PRE_PTO'
    };

    const mockCoordinator = {
      id: 'qb_user_123',
      name: 'Test User',
      email: 'testuser@example.com',
      availability: 'available',
      assignedCustomers: ['qb_test_123'],
      workload: 5
    };

    // Mock Quickbase API responses
    await qaHelpers.mockQuickbaseCustomerLookup('+1234567890', mockQBCustomer);
    await qaHelpers.mockQuickbaseCoordinatorLookup('qb_test_123', mockCoordinator);

    // Send voice webhook
    const webhookData = new URLSearchParams({
      CallSid: 'CA_test_voice_123',
      From: '+1234567890',
      To: '+0987654321',
      CallStatus: 'ringing'
    });

    const signature = qaHelpers.computeTwilioSignature(webhookData.toString());

    const response = await request.post('/api/webhooks/twilio/voice', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      data: webhookData.toString()
    });

    expect(response.status()).toBe(200);
    
    const responseText = await response.text();
    expect(responseText).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(responseText).toContain('<Response>');

    // Verify call was created in database
    const call = await dbHelper.getCallBySid('CA_test_voice_123');
    expect(call).toBeTruthy();
    expect(call?.contactId).toBe(testContactId);

    // Verify Quickbase lookup was called
    expect(qaHelpers.verifyQuickbaseLookupCalled('+1234567890')).toBe(true);
  });

  test('voice webhook with Quickbase lookup failure', async ({ request }) => {
    // Mock Quickbase API to throw error
    await qaHelpers.simulateQuickbaseError('customer_lookup');

    // Send voice webhook
    const webhookData = new URLSearchParams({
      CallSid: 'CA_test_voice_fail_123',
      From: '+1234567890',
      To: '+0987654321',
      CallStatus: 'ringing'
    });

    const signature = qaHelpers.computeTwilioSignature(webhookData.toString());

    const response = await request.post('/api/webhooks/twilio/voice', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      data: webhookData.toString()
    });

    expect(response.status()).toBe(200);
    
    const responseText = await response.text();
    expect(responseText).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(responseText).toContain('<Response>');

    // Verify call was still created in database (fallback behavior)
    const call = await dbHelper.getCallBySid('CA_test_voice_fail_123');
    expect(call).toBeTruthy();

    // Verify error was logged but didn't break webhook
    expect(qaHelpers.verifyQuickbaseErrorLogged('customer_lookup')).toBe(true);
  });

  test('recording webhook with Quickbase logging success', async ({ request }) => {
    // Mock Quickbase communication logging
    await qaHelpers.mockQuickbaseCommunicationLog({
      customerId: 'qb_test_123',
      type: 'call',
      direction: 'inbound',
      status: 'completed'
    });

    // Send recording webhook
    const webhookData = new URLSearchParams({
      CallSid: 'CA_test_123',
      RecordingSid: 'RE_test_123',
      RecordingUrl: 'https://example.com/recording.mp3',
      RecordingDuration: '120',
      RecordingStatus: 'completed'
    });

    const signature = qaHelpers.computeTwilioSignature(webhookData.toString());

    const response = await request.post('/api/webhooks/twilio/recording', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      data: webhookData.toString()
    });

    expect(response.status()).toBe(200);

    // Verify call was updated with recording URL
    const call = await dbHelper.getCall(testCallId);
    expect(call?.recordingUrl).toBe('https://example.com/recording.mp3');
    expect(call?.status).toBe('COMPLETED');

    // Verify Quickbase logging was called
    expect(qaHelpers.verifyQuickbaseLogCalled('CA_test_123', 'call')).toBe(true);
  });

  test('recording webhook with Quickbase logging failure', async ({ request }) => {
    // Mock Quickbase API to throw error
    await qaHelpers.simulateQuickbaseError('communication_logging');

    // Send recording webhook
    const webhookData = new URLSearchParams({
      CallSid: 'CA_test_123',
      RecordingSid: 'RE_test_123',
      RecordingUrl: 'https://example.com/recording.mp3',
      RecordingDuration: '120',
      RecordingStatus: 'completed'
    });

    const signature = qaHelpers.computeTwilioSignature(webhookData.toString());

    const response = await request.post('/api/webhooks/twilio/recording', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      data: webhookData.toString()
    });

    expect(response.status()).toBe(200);

    // Verify call was still updated with recording URL
    const call = await dbHelper.getCall(testCallId);
    expect(call?.recordingUrl).toBe('https://example.com/recording.mp3');

    // Verify error was logged but didn't break webhook
    expect(qaHelpers.verifyQuickbaseErrorLogged('communication_logging')).toBe(true);
  });

  test('voicemail with Quickbase logging', async ({ request }) => {
    // Update call to voicemail status
    await dbHelper.updateCall(testCallId, { status: 'VOICEMAIL' });

    // Mock Quickbase communication logging for voicemail
    await qaHelpers.mockQuickbaseCommunicationLog({
      customerId: 'qb_test_123',
      type: 'voicemail',
      direction: 'inbound',
      status: 'completed'
    });

    // Send recording webhook
    const webhookData = new URLSearchParams({
      CallSid: 'CA_test_123',
      RecordingSid: 'RE_voicemail_123',
      RecordingUrl: 'https://example.com/voicemail.mp3',
      RecordingDuration: '60',
      RecordingStatus: 'completed'
    });

    const signature = qaHelpers.computeTwilioSignature(webhookData.toString());

    const response = await request.post('/api/webhooks/twilio/recording', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      data: webhookData.toString()
    });

    expect(response.status()).toBe(200);

    // Verify voicemail record was created
    const voicemail = await dbHelper.getVoicemailByCallId(testCallId);
    expect(voicemail).toBeTruthy();
    expect(voicemail?.audioUrl).toBe('https://example.com/voicemail.mp3');

    // Verify Quickbase logging was called for both call and voicemail
    expect(qaHelpers.verifyQuickbaseLogCalled('CA_test_123', 'call')).toBe(true);
    expect(qaHelpers.verifyQuickbaseLogCalled('CA_test_123', 'voicemail')).toBe(true);
  });

  test('status webhook with Quickbase logging for completed call', async ({ request }) => {
    // Mock Quickbase communication logging
    await qaHelpers.mockQuickbaseCommunicationLog({
      customerId: 'qb_test_123',
      type: 'call',
      direction: 'inbound',
      status: 'completed'
    });

    // Send status webhook
    const webhookData = new URLSearchParams({
      CallSid: 'CA_test_123',
      CallStatus: 'completed',
      From: '+1234567890',
      To: '+0987654321',
      CallDuration: '120',
      Direction: 'inbound'
    });

    const signature = qaHelpers.computeTwilioSignature(webhookData.toString());

    const response = await request.post('/api/webhooks/twilio/status', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      data: webhookData.toString()
    });

    expect(response.status()).toBe(200);

    // Verify call status was updated
    const call = await dbHelper.getCall(testCallId);
    expect(call?.status).toBe('COMPLETED');
    expect(call?.durationSec).toBe(120);

    // Verify Quickbase logging was called
    expect(qaHelpers.verifyQuickbaseLogCalled('CA_test_123', 'call')).toBe(true);
  });

  test('status webhook skips logging for call with recording', async ({ request }) => {
    // Update call to have recording URL (simulating recording webhook already logged it)
    await dbHelper.updateCall(testCallId, { 
      status: 'COMPLETED',
      recordingUrl: 'https://example.com/recording.mp3'
    });

    // Send status webhook
    const webhookData = new URLSearchParams({
      CallSid: 'CA_test_123',
      CallStatus: 'completed',
      From: '+1234567890',
      To: '+0987654321',
      CallDuration: '120',
      Direction: 'inbound'
    });

    const signature = qaHelpers.computeTwilioSignature(webhookData.toString());

    const response = await request.post('/api/webhooks/twilio/status', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': signature
      },
      data: webhookData.toString()
    });

    expect(response.status()).toBe(200);

    // Verify Quickbase logging was NOT called (to avoid duplicates)
    expect(qaHelpers.verifyQuickbaseLogCalled('CA_test_123', 'call')).toBe(false);
  });

  test('end-to-end flow with Quickbase integration', async ({ request }) => {
    // Step 1: Voice webhook - create call and lookup customer
    const mockQBCustomer = {
      id: 'qb_test_123',
      name: 'Test Customer',
      phone: '+1234567890',
      email: 'test@example.com',
      projectCoordinatorId: 'qb_user_123',
      projectStatus: 'PRE_PTO'
    };

    await qaHelpers.mockQuickbaseCustomerLookup('+1234567890', mockQBCustomer);

    const voiceWebhookData = new URLSearchParams({
      CallSid: 'CA_e2e_test_123',
      From: '+1234567890',
      To: '+0987654321',
      CallStatus: 'ringing'
    });

    const voiceSignature = qaHelpers.computeTwilioSignature(voiceWebhookData.toString());

    const voiceResponse = await request.post('/api/webhooks/twilio/voice', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': voiceSignature
      },
      data: voiceWebhookData.toString()
    });

    expect(voiceResponse.status()).toBe(200);

    // Step 2: Status webhook - update call status
    const statusWebhookData = new URLSearchParams({
      CallSid: 'CA_e2e_test_123',
      CallStatus: 'completed',
      From: '+1234567890',
      To: '+0987654321',
      CallDuration: '120',
      Direction: 'inbound'
    });

    const statusSignature = qaHelpers.computeTwilioSignature(statusWebhookData.toString());

    const statusResponse = await request.post('/api/webhooks/twilio/status', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': statusSignature
      },
      data: statusWebhookData.toString()
    });

    expect(statusResponse.status()).toBe(200);

    // Step 3: Recording webhook - add recording and log to Quickbase
    await qaHelpers.mockQuickbaseCommunicationLog({
      customerId: 'qb_test_123',
      type: 'call',
      direction: 'inbound',
      status: 'completed'
    });

    const recordingWebhookData = new URLSearchParams({
      CallSid: 'CA_e2e_test_123',
      RecordingSid: 'RE_e2e_test_123',
      RecordingUrl: 'https://example.com/recording.mp3',
      RecordingDuration: '120',
      RecordingStatus: 'completed'
    });

    const recordingSignature = qaHelpers.computeTwilioSignature(recordingWebhookData.toString());

    const recordingResponse = await request.post('/api/webhooks/twilio/recording', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': recordingSignature
      },
      data: recordingWebhookData.toString()
    });

    expect(recordingResponse.status()).toBe(200);

    // Verify complete flow worked
    const call = await dbHelper.getCallBySid('CA_e2e_test_123');
    expect(call).toBeTruthy();
    expect(call?.status).toBe('COMPLETED');
    expect(call?.recordingUrl).toBe('https://example.com/recording.mp3');
    expect(call?.durationSec).toBe(120);

    // Verify only one Quickbase log entry was created (from recording webhook)
    expect(qaHelpers.verifyQuickbaseLogCalled('CA_e2e_test_123', 'call')).toBe(true);
  });

  test('Quickbase disabled scenario', async ({ request }) => {
    // Set Quickbase as disabled
    await qaHelpers.setQuickbaseEnabled(false);

    try {
      // Send voice webhook
      const webhookData = new URLSearchParams({
        CallSid: 'CA_disabled_test_123',
        From: '+1234567890',
        To: '+0987654321',
        CallStatus: 'ringing'
      });

      const signature = qaHelpers.computeTwilioSignature(webhookData.toString());

      const response = await request.post('/api/webhooks/twilio/voice', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Twilio-Signature': signature
        },
        data: webhookData.toString()
      });

      expect(response.status()).toBe(200);
      
      const responseText = await response.text();
      expect(responseText).toContain('<?xml version="1.0" encoding="UTF-8"?>');

      // Verify call was created without Quickbase lookup
      const call = await dbHelper.getCallBySid('CA_disabled_test_123');
      expect(call).toBeTruthy();

      // Verify no Quickbase API calls were made
      expect(qaHelpers.verifyQuickbaseLookupCalled('+1234567890')).toBe(false);
    } finally {
      // Re-enable Quickbase
      await qaHelpers.setQuickbaseEnabled(true);
    }
  });
});
