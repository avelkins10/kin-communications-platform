import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { twilioClient } from "@/lib/twilio/client";
import { smsContactSchema } from "@/lib/validations/contact";
import { MessageDirection, MessageStatus } from "@prisma/client";
import { normalizePhoneNumber } from "@/lib/utils/phone";

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
    const validatedData = smsContactSchema.parse({ 
      contactId: id,
      message: body.message 
    });

    // Check if contact exists and belongs to user
    const contact = await db.contact.findFirst({
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

    // Normalize phone number to E.164 format
    const normalizedPhone = normalizePhoneNumber(contact.phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Check if Twilio is configured
    if (!process.env.TWILIO_PHONE_NUMBER) {
      return NextResponse.json(
        { error: "Twilio phone number not configured" },
        { status: 500 }
      );
    }

    // Create message record first
    const message = await db.message.create({
      data: {
        direction: MessageDirection.OUTBOUND,
        status: MessageStatus.QUEUED,
        fromNumber: process.env.TWILIO_PHONE_NUMBER,
        toNumber: normalizedPhone,
        body: validatedData.message,
        userId: session.user.id,
        contactId: contact.id,
      },
    });

    try {
      // Send message via Twilio
      const twilioMessage = await twilioClient.messages.create({
        to: normalizedPhone,
        from: process.env.TWILIO_PHONE_NUMBER,
        body: validatedData.message,
        statusCallback: `${process.env.PUBLIC_BASE_URL}/api/webhooks/twilio/message-status`,
        statusCallbackMethod: "POST",
      });

      // Update message with Twilio SID
      const updatedMessage = await db.message.update({
        where: { id: message.id },
        data: {
          twilioMessageSid: twilioMessage.sid,
          conversationSid: twilioMessage.conversationSid,
          numSegments: twilioMessage.numSegments,
          price: twilioMessage.price,
          priceUnit: twilioMessage.priceUnit,
        },
      });

      console.log(`SMS sent to ${contact.phone} for contact ${contact.firstName} ${contact.lastName}: ${validatedData.message}`);
      console.log(`Twilio Message SID: ${twilioMessage.sid}`);

      return NextResponse.json({
        success: true,
        messageId: updatedMessage.id,
        twilioMessageSid: twilioMessage.sid,
        message: "SMS sent successfully",
      });
    } catch (twilioError) {
      // Update message with error status
      await db.message.update({
        where: { id: message.id },
        data: {
          status: MessageStatus.FAILED,
          errorCode: (twilioError as any).code?.toString(),
          errorMessage: (twilioError as any).message,
        },
      });

      console.error("Twilio SMS error:", twilioError);
      return NextResponse.json(
        { 
          error: "Failed to send SMS via Twilio", 
          details: (twilioError as any).message 
        },
        { status: 500 }
      );
    }
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
