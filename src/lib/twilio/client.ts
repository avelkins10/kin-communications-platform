import { Twilio } from 'twilio';

// Twilio client singleton
let twilioClient: Twilio | null = null;

export function getTwilioClient(): Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        'Twilio credentials not found. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.'
      );
    }

    twilioClient = new Twilio(accountSid, authToken);
  }

  return twilioClient;
}

export default getTwilioClient;
