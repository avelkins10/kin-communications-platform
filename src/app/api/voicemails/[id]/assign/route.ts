import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { voicemailAssignmentSchema } from '@/lib/validations/voicemail';
import { sendVoicemailAssignmentNotification } from '@/lib/email/voicemail-notifications';

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
    const validatedData = voicemailAssignmentSchema.parse(body);

    // Check if voicemail exists
    const existingVoicemail = await db.voicemail.findUnique({
      where: { id: id },
      include: {
        assignedTo: true,
      },
    });

    if (!existingVoicemail) {
      return NextResponse.json(
        { error: 'Voicemail not found' },
        { status: 404 }
      );
    }

    // Check authorization - only admins can assign voicemails
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Verify the target user exists
    const targetUser = await db.user.findUnique({
      where: { id: validatedData.assignedToId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Update the voicemail assignment
    const updateData: any = {
      assignedToId: validatedData.assignedToId,
    };

    // Add assignment notes if provided
    if (validatedData.notes) {
      const assignmentNote = `Assigned to ${targetUser.name || targetUser.email} on ${new Date().toISOString()}: ${validatedData.notes}`;
      updateData.notes = existingVoicemail.notes 
        ? `${existingVoicemail.notes}\n\n${assignmentNote}`
        : assignmentNote;
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

    // Send email notification if requested
    if (validatedData.sendEmailNotification) {
      try {
        await sendVoicemailAssignmentNotification({
          voicemailId: voicemail.id,
          recipientEmail: targetUser.email,
          assignedBy: session.user.name || session.user.email || 'System',
          notes: validatedData.notes,
          voicemail: {
            id: voicemail.id,
            fromNumber: voicemail.fromNumber,
            duration: voicemail.duration,
            priority: voicemail.priority,
            transcription: voicemail.transcription,
            createdAt: voicemail.createdAt,
            contact: voicemail.contact,
          },
        });
        console.log(`Email notification sent to ${targetUser.email} for voicemail assignment`);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the assignment if email fails
      }
    }

    return NextResponse.json({
      message: 'Voicemail assigned successfully',
      voicemail,
    });
  } catch (error) {
    console.error('Error assigning voicemail:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to assign voicemail' },
      { status: 500 }
    );
  }
}
