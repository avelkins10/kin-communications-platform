import { TwiMLResponse } from '@/types/twilio';

/**
 * Get and validate the recording callback URL from environment variables
 * @returns The full callback URL for recording webhooks
 * @throws Error if PUBLIC_BASE_URL is not set or invalid
 */
function getRecordingCallbackUrl(): string {
  const baseUrl = process.env.PUBLIC_BASE_URL;
  
  if (!baseUrl) {
    throw new Error('PUBLIC_BASE_URL environment variable is required for recording callbacks');
  }
  
  if (!baseUrl.startsWith('https://')) {
    throw new Error('PUBLIC_BASE_URL must use HTTPS (Twilio requirement)');
  }
  
  // Warn about common development mistakes
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    console.warn('Warning: PUBLIC_BASE_URL contains localhost/127.0.0.1 - this will not work with Twilio webhooks');
  }
  
  return `${baseUrl}/api/webhooks/twilio/recording`;
}

/**
 * Generate TwiML for IVR menus and call handling
 */
export function generateTwiML(options: {
  say?: string;
  hangup?: boolean;
  gather?: {
    numDigits?: number;
    timeout?: number;
    action?: string;
    method?: string;
    options?: Array<{
      digit: string;
      action: {
        type: string;
        target?: string;
        queueSid?: string;
        menuId?: string;
      };
    }>;
  };
  timeoutAction?: {
    type: string;
    target?: string;
  };
  invalidAction?: {
    type: string;
    target?: string;
  };
}): string {
  let twiml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n';

  // Add Say element
  if (options.say) {
    twiml += `  <Say voice="alice">${options.say}</Say>\n`;
  }

  // Add Gather element with options
  if (options.gather) {
    const { numDigits = 1, timeout = 5, action, method = "POST", options: menuOptions } = options.gather;
    twiml += `  <Gather numDigits="${numDigits}" timeout="${timeout}" action="${action}" method="${method}">\n`;
    
    if (menuOptions) {
      for (const option of menuOptions) {
        twiml += `    <Say voice="alice">Press ${option.digit}</Say>\n`;
      }
    }
    
    twiml += '  </Gather>\n';
  }

  // Add timeout action
  if (options.timeoutAction) {
    if (options.timeoutAction.type === 'hangup') {
      twiml += '  <Hangup />\n';
    } else if (options.timeoutAction.type === 'transfer' && options.timeoutAction.target) {
      twiml += `  <Dial>${options.timeoutAction.target}</Dial>\n`;
    }
  }

  // Add invalid action
  if (options.invalidAction) {
    if (options.invalidAction.type === 'hangup') {
      twiml += '  <Hangup />\n';
    } else if (options.invalidAction.type === 'transfer' && options.invalidAction.target) {
      twiml += `  <Dial>${options.invalidAction.target}</Dial>\n`;
    }
  }

  // Add hangup if specified
  if (options.hangup) {
    twiml += '  <Hangup />\n';
  }

  twiml += '</Response>';
  return twiml;
}

/**
 * Generate TwiML for basic call handling
 */
export function generateBasicTwiML(): string {
  const recordingCallback = getRecordingCallbackUrl();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Please hold while we connect you to an available agent.</Say>
  <Dial timeout="30" timeLimit="3600">
    <Number>${process.env.TWILIO_AGENT_PHONE || '+1234567890'}</Number>
  </Dial>
  <Say voice="alice">We're sorry, but no agents are available at the moment. Please leave a message after the beep.</Say>
  <Record maxLength="300" finishOnKey="#" action="${recordingCallback}" />
  <Say voice="alice">Thank you for your message. We will get back to you as soon as possible.</Say>
  <Hangup />
</Response>`;
}

/**
 * Generate TwiML for voicemail routing
 */
export function generateVoicemailTwiML(): string {
  const recordingCallback = getRecordingCallbackUrl();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">You have reached our voicemail system. Please leave your message after the beep.</Say>
  <Record maxLength="300" finishOnKey="#" action="${recordingCallback}" />
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
  recordingStatusCallback?: string;
  timeout?: number;
  timeLimit?: number;
}): string {
  const { to, from, recordingStatusCallback, timeout = 30, timeLimit = 3600 } = opts;
  
  // Use provided callback or get from environment
  const callbackUrl = recordingStatusCallback || getRecordingCallbackUrl();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Please hold while we connect you to an available agent.</Say>
  <Dial timeout="${timeout}" timeLimit="${timeLimit}" record="record-from-answer-dual" recordingStatusCallback="${callbackUrl}" recordingChannels="dual" callerId="${from}">
    <Number>${to}</Number>
  </Dial>
  <Say voice="alice">We're sorry, but no agents are available at the moment. Please leave a message after the beep.</Say>
  <Record maxLength="300" finishOnKey="#" action="${callbackUrl}" recordingChannels="dual" />
  <Say voice="alice">Thank you for your message. We will get back to you as soon as possible.</Say>
  <Hangup />
</Response>`;
}

/**
 * Generate TwiML for TaskRouter Enqueue
 */
export function generateEnqueueTwiML(
  queueSid: string,
  message?: string,
  workflowSid?: string,
  taskAttributes?: Record<string, any>
): string {
  const taskPayload = taskAttributes ? JSON.stringify(taskAttributes) : JSON.stringify({ origin: "ivr" });
  
  let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>`;
  
  if (message) {
    twiml += `\n  <Say voice="alice">${message}</Say>`;
  }
  
  twiml += `\n  <Enqueue`;
  
  if (workflowSid) {
    twiml += ` workflowSid="${workflowSid}"`;
  }
  
  twiml += ` taskQueueSid="${queueSid}">`;
  twiml += `\n    <Task>${taskPayload}</Task>`;
  twiml += `\n  </Enqueue>`;
  twiml += `\n</Response>`;
  
  return twiml;
}

/**
 * Generate TwiML for redirecting to another URL
 */
export function generateRedirectTwiML(url: string, method: string = "POST"): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="${method}">${url}</Redirect>
</Response>`;
}
