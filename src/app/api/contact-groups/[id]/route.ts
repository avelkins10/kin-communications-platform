import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { contactGroupSchema, contactGroupUpdateSchema } from "@/lib/validations/contact";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.contactGroup.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            contact: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Contact group not found" }, { status: 404 });
    }

    // Filter out members where contact is null or not owned by user
    const filteredMembers = group.members.filter(member => 
      member.contact && member.contact.ownerId === session.user.id
    );

    return NextResponse.json({
      ...group,
      members: filteredMembers.map(member => member.contact),
    });
  } catch (error) {
    console.error("Error fetching contact group:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact group" },
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
    const validatedData = contactGroupUpdateSchema.parse(body);
    // Example request body for membership updates:
    // {
    //   "name": "VIP Customers",
    //   "description": "High-value accounts",
    //   "addContactIds": ["contactId1", "contactId2"],
    //   "removeContactIds": ["contactId3"]
    // }

    // Check if group exists
    const existingGroup = await prisma.contactGroup.findUnique({
      where: { id: params.id },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: "Contact group not found" }, { status: 404 });
    }

    // Update basic fields if provided
    if (validatedData.name || validatedData.description !== undefined) {
      // Check for duplicate group name (excluding current group)
      if (validatedData.name) {
        const duplicateGroup = await prisma.contactGroup.findFirst({
          where: {
            name: validatedData.name,
            id: { not: params.id },
          },
        });
        if (duplicateGroup) {
          return NextResponse.json(
            { error: "Contact group with this name already exists" },
            { status: 409 }
          );
        }
      }

      await prisma.contactGroup.update({
        where: { id: params.id },
        data: {
          name: validatedData.name,
          description: validatedData.description,
        },
      });
    }

    // Add members
    if (validatedData.addContactIds && validatedData.addContactIds.length > 0) {
      await prisma.contactGroupOnContact.createMany({
        data: validatedData.addContactIds.map((contactId) => ({
          contactId,
          groupId: params.id,
        })),
        skipDuplicates: true,
      });
    }

    // Remove members
    if (validatedData.removeContactIds && validatedData.removeContactIds.length > 0) {
      await prisma.contactGroupOnContact.deleteMany({
        where: {
          groupId: params.id,
          contactId: { in: validatedData.removeContactIds },
        },
      });
    }

    // Return updated group with counts and resolved members
    const group = await prisma.contactGroup.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            contact: true,
          },
        },
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Contact group not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...group,
      members: group.members.map((m) => m.contact).filter(Boolean),
    });
  } catch (error) {
    console.error("Error updating contact group:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update contact group" },
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

    // Check if group exists
    const existingGroup = await prisma.contactGroup.findUnique({
      where: { id: params.id },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: "Contact group not found" }, { status: 404 });
    }

    // Delete contact group (this will cascade delete group memberships)
    await prisma.contactGroup.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact group:", error);
    return NextResponse.json(
      { error: "Failed to delete contact group" },
      { status: 500 }
    );
  }
}
