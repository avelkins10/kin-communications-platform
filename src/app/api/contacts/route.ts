import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactSearchSchema, createContactSchema } from "@/lib/validations/contact";
import { ContactType } from "@/types";

// Duplicate phone strategy
// DB-enforced uniqueness on (ownerId, phone) defined in prisma schema.
// Unique violations are mapped to HTTP 409 during create/import.

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") as ContactType | undefined;
    const department = searchParams.get("department") || undefined;
    const isFavorite = searchParams.get("isFavorite") === "true" ? true : undefined;
    const groupId = searchParams.get("groupId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Validate search parameters
    const validatedParams = contactSearchSchema.parse({
      search,
      type,
      department,
      isFavorite,
      groupId,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const skip = (validatedParams.page - 1) * validatedParams.limit;

    // Build where clause
    const where: any = {
      ownerId: session.user.id,
    };

    if (validatedParams.search) {
      where.OR = [
        { firstName: { contains: validatedParams.search, mode: "insensitive" } },
        { lastName: { contains: validatedParams.search, mode: "insensitive" } },
        { phone: { contains: validatedParams.search, mode: "insensitive" } },
        { email: { contains: validatedParams.search, mode: "insensitive" } },
        { organization: { contains: validatedParams.search, mode: "insensitive" } },
      ];
    }

    if (validatedParams.type) {
      where.type = validatedParams.type;
    }

    if (validatedParams.department) {
      where.department = { contains: validatedParams.department, mode: "insensitive" };
    }

    if (validatedParams.isFavorite !== undefined) {
      where.isFavorite = validatedParams.isFavorite;
    }

    if (validatedParams.groupId) {
      where.groups = {
        some: {
          groupId: validatedParams.groupId,
        },
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[validatedParams.sortBy] = validatedParams.sortOrder;

    // Get contacts with pagination
    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where,
        include: {
          groups: {
            include: {
              group: true,
            },
          },
        },
        orderBy,
        skip,
        take: validatedParams.limit,
      }),
      db.contact.count({ where }),
    ]);

    // Transform contacts to include group names
    const transformedContacts = contacts.map((contact) => ({
      ...contact,
      groups: contact.groups.map((cg) => cg.group),
    }));

    return NextResponse.json({
      contacts: transformedContacts,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        pages: Math.ceil(total / validatedParams.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
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
    const validatedData = createContactSchema.parse(body);

    // Create contact
    let contact;
    try {
      contact = await db.contact.create({
        data: {
          ...validatedData,
          ownerId: session.user.id,
          tags: validatedData.tags || [],
        },
        include: {
          groups: {
            include: {
              group: true,
            },
          },
        },
      });
    } catch (e: any) {
      // Map unique constraint error to HTTP 409
      if (e?.code === "P2002") {
        return NextResponse.json(
          { error: "Contact with this phone number already exists" },
          { status: 409 }
        );
      }
      throw e;
    }

    // Add to groups if specified
    if (validatedData.groupIds && validatedData.groupIds.length > 0) {
      await db.contactGroupOnContact.createMany({
        data: validatedData.groupIds.map((groupId) => ({
          contactId: contact.id,
          groupId,
        })),
      });

      // Fetch updated contact with groups
      const updatedContact = await db.contact.findUnique({
        where: { id: contact.id },
        include: {
          groups: {
            include: {
              group: true,
            },
          },
        },
      });

      return NextResponse.json({
        ...updatedContact,
        groups: updatedContact?.groups.map((cg) => cg.group) || [],
      });
    }

    return NextResponse.json({
      ...contact,
      groups: contact.groups.map((cg) => cg.group),
    });
  } catch (error) {
    console.error("Error creating contact:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
