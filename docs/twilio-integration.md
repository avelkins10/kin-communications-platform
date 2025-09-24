# Twilio Integration Guide

Scope:
- Authentication and security (signatures, idempotency)
- Webhook patterns
- Env configuration
- High-level call and messaging flows

## Security
- Validate X-Twilio-Signature on every webhook
- Enforce HTTPS and verify host
- Idempotency: store processed webhook IDs for 24h

## Environment
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_TWIML_APP_SID
- TWILIO_VERIFY_SERVICE_SID

## Webhook Pattern
1. Verify signature
2. Derive idempotency key (e.g., CallSid, MessageSid)
3. Process in transaction; log errors

## Flows (overview)
- Inbound Voice → webhook(twiml) → TaskRouter/queue → agent
- Outbound Voice → REST Calls API → status callbacks
- Messaging → inbound status + delivery callbacks
