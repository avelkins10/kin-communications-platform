import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTwilioClient } from "@/lib/twilio/client";
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

    // Create call record first
    const call = await prisma.call.create({
      data: {
        direction: "OUTBOUND",
        status: "PENDING",
        fromNumber: process.env.TWILIO_PHONE_NUMBER || "SYSTEM",
        toNumber: contact.phone,
        userId: session.user.id,
        contactId: contact.id,
      },
    });

    try {
      // Initiate Twilio call
      const twilioClient = getTwilioClient();
      const twilioCall = await twilioClient.calls.create({
        to: contact.phone,
        from: process.env.TWILIO_PHONE_NUMBER!,
        statusCallback: `${process.env.PUBLIC_BASE_URL}/api/webhooks/twilio/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        record: true,
        recordingChannels: 'dual',
        recordingStatusCallback: `${process.env.PUBLIC_BASE_URL}/api/webhooks/twilio/recording`,
      });

      // Update call record with Twilio CallSid
      await prisma.call.update({
        where: { id: call.id },
        data: {
          twilioCallSid: twilioCall.sid,
          status: "RINGING",
        },
      });

      console.log(`Initiated call to ${contact.phone} for contact ${contact.firstName} ${contact.lastName}, Twilio CallSid: ${twilioCall.sid}`);

      return NextResponse.json({
        success: true,
        callId: call.id,
        twilioCallSid: twilioCall.sid,
        message: "Call initiated successfully",
      });
    } catch (twilioError) {
      // Update call status to failed if Twilio call creation fails
      await prisma.call.update({
        where: { id: call.id },
        data: {
          status: "FAILED",
          endedAt: new Date(),
        },
      });

      console.error("Twilio call creation failed:", twilioError);
      return NextResponse.json(
        { error: "Failed to initiate call with Twilio" },
        { status: 500 }
      );
    }
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
