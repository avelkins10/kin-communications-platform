import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  updateMessageSchema,
  type UpdateMessageInput
} from "@/lib/validations/message";

// GET /api/messages/[id] - Get a single message
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const message = await db.message.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            body: true,
            variables: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error fetching message:", error);
    return NextResponse.json(
      { error: "Failed to fetch message" },
      { status: 500 }
    );
  }
}

// PUT /api/messages/[id] - Update a message
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const body = await request.json();
    const validatedData = updateMessageSchema.parse(body);

    // Check if message exists and user has access
    const existingMessage = await db.message.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Update message
    const updatedMessage = await db.message.update({
      where: { id: id },
      data: validatedData,
      include: {
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[id] - Delete a message (soft delete by marking as failed)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if message exists and user has access
    const existingMessage = await db.message.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // For audit trail, we'll mark as failed rather than hard delete
    // In a production system, you might want to add a deletedAt field for soft deletes
    await db.message.update({
      where: { id: id },
      data: {
        status: "FAILED",
        errorMessage: "Message deleted by user",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
