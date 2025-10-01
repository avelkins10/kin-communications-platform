import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { quickbaseService } from '@/lib/quickbase/service';
import { verifyTwilioSignature } from '@/lib/api/webhook-handler';
import * as Sentry from '@sentry/nextjs';
import { cuid } from '@paralleldrive/cuid2';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Verify Twilio signature for security
    const signature = req.headers.get('X-Twilio-Signature');
    const url = req.url;

    if (signature && !verifyTwilioSignature({ url, params: formData, signature })) {
      console.error('Invalid Twilio signature for SMS webhook');
      return new Response('Unauthorized', { status: 401 });
    }

    const messageSid = formData.get('MessageSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string || '';
    const numMedia = parseInt(formData.get('NumMedia') as string || '0');
    const messageStatus = formData.get('SmsStatus') as string || 'received';

    console.log('SMS webhook received:', { messageSid, from, to, body, numMedia });

    // Idempotency check - prevent duplicate processing
    const existingMessage = await prisma.message.findUnique({
      where: { twilioMessageSid: messageSid }
    });

    if (existingMessage) {
      console.log('Message already processed:', messageSid);
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Find or create contact
    let contact = await prisma.contact.findFirst({
      where: { phone: from }
    });

    if (!contact) {
      // Create new contact for unknown numbers
      contact = await prisma.contact.create({
        data: {
          id: cuid(),
          phone: from,
          firstName: 'Unknown',
          lastName: 'Contact',
          type: 'CUSTOMER'
        }
      });
      console.log('Created new contact:', contact.id);
    }

    // Find phone number record
    const phoneNumber = await prisma.phoneNumber.findUnique({
      where: { phoneNumber: to }
    });

    // Collect media URLs if present
    const mediaUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = formData.get(`MediaUrl${i}`);
      if (mediaUrl) {
        mediaUrls.push(mediaUrl as string);
      }
    }

    // Create message record
    const message = await prisma.message.create({
      data: {
        id: cuid(),
        direction: 'INBOUND',
        status: messageStatus === 'received' ? 'DELIVERED' : 'QUEUED',
        fromNumber: from,
        toNumber: to,
        body: body,
        mediaUrls: mediaUrls,
        twilioMessageSid: messageSid,
        contactId: contact.id,
        phoneNumberId: phoneNumber?.id,
        sentAt: new Date(),
        deliveredAt: messageStatus === 'received' ? new Date() : null,
        numSegments: 1
      }
    });

    console.log('Created message record:', message.id);

    // Log to QuickBase if enabled
    if (process.env.QUICKBASE_ENABLED !== 'false') {
      try {
        const messageWithRelations = await prisma.message.findUnique({
          where: { id: message.id },
          include: { Contact: true, User: true }
        });

        if (messageWithRelations) {
          await quickbaseService.logSMSToQuickbase(
            messageWithRelations as any,
            messageWithRelations.Contact!,
            messageWithRelations.User || undefined
          );
          console.log('Logged SMS to QuickBase:', message.id);
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { component: 'sms-webhook', action: 'quickbase-logging' },
          extra: { messageId: message.id }
        });
        console.error('Failed to log SMS to QuickBase:', error);
      }
    }

    // Return empty TwiML response (no auto-reply)
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('SMS webhook error:', error);
    Sentry.captureException(error, {
      tags: { component: 'sms-webhook', action: 'process-inbound' }
    });

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 500,
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}