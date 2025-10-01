import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  updateMessageTemplateSchema,
  type UpdateMessageTemplateInput
} from "@/lib/validations/message";

// GET /api/message-templates/[id] - Get a single message template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params since it's now a Promise in Next.js 15
    const { id } = await params

    const template = await db.messageTemplate.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          { isShared: true },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching message template:", error);
    return NextResponse.json(
      { error: "Failed to fetch message template" },
      { status: 500 }
    );
  }
}

// PUT /api/message-templates/[id] - Update a message template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params since it's now a Promise in Next.js 15
    const { id } = await params

    const body = await request.json();
    const validatedData = updateMessageTemplateSchema.parse(body);

    // Check if template exists and user has permission to edit
    const existingTemplate = await db.messageTemplate.findFirst({
      where: {
        id: id,
        userId: session.user.id, // Only allow editing own templates
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
    }

    // Check if new name conflicts with existing template
    if (validatedData.name && validatedData.name !== existingTemplate.name) {
      const nameConflict = await db.messageTemplate.findFirst({
        where: {
          name: validatedData.name,
          userId: session.user.id,
          id: { not: id },
        },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "Template name already exists" },
          { status: 409 }
        );
      }
    }

    // Update template
    const updatedTemplate = await db.messageTemplate.update({
      where: { id: id },
      data: validatedData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating message template:", error);
    return NextResponse.json(
      { error: "Failed to update message template" },
      { status: 500 }
    );
  }
}

// DELETE /api/message-templates/[id] - Delete a message template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params since it's now a Promise in Next.js 15
    const { id } = await params

    // Check if template exists and user has permission to delete
    const existingTemplate = await db.messageTemplate.findFirst({
      where: {
        id: id,
        userId: session.user.id, // Only allow deleting own templates
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found or access denied" }, { status: 404 });
    }

    // Check if template is being used by any messages
    const messageCount = await db.message.count({
      where: {
        templateId: id,
      },
    });

    if (messageCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete template that is being used by messages" },
        { status: 409 }
      );
    }

    // Delete template
    await db.messageTemplate.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message template:", error);
    return NextResponse.json(
      { error: "Failed to delete message template" },
      { status: 500 }
    );
  }
}
