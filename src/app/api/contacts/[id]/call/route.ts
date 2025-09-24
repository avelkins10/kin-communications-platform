import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { callContactSchema } from "@/lib/validations/contact";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = callContactSchema.parse({ contactId: params.id });

    // Check if contact exists and belongs to user
    const contact = await db.contact.findFirst({
      where: {
        id: params.id,
        ownerId: session.user.id,
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (!contact.phone) {
      return NextResponse.json(
        { error: "Contact does not have a phone number" },
        { status: 400 }
      );
    }

    // TODO: Implement actual Twilio call initiation
    // For now, create a placeholder call record
    const call = await db.call.create({
      data: {
        direction: "OUTBOUND",
        status: "PENDING",
        fromNumber: "SYSTEM", // This should be the user's Twilio number
        toNumber: contact.phone,
        userId: session.user.id,
        contactId: contact.id,
      },
    });

    // TODO: Integrate with Twilio Voice SDK
    // This is a stub implementation that will be replaced with actual Twilio integration
    console.log(`Initiating call to ${contact.phone} for contact ${contact.firstName} ${contact.lastName}`);

    return NextResponse.json({
      success: true,
      callId: call.id,
      message: "Call initiation requested (stub implementation)",
      // TODO: Return actual Twilio call SID when implemented
      twilioCallSid: null,
    });
  } catch (error) {
    console.error("Error initiating call:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 }
    );
  }
}
