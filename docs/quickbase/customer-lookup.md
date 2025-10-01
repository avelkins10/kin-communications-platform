# Quickbase Customer Lookup

This document explains how the KIN Communications Platform uses Quickbase to look up customer information during incoming calls for intelligent routing and personalized service.

## Overview

The customer lookup system automatically identifies customers when they call by searching Quickbase using their phone number. This enables:

- **Intelligent routing** - Route calls to the customer's assigned project coordinator
- **Personalized service** - Access customer history and project status
- **Priority handling** - Identify VIP customers and urgent cases
- **Context awareness** - Provide agents with relevant customer information

## How It Works

### Flow Diagram

```
Incoming Call → Phone Lookup → Customer Data → Routing Decision
     ↓              ↓              ↓              ↓
  Twilio      Quickbase API    Customer Info   Agent/Queue
```

### Process Flow

1. **Incoming Call** - Customer dials your Twilio phone number
2. **Phone Lookup** - System searches Quickbase for customer by phone number
3. **Customer Data** - Retrieves customer information and project coordinator
4. **Routing Decision** - Routes call to appropriate agent or queue
5. **Fallback Handling** - If lookup fails, uses default routing

### Non-Blocking Design

**Critical Principle**: Customer lookup failures never prevent calls from being answered.

- Calls are always answered and routed
- Lookup happens before TwiML generation
- Timeout protection prevents slow responses
- Fallback to local contact data or default routing

## Configuration

### Required Environment Variables

```bash
# Enable/disable Quickbase integration
QUICKBASE_ENABLED="true"

# Basic Quickbase configuration
QUICKBASE_REALM="your-realm"
QUICKBASE_USER_TOKEN="your-user-token"
QUICKBASE_APP_ID="your-app-id"

# Customer lookup field IDs (Master Requirements defaults)
QUICKBASE_FIELD_PHONE="148"                    # Phone number field
QUICKBASE_FIELD_PROJECT_COORDINATOR="346"      # Project coordinator field
QUICKBASE_FIELD_PROJECT_STATUS="255"           # Project status field
```

### Project Coordinator Configuration

```bash
# Project coordinator table and field IDs
QUICKBASE_TABLE_PC="your-pc-table-id"
QUICKBASE_FID_PC_ID="1"                    # Coordinator ID
QUICKBASE_FID_PC_NAME="2"                  # Coordinator name
QUICKBASE_FID_PC_EMAIL="3"                 # Coordinator email
QUICKBASE_FID_PC_PHONE="4"                 # Coordinator phone
QUICKBASE_FID_PC_AVAILABILITY="5"          # Availability status
```

## Data Retrieved

### Customer Information

The system retrieves the following customer data from Quickbase:

| Field | Description | Usage |
|-------|-------------|-------|
| `id` | Customer ID | Unique identifier |
| `name` | Customer name | Display in routing message |
| `phone` | Phone number | Verification and display |
| `email` | Email address | Contact information |
| `projectCoordinatorId` | Coordinator ID | Routing decision |
| `projectStatus` | Project status | Priority determination |
| `lastContact` | Last contact date | Customer history |
| `notes` | Customer notes | Context for agents |

### Project Coordinator Information

When a customer has an assigned project coordinator:

| Field | Description | Usage |
|-------|-------------|-------|
| `id` | Coordinator ID | Match with local users |
| `name` | Coordinator name | Display in routing message |
| `email` | Coordinator email | Contact information |
| `phone` | Coordinator phone | Direct routing option |
| `availability` | Current status | Routing decision |
| `assignedCustomers` | Customer list | Verification |
| `workload` | Current load | Load balancing |

## Routing Integration

### How Customer Data Affects Routing

#### Project Coordinator Routing

1. **Customer has coordinator** → Route to coordinator's phone
2. **Coordinator not available** → Fall back to default routing
3. **No coordinator assigned** → Use default routing

#### Priority Determination

The system determines call priority based on:

- **Customer type** - VIP, Premium, Emergency customers get higher priority
- **Project status** - PRE_PTO vs POST_PTO affects handling
- **Recent issues** - Customers with complaints get priority
- **Last contact** - Recent customers may need follow-up

#### Department Assignment

- **Project status** determines which department handles the call
- **Customer type** may override department assignment
- **Coordinator department** influences routing

### Routing Decision Tree

```
Incoming Call
     ↓
Quickbase Lookup
     ↓
Customer Found?
     ↓                    ↓
    Yes                   No
     ↓                    ↓
Has Coordinator?      Default Routing
     ↓                    ↓
    Yes                   End
     ↓
Coordinator Available?
     ↓                    ↓
    Yes                   No
     ↓                    ↓
Route to Coordinator  Default Routing
     ↓                    ↓
    End                  End
```

## Phone Number Matching

### Supported Formats

The system tries multiple phone number formats to find customers:

1. **E.164 format** - `+1234567890` (international standard)
2. **10-digit format** - `2345678901` (US format)
3. **11-digit format** - `12345678901` (US with country code)
4. **Display format** - `(234) 567-8901` (formatted display)

