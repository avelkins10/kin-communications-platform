import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactGroupSchema } from "@/lib/validations/contact";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all contact groups with member counts
    const groups = await db.contactGroup.findMany({
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching contact groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = contactGroupSchema.parse(body);

    // Check for duplicate group name
    const existingGroup = await db.contactGroup.findFirst({
      where: {
        name: validatedData.name,
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: "Contact group with this name already exists" },
        { status: 409 }
      );
    }

    // Create contact group
    const group = await db.contactGroup.create({
      data: validatedData,
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error creating contact group:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create contact group" },
      { status: 500 }
    );
  }
}
