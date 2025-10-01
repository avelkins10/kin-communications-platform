import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Placeholder SLA endpoints returning dummy data matching UI expectations

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Dummy SLA data
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 60 * 1000);
  return NextResponse.json({
    contactId: params.id,
    voicemailCallback: { type: 'voicemail_callback', status: 'on_time', dueDate: in30, isOverdue: false },
    textResponse: { type: 'text_response', status: 'on_time', dueDate: in30, isOverdue: false },
    missedCallFollowup: { type: 'missed_call_followup', status: 'on_time', dueDate: in30, isOverdue: false },
    hasViolations: false,
    hasApproaching: false,
    totalViolations: 0,
  });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Accept payload but respond with 501 to indicate not implemented
  await request.json().catch(() => ({}));
  return NextResponse.json({ message: 'SLA update not implemented' }, { status: 501 });
}




