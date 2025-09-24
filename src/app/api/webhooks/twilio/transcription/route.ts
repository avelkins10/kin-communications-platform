import { NextRequest } from 'next/server';
import { withWebhookSecurity } from '@/lib/api/webhook-handler';
import { transcriptionWebhookSchema } from '@/lib/validations/call';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  return withWebhookSecurity(req, async (params) => {
    // Validate webhook payload
    const webhookData = transcriptionWebhookSchema.parse({
      CallSid: params.get('CallSid'),
      TranscriptionSid: params.get('TranscriptionSid'),
      TranscriptionText: params.get('TranscriptionText'),
      TranscriptionStatus: params.get('TranscriptionStatus'),
      TranscriptionUrl: params.get('TranscriptionUrl'),
      RecordingSid: params.get('RecordingSid'),
      AccountSid: params.get('AccountSid'),
      ApiVersion: params.get('ApiVersion'),
    });

    console.log('Transcription webhook received:', webhookData);

    // Find the call record by Twilio CallSid
    const call = await prisma.call.findUnique({
      where: {
        twilioCallSid: webhookData.CallSid,
      },
    });

    if (!call) {
      console.error('Call not found for CallSid:', webhookData.CallSid);
      return;
    }

    // Only process completed transcriptions
    if (webhookData.TranscriptionStatus === 'completed' && webhookData.TranscriptionText) {
      // Update call record with transcription
      await prisma.call.update({
        where: {
          id: call.id,
        },
        data: {
          transcription: webhookData.TranscriptionText,
        },
      });

      console.log(`Updated call ${call.id} with transcription`);

      // If this is a voicemail transcription, update the voicemail record
      const voicemail = await prisma.voicemail.findUnique({
        where: {
          callId: call.id,
        },
      });

      if (voicemail) {
        await prisma.voicemail.update({
          where: {
            id: voicemail.id,
          },
          data: {
            transcription: webhookData.TranscriptionText,
          },
        });

        console.log(`Updated voicemail ${voicemail.id} with transcription`);
      }
    }

    return;
  });
}
