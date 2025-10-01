import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Mock conversation data for development
const mockConversations = {
  'contact-1': [
    {
      id: 'msg-1',
      body: 'Thanks for the update!',
      direction: 'INBOUND',
      status: 'delivered',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      contactId: 'contact-1'
    },
    {
      id: 'msg-2',
      body: 'You\'re welcome! Let me know if you need anything else.',
      direction: 'OUTBOUND',
      status: 'sent',
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
      contactId: 'contact-1'
    }
  ],
  'contact-2': [
    {
      id: 'msg-3',
      body: 'I\'ll get back to you tomorrow.',
      direction: 'OUTBOUND',
      status: 'sent',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      contactId: 'contact-2'
    }
  ],
  'contact-3': [
    {
      id: 'msg-4',
      body: 'Can we schedule a call for next week?',
      direction: 'INBOUND',
      status: 'delivered',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      contactId: 'contact-3'
    }
  ]
};

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = params;
    const { searchParams } = new URL(request.url);
    const markAsRead = searchParams.get("markAsRead") === "true";

    // Get conversation messages for this contact
    const messages = mockConversations[contactId as keyof typeof mockConversations] || [];

    // Mock marking as read
    if (markAsRead) {
      console.log(`Mock: Marking conversation ${contactId} as read`);
    }

    return NextResponse.json({
      contactId,
      messages,
      total: messages.length,
      unreadCount: markAsRead ? 0 : Math.floor(Math.random() * 3) // Random unread count
    });
  } catch (error) {
    console.error('Error in /api/conversations/[contactId]:', error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}