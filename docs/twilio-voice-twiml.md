# Twilio Voice TwiML

## Core Verbs

### <Say>
```xml
<Say voice="alice" language="en-US">Hello, thank you for calling.</Say>
```

### <Play>
```xml
<Play>https://demo.twilio.com/docs/voice.xml</Play>
```

### <Gather>
```xml
<Gather numDigits="1" action="/handle-gather" method="POST">
  <Say>Press 1 for sales, 2 for support.</Say>
</Gather>
```

### <Dial>
```xml
<Dial callerId="+15551234567" timeout="30" action="/handle-dial-status">
  <Number>+15559876543</Number>
</Dial>
```

### <Enqueue>
```xml
<Enqueue waitUrl="/wait-music" action="/handle-queue-status">
  sales-queue
</Enqueue>
```

### <Record>
```xml
<Record 
  action="/handle-recording" 
  method="POST"
  recordingStatusCallback="/recording-complete"
  transcribe="true"
  transcribeCallback="/transcription-complete">
  <Say>Please leave your message after the beep.</Say>
</Record>
```

### <Conference>
```xml
<Conference 
  startConferenceOnEnter="true" 
  endConferenceOnExit="true"
  waitUrl="/conference-hold"
  statusCallback="/conference-status">
  sales-conference
</Conference>
```

## Common Patterns

### Inbound IVR
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="/ivr-handler" method="POST">
    <Say>Welcome to KIN Communications. Press 1 for sales, 2 for support, 0 for operator.</Say>
  </Gather>
  <Say>We didn't receive any input. Goodbye!</Say>
  <Hangup/>
</Response>
```

### Queue to Agent
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Please hold while we connect you to an agent.</Say>
  <Enqueue waitUrl="/wait-music" action="/queue-status">
    sales-queue
  </Enqueue>
</Response>
```

### Voicemail
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>No agents are available. Please leave a message.</Say>
  <Record 
    action="/voicemail-complete"
    recordingStatusCallback="/voicemail-status"
    transcribe="true"
    transcribeCallback="/voicemail-transcription">
  </Record>
  <Say>Thank you for your message. Goodbye!</Say>
  <Hangup/>
</Response>
```

### Transfer
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Transferring you now.</Say>
  <Dial callerId="+15551234567" action="/transfer-status">
    <Number>+15559876543</Number>
  </Dial>
  <Say>Transfer failed. Please try again later.</Say>
  <Hangup/>
</Response>
```

## Callback Parameters
- `action`: URL to call after verb completes
- `method`: HTTP method (GET/POST)
- `statusCallback`: URL for status updates
- `statusCallbackEvent`: Which events to send (initiated, ringing, answered, completed)
