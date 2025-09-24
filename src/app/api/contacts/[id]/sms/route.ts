import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { smsContactSchema } from "@/lib/validations/contact";

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
    const validatedData = smsContactSchema.parse({ 
      contactId: params.id,
      message: body.message 
    });

    // Check if contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
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

    // TODO: Implement actual Twilio SMS sending
    // For now, create a placeholder message record
    const message = await prisma.message.create({
      data: {
        direction: "OUTBOUND",
        status: "QUEUED",
        fromNumber: "SYSTEM", // This should be the user's Twilio number
        toNumber: contact.phone,
        body: validatedData.message,
        userId: session.user.id,
        contactId: contact.id,
      },
    });

    // TODO: Integrate with Twilio Messaging API
    // This is a stub implementation that will be replaced with actual Twilio integration
    console.log(`Sending SMS to ${contact.phone} for contact ${contact.firstName} ${contact.lastName}: ${validatedData.message}`);

    return NextResponse.json({
      success: true,
      messageId: message.id,
      message: "SMS queued for sending (stub implementation)",
      // TODO: Return actual Twilio message SID when implemented
      twilioMessageSid: null,
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to send SMS" },
      { status: 500 }
    );
  }
}
