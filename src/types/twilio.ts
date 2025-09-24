export interface TwilioWebhookBase {
  AccountSid: string;
  ApiVersion?: string;
}

export interface VoiceStatusCallback extends TwilioWebhookBase {
  CallSid: string;
  CallStatus: "queued" | "ringing" | "in-progress" | "busy" | "failed" | "no-answer" | "canceled" | "completed";
  From?: string;
  To?: string;
  Timestamp?: string;
  CallDuration?: string;
  Direction?: "inbound" | "outbound";
}

export interface VoiceWebhook extends TwilioWebhookBase {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: "inbound" | "outbound";
  CallerName?: string;
  CallerCity?: string;
  CallerState?: string;
  CallerCountry?: string;
  CallerZip?: string;
  CalledCity?: string;
  CalledState?: string;
  CalledCountry?: string;
  CalledZip?: string;
}

export interface RecordingWebhook extends TwilioWebhookBase {
  CallSid: string;
  RecordingSid: string;
  RecordingUrl: string;
  RecordingDuration: string;
  RecordingChannels: string;
  RecordingStatus: "in-progress" | "completed" | "absent";
  RecordingStartTime?: string;
  RecordingSource?: string;
}

export interface TranscriptionWebhook extends TwilioWebhookBase {
  CallSid: string;
  TranscriptionSid: string;
  TranscriptionText: string;
  TranscriptionStatus: "in-progress" | "completed" | "failed";
  TranscriptionUrl?: string;
  RecordingSid?: string;
}

export interface OutboundCallParams {
  to: string;
  from: string;
  statusCallback?: string;
  statusCallbackEvent?: string[];
  record?: boolean;
  recordingChannels?: "mono" | "dual";
  recordingStatusCallback?: string;
  twiml?: string;
  url?: string;
}

export interface CallControlAction {
  action: "mute" | "unmute" | "hold" | "unhold" | "hangup" | "transfer";
  to?: string; // For transfer action
}

export interface TwiMLResponse {
  say?: {
    voice?: string;
    language?: string;
    text: string;
  };
  play?: {
    url: string;
  };
  record?: {
    action?: string;
    method?: string;
    maxLength?: number;
    finishOnKey?: string;
    recordingStatusCallback?: string;
  };
  dial?: {
    number?: string;
    callerId?: string;
    timeout?: number;
    timeLimit?: number;
    record?: boolean;
  };
  hangup?: {};
  redirect?: {
    url: string;
    method?: string;
  };
}

export interface InboundMessageWebhook extends TwilioWebhookBase {
  MessageSid: string;
  From: string;
  To: string;
  Body?: string;
  NumMedia?: string;
}


