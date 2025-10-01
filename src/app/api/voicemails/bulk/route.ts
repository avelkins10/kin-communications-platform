import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { voicemailBulkActionSchema } from '@/lib/validations/voicemail';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = voicemailBulkActionSchema.parse(body);

    const { action, voicemailIds, assignedToId, priority } = validatedData;

    // Get all voicemails to check permissions
    const voicemails = await db.voicemail.findMany({
      where: {
        id: { in: voicemailIds },
      },
    });

    if (voicemails.length === 0) {
      return NextResponse.json(
        { error: 'No voicemails found' },
        { status: 404 }
      );
    }

    // Check authorization for each voicemail
    const unauthorizedVoicemails = voicemails.filter(voicemail => 
      session.user.role !== 'admin' && voicemail.assignedToId !== session.user.id
    );

    if (unauthorizedVoicemails.length > 0) {
      return NextResponse.json(
        { 
          error: 'Forbidden - You can only perform bulk operations on voicemails assigned to you',
          unauthorizedIds: unauthorizedVoicemails.map(v => v.id)
        },
        { status: 403 }
      );
    }

    let results: any = {
      success: 0,
      failed: 0,
      errors: [],
    };

    // Perform bulk operations in a transaction
    await db.$transaction(async (tx) => {
      for (const voicemailId of voicemailIds) {
        try {
          let updateData: any = {};

          switch (action) {
            case 'mark_read':
              updateData = {
                readAt: new Date(),
              };
              break;

            case 'mark_unread':
              updateData = {
                readAt: null,
              };
              break;

            case 'assign':
              if (!assignedToId) {
                throw new Error('assignedToId is required for assign action');
              }
              
              // Verify the target user exists
              const targetUser = await tx.user.findUnique({
                where: { id: assignedToId },
              });

              if (!targetUser) {
                throw new Error(`Target user ${assignedToId} not found`);
              }

              updateData = {
                assignedToId,
                notes: `Bulk assigned to ${targetUser.name || targetUser.email} on ${new Date().toISOString()}`,
              };
              break;

            case 'set_priority':
              if (!priority) {
                throw new Error('priority is required for set_priority action');
              }
              updateData = { priority };
              break;

            case 'delete':
              // Only admins can delete voicemails
              if (session.user.role !== 'admin') {
                throw new Error('Admin access required for delete action');
              }
              await tx.voicemail.delete({
                where: { id: voicemailId },
              });
              results.success++;
              continue;

            default:
              throw new Error(`Unknown action: ${action}`);
          }

          // Update the voicemail
          await tx.voicemail.update({
            where: { id: voicemailId },
            data: updateData,
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            voicemailId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    });

    return NextResponse.json({
      message: `Bulk operation completed: ${action}`,
      results,
    });
  } catch (error) {
    console.error('Error performing bulk voicemail operation:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
