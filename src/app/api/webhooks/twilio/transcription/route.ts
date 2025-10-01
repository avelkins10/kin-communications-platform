import { NextRequest } from 'next/server';
import { withWebhookSecurity } from '@/lib/api/webhook-handler';
import { transcriptionWebhookSchema } from '@/lib/validations/call';
import { prisma } from '@/lib/db';
import { VoicemailPriority } from '@/types';
import { sendVoicemailTranscriptionNotification } from '@/lib/email/voicemail-notifications';

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
        include: {
          assignedTo: true,
          contact: true,
        },
      });

      if (voicemail) {
        // Analyze transcription for priority keywords
        const transcriptionText = webhookData.TranscriptionText.toLowerCase();
        let detectedPriority = voicemail.priority;

        // Check for urgent keywords
        const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'help'];
        const highKeywords = ['important', 'priority', 'soon', 'quickly'];
        
        if (urgentKeywords.some(keyword => transcriptionText.includes(keyword))) {
          detectedPriority = VoicemailPriority.URGENT;
        } else if (highKeywords.some(keyword => transcriptionText.includes(keyword))) {
          detectedPriority = VoicemailPriority.HIGH;
        }

        // Update voicemail with transcription and detected priority
        const updatedVoicemail = await prisma.voicemail.update({
          where: {
            id: voicemail.id,
          },
          data: {
            transcription: webhookData.TranscriptionText,
            priority: detectedPriority,
            notes: voicemail.notes 
              ? `${voicemail.notes}\n\nTranscription completed on ${new Date().toISOString()}`
              : `Transcription completed on ${new Date().toISOString()}`,
          },
          include: {
            assignedTo: true,
            contact: true,
          },
        });

        console.log(`Updated voicemail ${voicemail.id} with transcription and priority ${detectedPriority}`);

        // Send email notification with transcription to assigned user
        try {
          if (updatedVoicemail.assignedTo) {
            await sendVoicemailTranscriptionNotification({
              voicemailId: updatedVoicemail.id,
              recipientEmail: updatedVoicemail.assignedTo.email,
              transcription: webhookData.TranscriptionText,
              priority: detectedPriority,
              voicemail: {
                id: updatedVoicemail.id,
                fromNumber: updatedVoicemail.fromNumber,
                duration: updatedVoicemail.duration,
                createdAt: updatedVoicemail.createdAt,
                contact: updatedVoicemail.contact,
              },
            });
            console.log(`Transcription email sent to ${updatedVoicemail.assignedTo.email} for voicemail ${updatedVoicemail.id}`);
          }
        } catch (emailError) {
          console.error('Failed to send transcription notification:', emailError);
        }
      }
    }

    return;
  });
}
