/**
 * Voice Calling Setup Template for Phase 3
 * KIN Communications Platform
 * 
 * This template provides a complete setup for voice calling functionality
 * using Twilio's Node.js SDK and Voice SDK.
 */

import twilio from 'twilio';
import { Twilio } from 'twilio';

// Types
interface CallOptions {
  to: string;
  from: string;
  url?: string;
  twiml?: string;
  record?: boolean;
  recordingStatusCallback?: string;
  statusCallback?: string;
  statusCallbackEvent?: string[];
}

interface VoiceDeviceOptions {
  edge?: string;
  sounds?: {
    incoming?: string;
    outgoing?: string;
    disconnect?: string;
  };
  enableImprovedSignalingErrorPrecision?: boolean;
}

// Server-side Voice Calling Service
export class VoiceCallingService {
  private client: Twilio;
  private accountSid: string;
  private authToken: string;
  private applicationSid: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID!;
    this.authToken = process.env.TWILIO_AUTH_TOKEN!;
    this.applicationSid = process.env.TWILIO_APPLICATION_SID!;
    
    if (!this.accountSid || !this.authToken || !this.applicationSid) {
      throw new Error('Missing required Twilio environment variables');
    }

    this.client = twilio(this.accountSid, this.authToken);
  }

  /**
   * Create an outbound call
   */
  async createOutboundCall(options: CallOptions) {
    try {
      const call = await this.client.calls.create({
        to: options.to,
        from: options.from,
        url: options.url,
        twiml: options.twiml,
        record: options.record || false,
        recordingStatusCallback: options.recordingStatusCallback,
        statusCallback: options.statusCallback || `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/call-status`,
        statusCallbackEvent: options.statusCallbackEvent || ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      });

      return {
        success: true,
        callSid: call.sid,
        status: call.status,
        direction: call.direction,
        from: call.from,
        to: call.to,
        startTime: call.startTime,
        endTime: call.endTime
      };
    } catch (error) {
      console.error('Error creating outbound call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get call details
   */
  async getCallDetails(callSid: string) {
    try {
      const call = await this.client.calls(callSid).fetch();
      return {
        success: true,
        call: {
          sid: call.sid,
          status: call.status,
          direction: call.direction,
          from: call.from,
          to: call.to,
          startTime: call.startTime,
          endTime: call.endTime,
          duration: call.duration,
          price: call.price,
          priceUnit: call.priceUnit
        }
      };
    } catch (error) {
      console.error('Error fetching call details:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Hangup a call
   */
  async hangupCall(callSid: string) {
    try {
      const call = await this.client.calls(callSid).update({ status: 'completed' });
      return {
        success: true,
        callSid: call.sid,
        status: call.status
      };
    } catch (error) {
      console.error('Error hanging up call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate access token for Voice SDK
   */
  generateVoiceToken(identity: string, ttl: number = 3600) {
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: this.applicationSid,
      incomingAllow: true
    });

    const token = new AccessToken(
      this.accountSid,
      process.env.TWILIO_API_KEY_SID!,
      process.env.TWILIO_API_KEY_SECRET!,
      { identity, ttl }
    );

    token.addGrant(voiceGrant);
    return token.toJwt();
  }
}

// Client-side Voice Device Manager
export class VoiceDeviceManager {
  private device: any;
  private token: string;
  private options: VoiceDeviceOptions;

  constructor(token: string, options: VoiceDeviceOptions = {}) {
    this.token = token;
    this.options = options;
    this.initializeDevice();
  }

  private initializeDevice() {
    // Note: This would be used in a browser environment
    // The actual Twilio.Device would be imported from @twilio/voice-sdk
    /*
    this.device = new Twilio.Device(this.token, this.options);
    
    this.device.on('registered', () => {
      console.log('Device registered successfully');
    });

    this.device.on('error', (error: any) => {
      console.error('Device error:', error);
    });

    this.device.on('incoming', (call: any) => {
      console.log('Incoming call:', call);
      this.handleIncomingCall(call);
    });

    this.device.on('tokenWillExpire', () => {
      console.log('Token will expire, refreshing...');
      this.refreshToken();
    });
    */
  }

  /**
   * Make an outgoing call
   */
  async makeCall(to: string, params: Record<string, any> = {}) {
    try {
      /*
      const call = await this.device.connect({
        params: {
          To: to,
          ...params
        }
      });

      call.on('accept', () => {
        console.log('Call accepted');
      });

      call.on('disconnect', () => {
        console.log('Call disconnected');
      });

      call.on('error', (error: any) => {
        console.error('Call error:', error);
      });

      return {
        success: true,
        call: call
      };
      */
      return {
        success: true,
        call: null // Placeholder for browser implementation
      };
    } catch (error) {
      console.error('Error making call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle incoming call
   */
  private handleIncomingCall(call: any) {
    // Implement incoming call handling logic
    console.log('Handling incoming call:', call);
  }

  /**
   * Refresh access token
   */
  private async refreshToken() {
    try {
      // Make API call to get new token
      const response = await fetch('/api/voice/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        this.device.updateToken(data.token);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  /**
   * Destroy device
   */
  destroy() {
    if (this.device) {
      this.device.destroy();
    }
  }
}

// Webhook Handlers
export class VoiceWebhookHandlers {
  /**
   * Handle call status webhook
   */
  static handleCallStatus(req: any, res: any) {
    const { CallSid, CallStatus, CallDuration, From, To } = req.body;

    console.log(`Call ${CallSid} status: ${CallStatus}`);

    switch (CallStatus) {
      case 'initiated':
        console.log('Call initiated');
        break;
      case 'ringing':
        console.log('Call ringing');
        break;
      case 'answered':
        console.log('Call answered');
        break;
      case 'completed':
        console.log(`Call completed. Duration: ${CallDuration} seconds`);
        break;
      case 'failed':
        console.log('Call failed');
        break;
      case 'busy':
        console.log('Call busy');
        break;
      case 'no-answer':
        console.log('Call no answer');
        break;
      default:
        console.log(`Unknown call status: ${CallStatus}`);
    }

    res.status(200).send('OK');
  }

  /**
   * Handle recording status webhook
   */
  static handleRecordingStatus(req: any, res: any) {
    const { CallSid, RecordingSid, RecordingStatus, RecordingUrl } = req.body;

    console.log(`Recording ${RecordingSid} for call ${CallSid}: ${RecordingStatus}`);

    if (RecordingStatus === 'completed') {
      console.log(`Recording available at: ${RecordingUrl}`);
      // Process recording (save to database, etc.)
    }

    res.status(200).send('OK');
  }
}

// Usage Examples
export const voiceCallingExamples = {
  // Server-side example
  async createCall() {
    const voiceService = new VoiceCallingService();
    
    const result = await voiceService.createOutboundCall({
      to: '+1234567890',
      from: '+0987654321',
      url: 'http://demo.twilio.com/docs/voice.xml',
      record: true,
      recordingStatusCallback: `${process.env.TWILIO_WEBHOOK_BASE_URL}/webhooks/recording-status`
    });

    if (result.success) {
      console.log('Call created:', result.callSid);
    } else {
      console.error('Call failed:', result.error);
    }
  },

  // Client-side example (browser)
  async initializeVoiceDevice() {
    // Get token from server
    const response = await fetch('/api/voice/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (data.success) {
      const deviceManager = new VoiceDeviceManager(data.token, {
        edge: 'ashburn',
        sounds: {
          incoming: '/sounds/incoming.wav',
          outgoing: '/sounds/outgoing.wav',
          disconnect: '/sounds/disconnect.wav'
        }
      });

      return deviceManager;
    }
  }
};

export default VoiceCallingService;
