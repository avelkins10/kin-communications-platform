import { NextRequest } from 'next/server';
import { withWebhookSecurity } from '@/lib/api/webhook-handler';
import { statusWebhookSchema } from '@/lib/validations/call';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  return withWebhookSecurity(req, async (params) => {
    // Validate webhook payload
    const webhookData = statusWebhookSchema.parse({
      CallSid: params.get('CallSid'),
      CallStatus: params.get('CallStatus'),
      From: params.get('From'),
      To: params.get('To'),
      Timestamp: params.get('Timestamp'),
      CallDuration: params.get('CallDuration'),
      Direction: params.get('Direction'),
      AccountSid: params.get('AccountSid'),
      ApiVersion: params.get('ApiVersion'),
    });

    console.log('Call status webhook received:', webhookData);

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

    // Map Twilio status to our CallStatus enum
    const statusMap: Record<string, 'PENDING' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'MISSED' | 'VOICEMAIL'> = {
      'queued': 'PENDING',
      'ringing': 'RINGING',
      'in-progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'busy': 'FAILED',
      'failed': 'FAILED',
      'no-answer': 'MISSED',
      'canceled': 'FAILED',
    };

    const newStatus = statusMap[webhookData.CallStatus] || 'FAILED';

    // Calculate duration if provided
    let durationSec: number | null = null;
    if (webhookData.CallDuration) {
      durationSec = parseInt(webhookData.CallDuration, 10);
    }

    // Update call record
    const updateData: any = {
      status: newStatus,
    };

    // Set startedAt when call becomes in-progress
    if (webhookData.CallStatus === 'in-progress' && !call.startedAt) {
      updateData.startedAt = new Date();
    }

    // Set endedAt and duration when call completes
    if (['completed', 'busy', 'failed', 'no-answer', 'canceled'].includes(webhookData.CallStatus)) {
      updateData.endedAt = new Date();
      if (durationSec !== null) {
        updateData.durationSec = durationSec;
      }
    }

    await prisma.call.update({
      where: {
        id: call.id,
      },
      data: updateData,
    });

    console.log(`Updated call ${call.id} status to ${newStatus}`);

    return;
  });
}
