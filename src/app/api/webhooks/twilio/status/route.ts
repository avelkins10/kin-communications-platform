import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withWebhookSecurity } from '@/lib/api/webhook-handler';
import { statusWebhookSchema } from '@/lib/validations/call';
import { quickbaseService } from '@/lib/quickbase/service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  // withWebhookSecurity handles signature validation, idempotency, and transaction wrapping
  return withWebhookSecurity(req, async (params) => {
    // Validate webhook payload
    const validatedData = statusWebhookSchema.parse({
      CallSid: params.get('CallSid'),
      CallStatus: params.get('CallStatus'),
      From: params.get('From'),
      To: params.get('To'),
      Timestamp: params.get('Timestamp'),
      CallDuration: params.get('CallDuration'),
      Direction: params.get('Direction') as 'inbound' | 'outbound',
      AccountSid: params.get('AccountSid'),
      ApiVersion: params.get('ApiVersion'),
    });

    const { CallSid: callSid, CallStatus: callStatus, CallDuration: callDuration, Timestamp: timestamp } = validatedData;

    console.log('Status webhook received:', {
      callSid,
      callStatus,
      callDuration,
      timestamp
    });

    // Map Twilio call status to our internal status enum
    const statusMap: Record<string, string> = {
      'queued': 'PENDING',
      'initiated': 'PENDING',
      'ringing': 'RINGING',
      'in-progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'busy': 'FAILED',
      'no-answer': 'MISSED',
      'failed': 'FAILED',
      'canceled': 'FAILED',
    };

    const mappedStatus = statusMap[callStatus] || 'PENDING';

    // Find the call by Twilio CallSid
    const call = await prisma.call.findUnique({
      where: { twilioCallSid: callSid }
    });

    if (!call) {
      console.log('Call not found for CallSid:', callSid, '- may be created later');
      // Don't return error - call record might be created after this webhook
      return;
    }

    // Prepare update data
    const updateData: any = {
      status: mappedStatus,
    };

    // Set timestamps based on status
    if (callStatus === 'ringing' && !call.startedAt) {
      updateData.startedAt = new Date();
    }

    if (callStatus === 'in-progress' && !call.startedAt) {
      updateData.startedAt = new Date();
    }

    // For completed/failed/no-answer calls, set end time and duration
    if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(callStatus)) {
      updateData.endedAt = new Date();

      if (callDuration) {
        updateData.durationSec = parseInt(callDuration, 10);
      } else if (call.startedAt) {
        // Calculate duration if not provided
        const durationMs = updateData.endedAt.getTime() - call.startedAt.getTime();
        updateData.durationSec = Math.floor(durationMs / 1000);
      }
    }

    // Update the call with retry-safe logic
    await prisma.call.update({
      where: { id: call.id },
      data: updateData
    });

    console.log(`Updated call ${call.id} to status: ${mappedStatus}`, updateData);

    // Quickbase communication logging for completed calls (non-blocking)
    if (process.env.QUICKBASE_ENABLED !== 'false' && (mappedStatus === 'COMPLETED' || mappedStatus === 'FAILED' || mappedStatus === 'MISSED')) {
      try {
        // Fetch the complete call record with relations for logging
        const callWithRelations = await prisma.call.findUnique({
          where: { id: call.id },
          include: { Contact: true, User: true }
        });

        if (callWithRelations) {
          // Only log if call doesn't already have a recording URL (avoid duplicates with recording webhook)
          if (!callWithRelations.recordingUrl) {
            await quickbaseService.logCallToQuickbase(callWithRelations, callWithRelations.Contact, callWithRelations.User);
            
            Sentry.addBreadcrumb({
              category: 'quickbase',
              message: 'Call logged from status webhook',
              level: 'info',
              data: { callSid, status: mappedStatus }
            });
            console.log('Logged call to Quickbase from status webhook:', callSid);
          } else {
            console.log('Skipping Quickbase logging - call already has recording (logged by recording webhook)');
          }
        }
      } catch (error) {
        Sentry.addBreadcrumb({
          category: 'quickbase',
          message: 'Call logging failed from status webhook',
          level: 'error',
          data: { callSid, error: error instanceof Error ? error.message : 'Unknown error' }
        });
        console.error('Failed to log call to Quickbase from status webhook:', error);
        // Don't throw - logging failures should not break the webhook
      }
    }

    // Return void - withWebhookSecurity handles the response
    return;
  });
}