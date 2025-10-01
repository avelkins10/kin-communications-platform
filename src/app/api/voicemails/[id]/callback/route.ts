import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getTwilioClient } from '@/lib/twilio/client';
import { CallDirection, CallStatus } from '@/types';
import { isTestMode, executeIfNotTestMode, generateMockTwilioCallSid, logTestModeActivity } from '@/lib/test-mode';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params since it's now a Promise in Next.js 15
    const { id } = await params

    // Get the voicemail
    const voicemail = await db.voicemail.findUnique({
      where: { id },
      include: {
        call: true,
        contact: true,
        assignedTo: true,
      },
    });

    if (!voicemail) {
      return NextResponse.json(
        { error: 'Voicemail not found' },
        { status: 404 }
      );
    }

    // Check authorization - user can only callback voicemails assigned to them or if they're admin
    if (session.user.role !== 'admin' && voicemail.assignedToId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get the user's phone number for the callback
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        phoneNumbers: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!user?.phoneNumbers?.[0]) {
      return NextResponse.json(
        { error: 'No active phone number found for user' },
        { status: 400 }
      );
    }

    const fromNumber = user.phoneNumbers[0].phoneNumber;
    const toNumber = voicemail.fromNumber;

    // Validate phone numbers
    if (!fromNumber || !toNumber) {
      return NextResponse.json(
        { error: 'Invalid phone numbers for callback' },
        { status: 400 }
      );
    }

    // Create a new outbound call using Twilio (or mock in test mode)
    const call = await executeIfNotTestMode(
      async () => {
        const twilioClient = getTwilioClient();
        return await twilioClient.calls.create({
          from: fromNumber,
          to: toNumber,
          url: `${process.env.NEXTAUTH_URL}/api/twiml/outbound`,
          statusCallback: `${process.env.NEXTAUTH_URL}/api/webhooks/twilio/status`,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
          record: true,
          recordingStatusCallback: `${process.env.NEXTAUTH_URL}/api/webhooks/twilio/recording`,
        });
      },
      {
        sid: generateMockTwilioCallSid(),
        status: 'ringing',
        direction: 'outbound',
        from: fromNumber,
        to: toNumber,
        startTime: new Date().toISOString(),
      }
    );

    // Create a new call record in the database
    const newCall = await db.call.create({
      data: {
        direction: CallDirection.OUTBOUND,
        status: CallStatus.PENDING,
        fromNumber,
        toNumber,
        twilioCallSid: call.sid,
        userId: session.user.id,
        contactId: voicemail.contactId,
      },
    });

    // Update the voicemail to track callback attempts
    await db.voicemail.update({
      where: { id: params.id },
      data: {
        notes: voicemail.notes 
          ? `${voicemail.notes}\n\nCallback initiated on ${new Date().toISOString()}`
          : `Callback initiated on ${new Date().toISOString()}`,
      },
    });

    logTestModeActivity('Twilio', 'Callback initiated', {
      voicemailId: params.id,
      fromNumber,
      toNumber,
      callSid: call.sid
    });

    return NextResponse.json({
      message: isTestMode() ? 'Callback initiated successfully (TEST_MODE)' : 'Callback initiated successfully',
      call: {
        id: newCall.id,
        twilioCallSid: call.sid,
        fromNumber,
        toNumber,
        status: CallStatus.PENDING,
      },
    });
  } catch (error) {
    console.error('Error initiating callback:', error);
    
    // Handle Twilio-specific errors
    if (error instanceof Error && error.message.includes('Twilio')) {
      return NextResponse.json(
        { error: 'Failed to initiate callback via Twilio' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initiate callback' },
      { status: 500 }
    );
  }
}
