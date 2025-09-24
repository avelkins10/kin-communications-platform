# Twilio Voice API

## Core Endpoints

### Calls
- **POST** `/2010-04-01/Accounts/{AccountSid}/Calls.json`
  - Create outbound call
  - Params: `To`, `From`, `Url` (TwiML), `StatusCallback`, `Record`
  - Response: CallSid, Status, Direction

- **GET** `/2010-04-01/Accounts/{AccountSid}/Calls/{CallSid}.json`
  - Retrieve call details
  - Response: Status, Duration, RecordingUrl, etc.

- **POST** `/2010-04-01/Accounts/{AccountSid}/Calls/{CallSid}.json`
  - Update call (hangup, redirect)

### Recordings
- **GET** `/2010-04-01/Accounts/{AccountSid}/Calls/{CallSid}/Recordings.json`
  - List call recordings
- **DELETE** `/2010-04-01/Accounts/{AccountSid}/Recordings/{RecordingSid}.json`
  - Delete recording

### Conferences
- **POST** `/2010-04-01/Accounts/{AccountSid}/Conferences.json`
  - Create conference
- **GET** `/2010-04-01/Accounts/{AccountSid}/Conferences/{ConferenceSid}/Participants.json`
  - List participants

## Status Callbacks
Events: `initiated`, `ringing`, `answered`, `completed`, `busy`, `failed`, `no-answer`

```typescript
// Handler template
export async function handleCallStatusCallback(req: Request) {
  const signature = req.headers.get('X-Twilio-Signature');
  const url = req.url;
  const params = await req.formData();
  
  if (!verifyTwilioSignature({ url, params, signature })) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const callSid = params.get('CallSid');
  const status = params.get('CallStatus');
  
  // Idempotency check
  const processed = await prisma.webhookLog.findUnique({
    where: { webhookId: callSid }
  });
  if (processed) return new Response('OK');
  
  // Process in transaction
  await prisma.$transaction(async (tx) => {
    await tx.webhookLog.create({ data: { webhookId: callSid } });
    await tx.call.update({
      where: { twilioCallSid: callSid },
      data: { status, endedAt: status === 'completed' ? new Date() : undefined }
    });
  });
  
  return new Response('OK');
}
```

## Recording & Transcription
- Dual-channel recording: `RecordingChannels=dual`
- Transcription: `Transcribe=true`, `TranscribeCallback`
- Store: RecordingUrl, TranscriptionText, Duration

## SIP & Media
- SIP Interface configuration
- Secure Media for PCI compliance
- Media Streams for real-time processing
