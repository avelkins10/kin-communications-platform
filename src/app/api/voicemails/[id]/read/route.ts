import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { voicemailReadStatusSchema } from '@/lib/validations/voicemail';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = voicemailReadStatusSchema.parse(body);

    // Check if voicemail exists
    const existingVoicemail = await db.voicemail.findUnique({
      where: { id: id },
    });

    if (!existingVoicemail) {
      return NextResponse.json(
        { error: 'Voicemail not found' },
        { status: 404 }
      );
    }

    // Check authorization - user can only update voicemails assigned to them or if they're admin
    if (session.user.role !== 'admin' && existingVoicemail.assignedToId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the voicemail read status
    const updateData: any = {};

    // Set readAt timestamp based on isRead flag
    if (validatedData.isRead) {
      updateData.readAt = new Date();
    } else {
      updateData.readAt = null;
    }

    const voicemail = await db.voicemail.update({
      where: { id: id },
      data: updateData,
      include: {
        call: {
          select: {
            id: true,
            direction: true,
            status: true,
            fromNumber: true,
            toNumber: true,
            startedAt: true,
            endedAt: true,
            durationSec: true,
            twilioCallSid: true,
          },
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            organization: true,
            phone: true,
            email: true,
            type: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'Voicemail read status updated successfully',
      voicemail,
    });
  } catch (error) {
    console.error('Error updating voicemail read status:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update voicemail read status' },
      { status: 500 }
    );
  }
}
