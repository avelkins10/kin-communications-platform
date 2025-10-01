import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateVoicemailSchema } from '@/lib/validations/voicemail';
import {
  broadcastVoicemailUpdated
} from '@/lib/socket/events';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const voicemail = await db.voicemail.findUnique({
      where: { id: id },
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
            recordingUrl: true,
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

    if (!voicemail) {
      return NextResponse.json(
        { error: 'Voicemail not found' },
        { status: 404 }
      );
    }

    // Check authorization - user can only access voicemails assigned to them or if they're admin
    if (session.user.role !== 'admin' && voicemail.assignedToId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(voicemail);
  } catch (error) {
    console.error('Error fetching voicemail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voicemail' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const body = await request.json();
    const validatedData = updateVoicemailSchema.parse(body);

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

    // Handle readAt timestamp updates
    const updateData: any = { ...validatedData };
    if (validatedData.readAt !== undefined) {
      if (validatedData.readAt === null) {
        updateData.readAt = null; // Mark as unread
      } else {
        updateData.readAt = new Date(validatedData.readAt); // Mark as read with timestamp
      }
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

    // Broadcast voicemail updated event
    broadcastVoicemailUpdated({
      id: voicemail.id,
      callerId: voicemail.fromNumber,
      callerName: voicemail.contact?.firstName && voicemail.contact?.lastName ?
        `${voicemail.contact.firstName} ${voicemail.contact.lastName}` : undefined,
      duration: voicemail.duration || 0,
      recordingUrl: voicemail.audioUrl,
      status: voicemail.readAt ? 'read' : 'new',
      assignedTo: voicemail.assignedToId,
      assignedToName: voicemail.assignedTo?.name,
      department: voicemail.contact?.organization,
      priority: voicemail.priority.toLowerCase() as any,
      oldStatus: existingVoicemail.readAt ? 'read' : 'new',
      oldAssignedTo: existingVoicemail.assignedToId,
      createdAt: voicemail.createdAt.toISOString(),
      updatedAt: voicemail.updatedAt.toISOString()
    });

    return NextResponse.json(voicemail);
  } catch (error) {
    console.error('Error updating voicemail:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update voicemail' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

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

    // Check authorization - only admins can delete voicemails
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await db.voicemail.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Voicemail deleted successfully' });
  } catch (error) {
    console.error('Error deleting voicemail:', error);
    return NextResponse.json(
      { error: 'Failed to delete voicemail' },
      { status: 500 }
    );
  }
}
