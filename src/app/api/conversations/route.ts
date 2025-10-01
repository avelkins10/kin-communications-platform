import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Mock conversation data for development
const mockConversations = [
  {
    contactId: 'contact-1',
    contact: {
      id: 'contact-1',
      firstName: 'John',
      lastName: 'Smith',
      organization: 'Acme Corp',
      phone: '+1234567890',
      email: 'john@acme.com',
      type: 'customer'
    },
    messageCount: 5,
    unreadCount: 2,
    lastActivityAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    lastMessage: {
      id: 'msg-1',
      body: 'Thanks for the update!',
      direction: 'INBOUND',
      status: 'delivered',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      contactId: 'contact-1'
    }
  },
  {
    contactId: 'contact-2',
    contact: {
      id: 'contact-2',
      firstName: 'Jane',
      lastName: 'Doe',
      organization: 'Tech Solutions',
      phone: '+1987654321',
      email: 'jane@techsolutions.com',
      type: 'prospect'
    },
    messageCount: 3,
    unreadCount: 0,
    lastActivityAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    lastMessage: {
      id: 'msg-2',
      body: 'I\'ll get back to you tomorrow.',
      direction: 'OUTBOUND',
      status: 'sent',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      contactId: 'contact-2'
    }
  },
  {
    contactId: 'contact-3',
    contact: {
      id: 'contact-3',
      firstName: 'Alice',
      lastName: 'Johnson',
      organization: 'Global Inc',
      phone: '+1122334455',
      email: 'alice@global.com',
      type: 'customer'
    },
    messageCount: 8,
    unreadCount: 1,
    lastActivityAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    lastMessage: {
      id: 'msg-3',
      body: 'Can we schedule a call for next week?',
      direction: 'INBOUND',
      status: 'delivered',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      contactId: 'contact-3'
    }
  }
];

// GET /api/conversations - List conversations with message threading
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === 'true';
    const assignedTo = searchParams.get("assignedTo");
    const unassigned = searchParams.get("unassigned") === 'true';
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");

    // Filter conversations based on parameters
    let filteredConversations = mockConversations;

    // For mock data, show all conversations regardless of assignedTo filter
    // In production, you would filter by assignedTo here
    // if (assignedTo) {
    //   filteredConversations = filteredConversations.filter(conv => conv.assignedUserId === assignedTo);
    // }

    if (unassigned) {
      // For mock data, return empty array for unassigned
      filteredConversations = [];
    }

    if (unreadOnly) {
      filteredConversations = filteredConversations.filter(conv => conv.unreadCount > 0);
    }

    // Apply pagination
    const total = filteredConversations.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = filteredConversations.slice(startIndex, endIndex);

    return NextResponse.json({
      conversations: paginatedConversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
