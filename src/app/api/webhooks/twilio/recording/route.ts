import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withWebhookSecurity } from '@/lib/api/webhook-handler';
import { recordingWebhookSchema } from '@/lib/validations/call';
import { quickbaseService } from '@/lib/quickbase/service';
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
  // withWebhookSecurity handles signature validation, idempotency, and transaction wrapping
  return withWebhookSecurity(req, async (params) => {
    // Validate webhook payload
    const validatedData = recordingWebhookSchema.parse({
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

    const { 
      CallSid: callSid, 
      RecordingSid: recordingSid, 
      RecordingStatus: recordingStatus, 
      RecordingUrl: recordingUrl, 
      RecordingDuration: recordingDuration, 
      RecordingChannels: recordingChannels 
    } = validatedData;

    console.log('Recording webhook received:', {
      callSid,
      recordingSid,
      recordingStatus,
      recordingUrl,
      recordingDuration,
      recordingChannels
    });

    // Only process completed recordings
    if (recordingStatus !== 'completed') {
      console.log('Recording not completed yet, status:', recordingStatus);
      return;
    }

    // Validate recording URL
    if (!recordingUrl.startsWith('https://') || !recordingUrl.includes('api.twilio.com')) {
      console.warn('Suspicious recording URL:', recordingUrl);
    }

    // Find the call by Twilio CallSid
    const call = await prisma.call.findUnique({
      where: { twilioCallSid: callSid },
      include: { Contact: true }
    });

    if (!call) {
      console.error('Call not found for CallSid:', callSid);
      // Don't return error - Twilio will retry
      return;
    }

    // Check for duplicate recording URL (idempotency)
    if (call.recordingUrl === recordingUrl) {
      console.log('Recording URL already set for call:', callSid);
      return;
    }

    if (call.recordingUrl && call.recordingUrl !== recordingUrl) {
      console.warn('Conflicting recording URLs for call:', callSid, 'existing:', call.recordingUrl, 'new:', recordingUrl);
    }

    // Declare voicemail outside transaction so it's accessible later
    let voicemail: any = null;

    // Update the call with recording information using transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Update call record
      await tx.call.update({
        where: { id: call.id },
        data: {
          recordingUrl: recordingUrl,
          recordingSid: recordingSid,
          // Only update status if it's not already completed
          ...(call.status !== 'COMPLETED' && { status: 'COMPLETED' }),
        }
      });

      console.log(`Updated call ${call.id} with recording: ${recordingSid}`);

      // If this call was marked as voicemail or missed, create a voicemail record
      if (call.status === 'VOICEMAIL' || call.status === 'MISSED') {
        // Use upsert to prevent duplicate voicemail records
        voicemail = await tx.voicemail.upsert({
          where: { callId: call.id },
          update: {
            audioUrl: recordingUrl,
            duration: recordingDuration ? parseInt(recordingDuration) : null,
            updatedAt: new Date(),
          },
          create: {
            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            callId: call.id,
            audioUrl: recordingUrl,
            fromNumber: call.fromNumber,
            duration: recordingDuration ? parseInt(recordingDuration) : null,
            contactId: call.contactId,
            priority: 'NORMAL',
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });

        console.log(`Created/updated voicemail record for call ${call.id}`);
      }
    });

    console.log('Recording processed:', { callSid, recordingSid, duration: recordingDuration });

    // Quickbase communication logging (non-blocking)
    if (process.env.QUICKBASE_ENABLED !== 'false') {
      try {
        // Fetch the complete call record with relations for logging
        const callWithRelations = await prisma.call.findUnique({
          where: { id: call.id },
          include: { Contact: true, User: true }
        });

        if (callWithRelations) {
          // Log the call to Quickbase
          await quickbaseService.logCallToQuickbase(callWithRelations, callWithRelations.Contact || undefined, callWithRelations.User || undefined);
          
          Sentry.addBreadcrumb({
            category: 'quickbase',
            message: 'Call logged',
            level: 'info',
            data: { callSid }
          });
          console.log('Logged call to Quickbase:', callSid);

          // If this was a voicemail, also log the voicemail separately
          if (voicemail && callWithRelations.status === 'VOICEMAIL') {
            await quickbaseService.logVoicemailToQuickbase(voicemail, callWithRelations, callWithRelations.Contact || undefined, callWithRelations.User || undefined);
            console.log('Logged voicemail to Quickbase:', voicemail.id);
          }
        }
      } catch (error) {
        Sentry.addBreadcrumb({
          category: 'quickbase',
          message: 'Call logging failed',
          level: 'error',
          data: { callSid, error: error instanceof Error ? error.message : 'Unknown error' }
        });
        console.error('Failed to log call to Quickbase:', error);
        // Don't throw - logging failures should not break the webhook
      }
    }

    // Return void - withWebhookSecurity handles the response
    return;
  });
}