import { NextRequest } from 'next/server';
import { withWebhookSecurity } from '@/lib/api/webhook-handler';
import { recordingWebhookSchema } from '@/lib/validations/call';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  return withWebhookSecurity(req, async (params) => {
    // Validate webhook payload
    const webhookData = recordingWebhookSchema.parse({
      CallSid: params.get('CallSid'),
      RecordingSid: params.get('RecordingSid'),
      RecordingUrl: params.get('RecordingUrl'),
      RecordingDuration: params.get('RecordingDuration'),
      RecordingChannels: params.get('RecordingChannels'),
      RecordingStatus: params.get('RecordingStatus'),
      RecordingStartTime: params.get('RecordingStartTime'),
      RecordingSource: params.get('RecordingSource'),
      AccountSid: params.get('AccountSid'),
      ApiVersion: params.get('ApiVersion'),
    });

    console.log('Recording webhook received:', webhookData);

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

    // Update call record with recording information
    const updateData: any = {
      recordingSid: webhookData.RecordingSid,
    };

    // Only update recording URL when recording is completed
    if (webhookData.RecordingStatus === 'completed' && webhookData.RecordingUrl) {
      updateData.recordingUrl = webhookData.RecordingUrl;
    }

    await prisma.call.update({
      where: {
        id: call.id,
      },
      data: updateData,
    });

    console.log(`Updated call ${call.id} with recording information`);

    // If this is a voicemail recording, create a voicemail record
    if (webhookData.RecordingStatus === 'completed' && webhookData.RecordingUrl) {
      // Check if this call ended as a voicemail
      const updatedCall = await prisma.call.findUnique({
        where: { id: call.id },
      });

      if (updatedCall?.status === 'VOICEMAIL' || updatedCall?.status === 'MISSED') {
        await prisma.voicemail.upsert({
          where: {
            callId: call.id,
          },
          update: {
            audioUrl: webhookData.RecordingUrl,
          },
          create: {
            callId: call.id,
            audioUrl: webhookData.RecordingUrl,
          },
        });

        console.log(`Created voicemail record for call ${call.id}`);
      }
    }

    return;
  });
}
