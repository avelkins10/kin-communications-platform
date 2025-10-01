import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTwilioClient } from "@/lib/twilio/client";
import { callContactSchema } from "@/lib/validations/contact";
import { isTestMode, executeIfNotTestMode, generateMockTwilioCallSid, logTestModeActivity } from "@/lib/test-mode";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params since it's now a Promise in Next.js 15
    const { id } = params;

    const body = await request.json();
    const validatedData = callContactSchema.parse({ contactId: id });

    // Check if contact exists and belongs to user
    const contact = await prisma.contact.findFirst({
      where: {
        id,
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
      // Initiate Twilio call (or mock in test mode)
      const twilioCall = await executeIfNotTestMode(
        async () => {
          const twilioClient = getTwilioClient();
          return await twilioClient.calls.create({
            to: contact.phone,
            from: process.env.TWILIO_PHONE_NUMBER!,
            statusCallback: `${process.env.PUBLIC_BASE_URL}/api/webhooks/twilio/status`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            record: true,
            recordingChannels: 'dual',
            recordingStatusCallback: `${process.env.PUBLIC_BASE_URL}/api/webhooks/twilio/recording`,
          });
        },
        {
          sid: generateMockTwilioCallSid(),
          status: 'ringing',
          direction: 'outbound',
          from: process.env.TWILIO_PHONE_NUMBER || '+15551234567',
          to: contact.phone,
          startTime: new Date().toISOString(),
        }
      );

      // Update call record with Twilio CallSid
      await prisma.call.update({
        where: { id: call.id },
        data: {
          twilioCallSid: twilioCall.sid,
          status: "RINGING",
        },
      });

      logTestModeActivity('Twilio', 'Call initiated', {
        contactId: contact.id,
        phone: contact.phone,
        callSid: twilioCall.sid
      });

      console.log(`Initiated call to ${contact.phone} for contact ${contact.firstName} ${contact.lastName}, Twilio CallSid: ${twilioCall.sid}`);

      return NextResponse.json({
        success: true,
        callId: call.id,
        twilioCallSid: twilioCall.sid,
        message: isTestMode() ? "Call initiated successfully (TEST_MODE)" : "Call initiated successfully",
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
