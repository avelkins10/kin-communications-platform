import { NextRequest } from 'next/server';
import { withWebhookSecurity } from '@/lib/api/webhook-handler';
import { voiceWebhookSchema } from '@/lib/validations/call';
import { answerWithRecording } from '@/lib/twilio/twiml';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  return withWebhookSecurity(req, async (params) => {
    // Validate webhook payload
    const webhookData = voiceWebhookSchema.parse({
      CallSid: params.get('CallSid'),
      From: params.get('From'),
      To: params.get('To'),
      CallStatus: params.get('CallStatus'),
      Direction: params.get('Direction'),
      CallerName: params.get('CallerName'),
      CallerCity: params.get('CallerCity'),
      CallerState: params.get('CallerState'),
      CallerCountry: params.get('CallerCountry'),
      CallerZip: params.get('CallerZip'),
      CalledCity: params.get('CalledCity'),
      CalledState: params.get('CalledState'),
      CalledCountry: params.get('CalledCountry'),
      CalledZip: params.get('CalledZip'),
      AccountSid: params.get('AccountSid'),
      ApiVersion: params.get('ApiVersion'),
    });

    console.log('Inbound voice webhook received:', webhookData);

    // Look up contact by phone number
    let contact = null;
    if (webhookData.Direction === 'inbound') {
      contact = await prisma.contact.findFirst({
        where: {
          phone: webhookData.From,
        },
      });
    }

    // Create call record
    const call = await prisma.call.create({
      data: {
        direction: webhookData.Direction.toUpperCase() as 'INBOUND' | 'OUTBOUND',
        status: 'RINGING',
        fromNumber: webhookData.From,
        toNumber: webhookData.To,
        twilioCallSid: webhookData.CallSid,
        contactId: contact?.id,
        startedAt: new Date(),
      },
    });

    console.log('Created call record:', call.id);

    // Return TwiML with dual-channel recording
    const twiml = answerWithRecording({
      to: process.env.TWILIO_AGENT_PHONE || '+1234567890',
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      recordingStatusCallback: `${process.env.PUBLIC_BASE_URL}/api/webhooks/twilio/recording`
    });

    return new Response(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  });
}
