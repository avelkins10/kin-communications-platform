import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
    const assigned = searchParams.get("assigned") as "assigned" | "unassigned" | undefined;
    
    // Validate assigned parameter
    if (assigned && !['assigned', 'unassigned'].includes(assigned)) {
      return NextResponse.json({ error: "Invalid assigned parameter. Must be 'assigned' or 'unassigned'" }, { status: 400 });
    }
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const whereClause: any = {};

    // Handle assigned/unassigned filtering
    if (assigned === 'assigned') {
      whereClause.userId = session.user.id;
    } else if (assigned === 'unassigned') {
      whereClause.userId = null;
    } else {
      // Default behavior: filter by current user's calls
      whereClause.userId = session.user.id;
    }

    // Search across contact name and phone numbers
    if (search) {
      whereClause.OR = [
        {
          Contact: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ]
          }
        },
        { fromNumber: { contains: search } },
        { toNumber: { contains: search } },
      ];
    }

    // Filter by direction
    if (direction) {
      whereClause.direction = direction;
    }

    // Filter by status
    if (status) {
      whereClause.status = status;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo);
      }
    }

    // Get total count for pagination
    const startTime = Date.now();
    const total = await prisma.call.count({
      where: whereClause,
    });
    
    // Log slow queries
    const queryTime = Date.now() - startTime;
    if (queryTime > 1000) {
      console.warn(`Slow query in /api/calls: ${queryTime}ms`, { whereClause, total });
    }

    // Fetch calls with related data
    const calls = await prisma.call.findMany({
      where: whereClause,
      include: {
        Contact: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        PhoneNumber: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    // Format the response
    const formattedCalls = calls.map(call => ({
      id: call.id,
      direction: call.direction,
      status: call.status,
      fromNumber: call.fromNumber,
      toNumber: call.toNumber,
      phoneNumber: call.direction === 'INBOUND' ? call.fromNumber : call.toNumber,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      durationSec: call.durationSec,
      recordingUrl: call.recordingUrl,
      recordingSid: call.recordingSid,
      transcription: call.transcription,
      twilioCallSid: call.twilioCallSid,
      createdAt: call.createdAt,
      contact: call.Contact ? {
        id: call.Contact.id,
        firstName: call.Contact.firstName,
        lastName: call.Contact.lastName,
        phone: call.Contact.phone,
        email: call.Contact.email,
        organization: call.Contact.organization,
        type: call.Contact.type,
        quickbaseId: call.Contact.quickbaseId,
      } : null,
      user: call.User ? {
        id: call.User.id,
        name: call.User.name,
        email: call.User.email,
      } : null,
    }));

    // Log query results for debugging
    console.log(`/api/calls query completed: ${formattedCalls.length} results, total: ${total}`, {
      filters: { search, direction, status, assigned, dateFrom, dateTo },
      pagination: { page, limit },
      userId: session.user.id
    });

    return NextResponse.json({
      calls: formattedCalls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error in /api/calls:', error);
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}
