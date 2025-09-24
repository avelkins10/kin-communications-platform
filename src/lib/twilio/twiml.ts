import { TwiMLResponse } from '@/types/twilio';

/**
 * Generate TwiML for basic call handling
 */
export function generateBasicTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Please hold while we connect you to an available agent.</Say>
  <Dial timeout="30" timeLimit="3600">
    <Number>${process.env.TWILIO_AGENT_PHONE || '+1234567890'}</Number>
  </Dial>
  <Say voice="alice">We're sorry, but no agents are available at the moment. Please leave a message after the beep.</Say>
  <Record maxLength="300" finishOnKey="#" action="/api/webhooks/twilio/recording" />
  <Say voice="alice">Thank you for your message. We will get back to you as soon as possible.</Say>
  <Hangup />
</Response>`;
}

/**
 * Generate TwiML for voicemail routing
 */
export function generateVoicemailTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">You have reached our voicemail system. Please leave your message after the beep.</Say>
  <Record maxLength="300" finishOnKey="#" action="/api/webhooks/twilio/recording" />
  <Say voice="alice">Thank you for your message. We will get back to you as soon as possible.</Say>
  <Hangup />
</Response>`;
}

/**
 * Generate TwiML for call forwarding
 */
export function generateForwardTwiML(phoneNumber: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Please hold while we transfer your call.</Say>
  <Dial timeout="30" timeLimit="3600" callerId="${process.env.TWILIO_PHONE_NUMBER}">
    <Number>${phoneNumber}</Number>
  </Dial>
  <Say voice="alice">The call could not be completed. Please try again later.</Say>
  <Hangup />
</Response>`;
}

/**
 * Generate TwiML for conference setup
 */
export function generateConferenceTwiML(conferenceName: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Please wait while we connect you to the conference.</Say>
  <Dial>
    <Conference>${conferenceName}</Conference>
  </Dial>
</Response>`;
}

/**
 * Generate TwiML for call rejection
 */
export function generateRejectTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're sorry, but we cannot take your call at this time. Please try again later.</Say>
  <Hangup />
</Response>`;
}

/**
 * Generate TwiML for custom message
 */
export function generateMessageTwiML(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}</Say>
  <Hangup />
</Response>`;
}

/**
 * Generate TwiML for recording with custom action
 */
export function generateRecordingTwiML(
  message: string,
  actionUrl: string,
  maxLength: number = 300
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${message}</Say>
  <Record maxLength="${maxLength}" finishOnKey="#" action="${actionUrl}" />
  <Say voice="alice">Thank you for your message.</Say>
  <Hangup />
</Response>`;
}

/**
 * Generate TwiML for answering with dual-channel recording
 */
export function answerWithRecording(opts: {
  to: string;
  from: string;
  recordingStatusCallback: string;
  timeout?: number;
  timeLimit?: number;
}): string {
  const { to, from, recordingStatusCallback, timeout = 30, timeLimit = 3600 } = opts;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Please hold while we connect you to an available agent.</Say>
  <Dial timeout="${timeout}" timeLimit="${timeLimit}" record="record-from-answer-dual" recordingStatusCallback="${recordingStatusCallback}" recordingChannels="dual" callerId="${from}">
    <Number>${to}</Number>
  </Dial>
  <Say voice="alice">We're sorry, but no agents are available at the moment. Please leave a message after the beep.</Say>
  <Record maxLength="300" finishOnKey="#" action="${recordingStatusCallback}" recordingChannels="dual" />
  <Say voice="alice">Thank you for your message. We will get back to you as soon as possible.</Say>
  <Hangup />
</Response>`;
}
