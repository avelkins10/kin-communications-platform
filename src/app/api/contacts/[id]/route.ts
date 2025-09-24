import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateContactSchema } from "@/lib/validations/contact";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
      include: {
        groups: {
          include: {
            group: true,
          },
        },
        calls: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...contact,
      groups: contact.groups.map((cg) => cg.group),
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateContactSchema.parse(body);

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Check for duplicate phone number if phone is being updated
    if (validatedData.phone && validatedData.phone !== existingContact.phone) {
      const duplicateContact = await prisma.contact.findFirst({
        where: {
          phone: validatedData.phone,
          ownerId: session.user.id,
          id: { not: params.id },
        },
      });

      if (duplicateContact) {
        return NextResponse.json(
          { error: "Contact with this phone number already exists" },
          { status: 409 }
        );
      }
    }

    // Update contact
    const updatedContact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        tags: validatedData.tags || undefined,
      },
      include: {
        groups: {
          include: {
            group: true,
          },
        },
      },
    });

    // Update groups if specified
    if (validatedData.groupIds !== undefined) {
      // Remove existing group memberships
      await prisma.contactGroupOnContact.deleteMany({
        where: { contactId: params.id },
      });

      // Add new group memberships
      if (validatedData.groupIds.length > 0) {
        await prisma.contactGroupOnContact.createMany({
          data: validatedData.groupIds.map((groupId) => ({
            contactId: params.id,
            groupId,
          })),
        });
      }

      // Fetch updated contact with groups
      const finalContact = await prisma.contact.findUnique({
        where: { id: params.id },
        include: {
          groups: {
            include: {
              group: true,
            },
          },
        },
      });

      return NextResponse.json({
        ...finalContact,
        groups: finalContact?.groups.map((cg) => cg.group) || [],
      });
    }

    return NextResponse.json({
      ...updatedContact,
      groups: updatedContact.groups.map((cg) => cg.group),
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update contact" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if contact exists and belongs to user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Delete contact (this will cascade delete related records)
    await prisma.contact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
