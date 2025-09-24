import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { callSearchSchema } from "@/lib/validations/call";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const direction = searchParams.get("direction") as "INBOUND" | "OUTBOUND" | undefined;
    const status = searchParams.get("status") as "PENDING" | "RINGING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "MISSED" | "VOICEMAIL" | undefined;
    const userId = searchParams.get("userId") || undefined;
    const contactId = searchParams.get("contactId") || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Validate search parameters
    const validatedParams = callSearchSchema.parse({
      search,
      direction,
      status,
      userId,
      contactId,
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const skip = (validatedParams.page - 1) * validatedParams.limit;

    // Build where clause
    const where: any = {
      userId: session.user.id, // Only show user's own calls
    };

    if (validatedParams.search) {
      where.OR = [
        { fromNumber: { contains: validatedParams.search, mode: "insensitive" } },
        { toNumber: { contains: validatedParams.search, mode: "insensitive" } },
        { contact: { 
          OR: [
            { firstName: { contains: validatedParams.search, mode: "insensitive" } },
            { lastName: { contains: validatedParams.search, mode: "insensitive" } },
            { organization: { contains: validatedParams.search, mode: "insensitive" } },
          ]
        } },
      ];
    }

    if (validatedParams.direction) {
      where.direction = validatedParams.direction;
    }

    if (validatedParams.status) {
      where.status = validatedParams.status;
    }

    if (validatedParams.contactId) {
      where.contactId = validatedParams.contactId;
    }

    if (validatedParams.dateFrom || validatedParams.dateTo) {
      where.createdAt = {};
      if (validatedParams.dateFrom) {
        where.createdAt.gte = new Date(validatedParams.dateFrom);
      }
      if (validatedParams.dateTo) {
        where.createdAt.lte = new Date(validatedParams.dateTo);
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[validatedParams.sortBy] = validatedParams.sortOrder;

    // Get calls with pagination
    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              organization: true,
              phone: true,
              email: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: validatedParams.limit,
      }),
      prisma.call.count({ where }),
    ]);

    return NextResponse.json({
      calls,
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total,
        pages: Math.ceil(total / validatedParams.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}
