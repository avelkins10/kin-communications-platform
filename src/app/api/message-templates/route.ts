import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  createMessageTemplateSchema,
  messageTemplateSearchSchema,
  type CreateMessageTemplateInput,
  type MessageTemplateSearchInput
} from "@/lib/validations/message";

// GET /api/message-templates - List message templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    // Parse query parameters
    const parsedQuery = messageTemplateSearchSchema.parse({
      ...query,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      isShared: query.isShared === 'true',
    });

    const {
      category,
      search,
      isShared,
      page,
      limit,
      sortBy,
      sortOrder,
    } = parsedQuery;

    // Build where clause
    const where: any = {
      OR: [
        { userId: session.user.id }, // User's own templates
        { isShared: true }, // Shared templates
      ],
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    if (isShared !== undefined) {
      where.isShared = isShared;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [templates, total] = await Promise.all([
      db.messageTemplate.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.messageTemplate.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching message templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch message templates" },
      { status: 500 }
    );
  }
}

// POST /api/message-templates - Create a new message template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMessageTemplateSchema.parse(body);

    // Check if template name already exists for this user
    const existingTemplate = await db.messageTemplate.findFirst({
      where: {
        name: validatedData.name,
        userId: session.user.id,
      },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: "Template name already exists" },
        { status: 409 }
      );
    }

    // Create template
    const template = await db.messageTemplate.create({
      data: {
        ...validatedData,
        userId: session.user.id,
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

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating message template:", error);
    return NextResponse.json(
      { error: "Failed to create message template" },
      { status: 500 }
    );
  }
}
