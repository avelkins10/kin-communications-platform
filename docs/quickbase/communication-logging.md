# Quickbase Communication Logging

This document explains how the KIN Communications Platform logs all calls, SMS, and voicemails to Quickbase for compliance and reporting purposes.

## Overview

The communication logging system automatically captures all customer interactions and stores them in Quickbase for:
- **Compliance tracking** - Complete audit trail of all communications
- **Reporting** - Analytics on call volumes, response times, and customer interactions
- **Customer history** - Centralized view of all customer touchpoints
- **Performance monitoring** - Track agent performance and communication quality

## How It Works

### Flow Diagram

```
Twilio Webhook → Database Update → Quickbase Logging
     ↓                ↓                    ↓
  Call/SMS/VM    Local Storage      Compliance Log
```

### Process Flow

1. **Communication Occurs** - Customer calls, sends SMS, or leaves voicemail
2. **Twilio Webhook** - Twilio sends webhook to our platform
3. **Local Storage** - Communication is stored in our database first
4. **Quickbase Logging** - After successful local storage, data is logged to Quickbase
5. **Error Handling** - If Quickbase logging fails, the communication is still preserved locally

### Non-Blocking Design

**Critical Principle**: Quickbase logging failures never break core communication functionality.

- Calls are always answered and routed correctly
- SMS messages are always delivered
- Voicemails are always recorded
- Logging happens asynchronously after the core operation succeeds

## Configuration

### Required Environment Variables

```bash
# Enable/disable Quickbase integration
QUICKBASE_ENABLED="true"

# Basic Quickbase configuration
QUICKBASE_REALM="your-realm"
QUICKBASE_USER_TOKEN="your-user-token"
QUICKBASE_APP_ID="your-app-id"

# Communication logging table
QUICKBASE_TABLE_COMMUNICATIONS="your-communications-table-id"
```

### Field ID Configuration

Configure these field IDs to match your Quickbase app structure:

```bash
# Communication logging field IDs
QUICKBASE_FID_CUSTOMER="1"      # Customer reference field
QUICKBASE_FID_TYPE="2"          # Communication type (call, sms, voicemail)
QUICKBASE_FID_DIRECTION="3"     # Direction (inbound, outbound)
QUICKBASE_FID_TIMESTAMP="4"     # Timestamp of communication
QUICKBASE_FID_DURATION="5"      # Duration in seconds
QUICKBASE_FID_AGENT="6"         # Agent/user who handled it
QUICKBASE_FID_NOTES="7"         # Notes/details
QUICKBASE_FID_RECORDING="8"     # Recording URL
QUICKBASE_FID_STATUS="9"        # Status (completed, failed, missed)
```

## Data Mapping

### Call Logging

| Local Field | Quickbase Field | Description |
|-------------|-----------------|-------------|
| `call.id` | Record ID | Unique call identifier |
| `contact.quickbaseId` | Customer Field | Customer reference |
| `'call'` | Type Field | Communication type |
| `call.direction` | Direction Field | inbound/outbound |
| `call.startedAt` | Timestamp Field | When call started |
| `call.durationSec` | Duration Field | Call duration in seconds |
| `user.quickbaseUserId` | Agent Field | Agent who handled call |
| `call.recordingUrl` | Recording Field | URL to call recording |
| `call.status` | Status Field | completed/failed/missed |
| Call details | Notes Field | CallSid, phone numbers, etc. |

### Voicemail Logging

| Local Field | Quickbase Field | Description |
|-------------|-----------------|-------------|
| `voicemail.id` | Record ID | Unique voicemail identifier |
| `contact.quickbaseId` | Customer Field | Customer reference |
| `'voicemail'` | Type Field | Communication type |
| `call.direction` | Direction Field | inbound/outbound |
| `voicemail.createdAt` | Timestamp Field | When voicemail was left |
| `voicemail.duration` | Duration Field | Voicemail duration |
| `user.quickbaseUserId` | Agent Field | Agent assigned to follow up |
| `voicemail.recordingUrl` | Recording Field | URL to voicemail audio |
| `'completed'` | Status Field | Voicemail was recorded |
| Transcription + Priority | Notes Field | Voicemail content and priority |

### SMS Logging

| Local Field | Quickbase Field | Description |
|-------------|-----------------|-------------|
| `message.id` | Record ID | Unique message identifier |
| `contact.quickbaseId` | Customer Field | Customer reference |
| `'sms'` | Type Field | Communication type |
| `message.direction` | Direction Field | inbound/outbound |
| `message.sentAt` | Timestamp Field | When message was sent |
| `null` | Duration Field | SMS has no duration |
| `user.quickbaseUserId` | Agent Field | Agent who sent/received |
| `null` | Recording Field | SMS has no recording |
| `message.status` | Status Field | delivered/failed |
| Message body (truncated) | Notes Field | SMS content (max 500 chars) |

## Logged Events

### Automatic Logging Triggers

The system automatically logs these events:

1. **Completed Calls** - Calls that were answered and completed
2. **Failed Calls** - Calls that failed to connect (busy, no answer, etc.)
3. **Missed Calls** - Calls that went to voicemail
4. **Voicemails** - All voicemail messages with transcription
5. **Inbound SMS** - Messages received from customers
6. **Outbound SMS** - Messages sent to customers

### Logging Points

- **Recording Webhook** - Primary logging point for calls with recordings
- **Status Webhook** - Logs calls without recordings (completed, failed, missed)
- **SMS Webhook** - Logs all SMS messages (when SMS team implements)

## Error Handling

### Graceful Degradation

When Quickbase logging fails:

1. **Error is logged** to application logs and Sentry
2. **Communication continues** normally
3. **Local data is preserved** in our database
4. **No user impact** - calls, SMS, and voicemails work normally

