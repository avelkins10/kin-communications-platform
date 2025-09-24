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
}

export interface InboundMessageWebhook extends TwilioWebhookBase {
  MessageSid: string;
  From: string;
  To: string;
  Body?: string;
  NumMedia?: string;
}