### Matching Strategy

1. **Normalize input** - Convert to E.164 format
2. **Try E.164** - Search with international format
3. **Try 10-digit** - Search with US format
4. **Try 11-digit** - Search with country code
5. **Try display** - Search with formatted version
6. **First match wins** - Stop at first successful match

### Example Matching

For incoming call from `+1234567890`:

```
Search 1: +1234567890 → Found customer "John Doe"
Result: Route to John's project coordinator
```

For incoming call from `(234) 567-8901`:

```
Search 1: +12345678901 → Not found
Search 2: 2345678901 → Not found  
Search 3: 12345678901 → Not found
Search 4: (234) 567-8901 → Found customer "Jane Smith"
Result: Route to Jane's project coordinator
```

## Project Coordinator Lookup

### Coordinator Matching Process

1. **Get coordinator ID** from customer record
2. **Look up coordinator** in Quickbase PC table
3. **Match with local user** using `quickbaseUserId`
4. **Route to coordinator** if available
5. **Fall back** if no match or unavailable

### Local User Mapping

The system maps Quickbase coordinators to local users:

```typescript
// Find local user by Quickbase coordinator ID
const coordinator = await prisma.user.findUnique({
  where: { quickbaseUserId: qbCoordinator.id }
});
```

### Coordinator Record Structure

```typescript
interface QBProjectCoordinator {
  id: string;                    // Quickbase coordinator ID
  name: string;                  // Coordinator name
  email: string;                 // Email address
  phone?: string;                // Phone number
  availability: 'available' | 'busy' | 'offline';
  assignedCustomers: string[];   // List of customer IDs
  workload: number;              // Current workload
}
```

## Fallback Behavior

### When Lookup Fails

If Quickbase customer lookup fails:

1. **Log error** but don't break call handling
2. **Use local contact data** if available
3. **Fall back to default routing** if no local data
4. **Continue with call** - never drop the call

### Fallback Hierarchy

```
1. Quickbase customer + coordinator → Route to coordinator
2. Quickbase customer (no coordinator) → Default routing
3. Local contact + coordinator → Route to coordinator  
4. Local contact (no coordinator) → Default routing
5. No customer data → Default routing
```

### Default Routing

When no specific routing is found:

- **Route to default employee** number
- **Use standard greeting** message
- **Queue for next available agent**
- **Log for follow-up** if needed

## Performance

### Timeout Protection

The system includes timeout protection to prevent slow Quickbase responses:

```typescript
// 5-second timeout for customer lookup
const customer = await Promise.race([
  quickbaseService.findCustomerByPhone(phoneNumber),
  new Promise<null>((_, reject) => 
    setTimeout(() => reject(new Error('Quickbase lookup timeout')), 5000)
  )
]);
```

### Caching Strategy

Currently no caching is implemented, but future enhancements could include:

- **Redis caching** for frequently called customers
- **Local database cache** for recent lookups
- **TTL-based expiration** for cache invalidation

### Rate Limiting

- **Respect Quickbase API limits** to avoid rate limiting
- **Implement backoff** for failed requests
- **Monitor API usage** and adjust as needed

## Error Handling

### Error Types

The system handles these error scenarios:

1. **Authentication errors** (401) - Invalid tokens
2. **Rate limiting** (429) - Too many requests
3. **Server errors** (500) - Quickbase API issues
4. **Network timeouts** - Slow or failed connections
5. **Invalid field IDs** - Misconfigured mappings

### Error Response

When errors occur:

1. **Log error** to application logs and Sentry
2. **Continue with fallback** routing
3. **Don't break call** handling
4. **Monitor for patterns** in errors

### Monitoring

Check these sources for customer lookup issues:

1. **Application logs** - Look for "Customer lookup failed" messages
2. **Sentry breadcrumbs** - Search for `category: 'quickbase'`
3. **Call routing logs** - Check if calls are using fallback routing
4. **Quickbase API logs** - Monitor API usage and errors

## Troubleshooting

### Common Issues

#### "Customer not found for known phone number"

**Possible Causes:**
- Phone number format mismatch
- Field ID 148 is incorrect
- Customer not in Quickbase
- Phone number stored differently

**Solutions:**
1. Check phone number formats in Quickbase
2. Verify field ID 148 is correct
3. Test with different phone formats
4. Check customer exists in Quickbase

#### "Coordinator not routing calls"

**Possible Causes:**
- Coordinator ID field 346 is incorrect
- Local user has no `quickbaseUserId`
- Coordinator not in PC table
- User not available

**Solutions:**
1. Verify field ID 346 is correct
2. Check local users have `quickbaseUserId` populated
3. Verify coordinator exists in PC table
4. Check coordinator availability status

#### "Slow customer lookups"

**Possible Causes:**
- Quickbase API performance issues
- Network connectivity problems
- Large customer database
- Rate limiting

**Solutions:**
1. Check Quickbase API status
2. Monitor network connectivity
3. Consider caching implementation
4. Review API usage limits