### Error Types Handled

- **Authentication errors** (401) - Invalid or expired tokens
- **Rate limiting** (429) - Too many requests to Quickbase
- **Server errors** (500) - Quickbase API issues
- **Network timeouts** - Slow or failed network connections
- **Invalid field IDs** - Misconfigured field mappings

### Monitoring

Check these sources for Quickbase logging issues:

1. **Application Logs** - Look for "Failed to log" messages
2. **Sentry Breadcrumbs** - Search for `category: 'quickbase'`
3. **Quickbase API Logs** - Check your Quickbase app's API usage

## Troubleshooting

### Common Issues

#### "Communication not appearing in Quickbase"

**Possible Causes:**
- Field IDs don't match your Quickbase app
- Customer has no `quickbaseId` in local database
- Quickbase table ID is incorrect
- Authentication token is invalid

**Solutions:**
1. Verify field IDs in environment variables
2. Check that contacts have `quickbaseId` populated
3. Test Quickbase API connection
4. Review application logs for errors

#### "Authentication errors in logs"

**Possible Causes:**
- `QUICKBASE_USER_TOKEN` is expired or invalid
- Token doesn't have permissions for the table
- Realm name is incorrect

**Solutions:**
1. Generate new user token in Quickbase
2. Verify token has table permissions
3. Check `QUICKBASE_REALM` setting

#### "Rate limiting errors"

**Possible Causes:**
- Too many API calls to Quickbase
- Exceeded Quickbase API limits

**Solutions:**
1. Check Quickbase API usage limits
2. Implement request queuing (future enhancement)
3. Contact Quickbase support for limit increases

### Verification Steps

#### Check if logging is working:

1. **Look for success messages** in logs:
   ```
   Logged call to Quickbase: CA1234567890
   Logged voicemail to Quickbase: vm123
   Logged SMS to Quickbase: msg123
   ```

2. **Check Sentry breadcrumbs**:
   - Search for `category: 'quickbase'`
   - Look for `level: 'info'` breadcrumbs

3. **Query Quickbase directly**:
   - Check your communications table
   - Verify recent records match your test calls

#### Test logging locally:

1. **Make a test call** to your Twilio number
2. **Check application logs** for Quickbase logging messages
3. **Verify in Quickbase** that the record was created
4. **Check field mappings** match your expectations

## Testing

### Unit Tests

The system includes comprehensive unit tests:

```bash
# Run Quickbase service tests
npm test tests/lib/quickbase-service.test.ts

# Run integration tests
npm test tests/integration/quickbase-webhook-integration.test.ts
```

### Manual Testing

1. **Enable test mode**:
   ```bash
   QUICKBASE_ENABLED="true"
   ```

2. **Make test calls** and verify logging

3. **Check logs** for success/error messages

4. **Verify in Quickbase** that records are created

### Mock Testing

For development without real Quickbase connection:

```bash
# Disable Quickbase integration
QUICKBASE_ENABLED="false"
```

This allows testing the core communication functionality without Quickbase dependencies.

## API Reference

### Service Methods

#### `logCallToQuickbase(call, contact?, user?)`

Logs a call to Quickbase.

**Parameters:**
- `call` - Call object from database
- `contact` - Contact object (optional)
- `user` - User object (optional)

**Returns:** `Promise<void>`

**Example:**
```typescript
await quickbaseService.logCallToQuickbase(call, contact, user);
```

#### `logVoicemailToQuickbase(voicemail, call, contact?, user?)`

Logs a voicemail to Quickbase.

**Parameters:**
- `voicemail` - Voicemail object from database
- `call` - Associated call object
- `contact` - Contact object (optional)
- `user` - User object (optional)

**Returns:** `Promise<void>`

#### `logSMSToQuickbase(message, contact?, user?)`

Logs an SMS message to Quickbase.

**Parameters:**
- `message` - Message object from database
- `contact` - Contact object (optional)
- `user` - User object (optional)

**Returns:** `Promise<void>`

### Webhook Integration

#### Recording Webhook

```typescript
// After updating call with recording
await quickbaseService.logCallToQuickbase(callWithRelations, contact, user);

// For voicemails
await quickbaseService.logVoicemailToQuickbase(voicemail, call, contact, user);
```

#### Status Webhook

```typescript
// For completed calls without recordings
if (status === 'COMPLETED' && !call.recordingUrl) {
  await quickbaseService.logCallToQuickbase(callWithRelations, contact, user);
}
```

## Best Practices

### Configuration

1. **Always test field IDs** before deploying
2. **Use environment variables** for all configuration
3. **Enable feature flag** to disable if needed
4. **Monitor API usage** to avoid rate limits

### Error Handling

1. **Never throw errors** from logging methods
2. **Always log errors** to application logs
3. **Use Sentry breadcrumbs** for debugging
4. **Preserve local data** even if Quickbase fails

### Performance

1. **Log after local storage** to ensure data integrity
2. **Use async operations** to avoid blocking webhooks
3. **Implement timeouts** for Quickbase API calls
4. **Monitor response times** and optimize as needed

### Security

1. **Never log sensitive data** in notes fields
2. **Use secure tokens** for Quickbase authentication
3. **Validate all inputs** before logging
4. **Follow data retention policies** for compliance

## Future Enhancements

### Planned Features

1. **Retry mechanism** for failed logs
2. **Batch logging** for better performance
3. **Real-time sync** with Quickbase
4. **Advanced filtering** and search capabilities
5. **Custom field mappings** per customer type

### Integration Opportunities

1. **CRM integration** for customer data sync
2. **Analytics dashboard** for communication metrics
3. **Automated reporting** for compliance
4. **AI-powered insights** from communication data
