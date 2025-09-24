# Twilio Messaging API

## Core Endpoints

### Messages
- **POST** `/2010-04-01/Accounts/{AccountSid}/Messages.json`
  - Send SMS/MMS
  - Params: `To`, `From`, `Body`, `MediaUrl[]`, `StatusCallback`
  - Response: MessageSid, Status, Price

- **GET** `/2010-04-01/Accounts/{AccountSid}/Messages/{MessageSid}.json`
  - Retrieve message details
  - Response: Status, ErrorCode, Price, DateSent

- **GET** `/2010-04-01/Accounts/{AccountSid}/Messages.json`
  - List messages (with filters)

### Media
- **GET** `/2010-04-01/Accounts/{AccountSid}/Messages/{MessageSid}/Media.json`
  - List message media
- **GET** `/2010-04-01/Accounts/{AccountSid}/Messages/{MessageSid}/Media/{MediaSid}.json`
  - Get media details

## Webhooks

### Inbound Messages
```typescript
export async function handleInboundMessage(req: Request) {
  const signature = req.headers.get('X-Twilio-Signature');
  const url = req.url;
  const params = await req.formData();
  
  if (!verifyTwilioSignature({ url, params, signature })) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const messageSid = params.get('MessageSid');
  const from = params.get('From');
  const body = params.get('Body');
  const numMedia = parseInt(params.get('NumMedia') || '0');
  
  // Idempotency check
  const processed = await prisma.webhookLog.findUnique({
    where: { webhookId: messageSid }
  });
  if (processed) return new Response('OK');
  
  // Process message
  await prisma.$transaction(async (tx) => {
    await tx.webhookLog.create({ data: { webhookId: messageSid } });
    
    // Find or create contact
    let contact = await tx.contact.findFirst({ where: { phone: from } });
    if (!contact) {
      contact = await tx.contact.create({
        data: { phone: from, firstName: 'Unknown', lastName: 'Contact' }
      });
    }
    
    // Create message record
    await tx.message.create({
      data: {
        direction: 'INBOUND',
        status: 'DELIVERED',
        fromNumber: from,
        toNumber: params.get('To') || '',
        body: body || '',
        contactId: contact.id,
        twilioMessageSid: messageSid
      }
    });
  });
  
  return new Response('OK');
}
```

### Status Callbacks
Events: `queued`, `sent`, `delivered`, `failed`, `undelivered`

## A2P 10DLC Compliance
- Brand Registration: `/v1/a2p/BrandRegistrations`
- Campaign Registration: `/v1/a2p/Campaigns`
- Vetting: `/v1/a2p/BrandVettings`

## Sending Messages
- SMS: `Body` parameter
- MMS: `MediaUrl[]` array
- Status tracking via `StatusCallback`