### Verification Steps

#### Test customer lookup:

1. **Make test call** from known customer phone
2. **Check logs** for "Found Quickbase customer" message
3. **Verify routing** goes to correct coordinator
4. **Check TwiML** includes customer name

#### Test coordinator routing:

1. **Call from customer** with assigned coordinator
2. **Verify call routes** to coordinator's phone
3. **Check routing message** mentions coordinator name
4. **Test fallback** when coordinator unavailable

#### Test error handling:

1. **Disable Quickbase** temporarily
2. **Make test calls** and verify they still work
3. **Check fallback routing** is used
4. **Re-enable Quickbase** and verify normal operation

## Testing

### Unit Tests

```bash
# Run customer lookup tests
npm test tests/lib/quickbase-service.test.ts

# Run routing integration tests  
npm test tests/integration/quickbase-webhook-integration.test.ts
```

### Manual Testing

1. **Test with known customers**:
   ```bash
   # Call from customer phone number
   curl -X POST /api/webhooks/twilio/voice \
     -d "From=+1234567890&To=+0987654321&CallSid=CA123"
   ```

2. **Test with unknown numbers**:
   ```bash
   # Call from unknown phone number
   curl -X POST /api/webhooks/twilio/voice \
     -d "From=+9999999999&To=+0987654321&CallSid=CA124"
   ```

3. **Test coordinator routing**:
   - Call from customer with assigned coordinator
   - Verify call routes to coordinator's phone
   - Check routing message includes coordinator name

### Mock Testing

For development without real Quickbase:

```bash
# Disable Quickbase integration
QUICKBASE_ENABLED="false"
```

This allows testing call routing without Quickbase dependencies.

## API Reference

### Service Methods

#### `findCustomerByPhone(phoneNumber: string): Promise<CustomerContact | null>`

Looks up customer by phone number in Quickbase.

**Parameters:**
- `phoneNumber` - Phone number in any supported format

**Returns:** Customer contact object or null if not found

**Example:**
```typescript
const customer = await quickbaseService.findCustomerByPhone('+1234567890');
if (customer) {
  console.log(`Found customer: ${customer.name}`);
  if (customer.projectCoordinator) {
    console.log(`Coordinator: ${customer.projectCoordinator.name}`);
  }
}
```

### Webhook Integration

#### Voice Webhook

```typescript
// Customer lookup in voice webhook
const qbCustomer = await quickbaseService.findCustomerByPhone(normalizedFrom);

if (qbCustomer?.projectCoordinator) {
  // Route to Quickbase coordinator
  const coordinator = await prisma.user.findUnique({
    where: { quickbaseUserId: qbCustomer.projectCoordinator.id }
  });
  
  if (coordinator?.PhoneNumber?.[0]) {
    targetNumber = coordinator.PhoneNumber[0].phoneNumber;
    routingMessage = `Connecting you to your project coordinator, ${qbCustomer.projectCoordinator.name}.`;
  }
}
```

### Routing Engine Integration

```typescript
// Quickbase routing in RoutingEngine
static async getQuickbaseRouting(phoneNumber: string): Promise<QuickbaseRoutingResult> {
  const customer = await quickbaseService.findCustomerByPhone(phoneNumber);
  
  if (!customer) {
    return {
      customerId: undefined,
      projectCoordinator: undefined,
      department: undefined,
      priority: "normal",
      customAttributes: {}
    };
  }

  return {
    customerId: customer.id,
    projectCoordinator: customer.projectCoordinator,
    department: customer.department,
    priority: customer.type === "VIP" ? "high" : "normal",
    customAttributes: {
      customerName: customer.name,
      customerType: customer.type,
      lastContact: customer.lastContact,
      notes: customer.notes
    }
  };
}
```

## Best Practices

### Configuration

1. **Test field IDs** before deploying to production
2. **Use environment variables** for all configuration
3. **Enable feature flag** to disable if needed
4. **Monitor API usage** to avoid rate limits

### Performance

1. **Implement timeouts** to prevent slow responses
2. **Use async operations** to avoid blocking
3. **Consider caching** for frequently called customers
4. **Monitor response times** and optimize

### Error Handling

1. **Never break call handling** on lookup failures
2. **Always provide fallback** routing
3. **Log errors** for debugging
4. **Monitor error patterns** for system health

### Security

1. **Validate phone numbers** before lookup
2. **Use secure tokens** for Quickbase authentication
3. **Don't log sensitive data** in error messages
4. **Follow data privacy** requirements

## Future Enhancements

### Planned Features

1. **Caching layer** for improved performance
2. **Batch lookups** for multiple customers
3. **Real-time sync** with Quickbase changes
4. **Advanced routing rules** based on customer data
5. **AI-powered routing** recommendations

### Integration Opportunities

1. **CRM integration** for customer data sync
2. **Analytics dashboard** for routing metrics
3. **Customer journey tracking** across touchpoints
4. **Predictive routing** based on customer history
