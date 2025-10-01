import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { twilioClient } from "@/lib/twilio/client";
import { quickbaseService } from "@/lib/quickbase/service";
import { cuid } from "@paralleldrive/cuid2";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    const direction = searchParams.get("direction");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build where clause
    const where: any = {};

    if (contactId) {
      where.contactId = contactId;
    }

    if (direction) {
      where.direction = direction;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { body: { contains: search, mode: 'insensitive' } },
        { Contact: { firstName: { contains: search, mode: 'insensitive' } } },
        { Contact: { lastName: { contains: search, mode: 'insensitive' } } },
        { fromNumber: { contains: search } },
        { toNumber: { contains: search } }
      ];
    }

    // Fetch messages with pagination
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          Contact: true,
          User: true,
          PhoneNumber: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.message.count({ where })
    ]);

    return NextResponse.json({
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error in /api/messages GET:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toNumber, fromNumber, messageBody, contactId, templateId } = body;

    // Validate required fields
    if (!toNumber || !messageBody) {
      return NextResponse.json(
        { error: "toNumber and messageBody are required" },
        { status: 400 }
      );
    }

    // Find or validate contact
    let contact = contactId
      ? await prisma.contact.findUnique({ where: { id: contactId } })
      : await prisma.contact.findFirst({ where: { phone: toNumber } });

    if (!contact) {
      // Create contact if it doesn't exist
      contact = await prisma.contact.create({
        data: {
          id: cuid(),
          phone: toNumber,
          firstName: 'Unknown',
          lastName: 'Contact',
          type: 'CUSTOMER'
        }
      });
    }

    // Check opt-out status
    if (contact.tags?.includes('OPT_OUT') || contact.tags?.includes('DO_NOT_CONTACT')) {
      return NextResponse.json(
        { error: "Contact has opted out of messaging" },
        { status: 403 }
      );
    }

    // Get default phone number if not specified
    let senderNumber = fromNumber;
    if (!senderNumber) {
      const defaultPhoneNumber = await prisma.phoneNumber.findFirst({
        where: {
          capabilities: { has: 'sms' },
          isActive: true
        }
      });

      if (!defaultPhoneNumber) {
        return NextResponse.json(
          { error: "No SMS-capable phone number available" },
          { status: 400 }
        );
      }

      senderNumber = defaultPhoneNumber.phoneNumber;
    }

    // Create message record (QUEUED status initially)
    const message = await prisma.message.create({
      data: {
        id: cuid(),
        direction: 'OUTBOUND',
        status: 'QUEUED',
        fromNumber: senderNumber,
        toNumber: toNumber,
        body: messageBody,
        contactId: contact.id,
        userId: session.user.id,
        templateId: templateId || null
      },
      include: {
        Contact: true,
        User: true
      }
    });

    // Send via Twilio
    try {
      const twilioMessage = await twilioClient.messages.create({
        body: messageBody,
        from: senderNumber,
        to: toNumber,
        statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/twilio/message-status`
      });

      // Update message with Twilio SID and status
      await prisma.message.update({
        where: { id: message.id },
        data: {
          twilioMessageSid: twilioMessage.sid,
          status: twilioMessage.status === 'queued' ? 'QUEUED' :
                  twilioMessage.status === 'sent' ? 'SENT' :
                  twilioMessage.status === 'delivered' ? 'DELIVERED' : 'QUEUED',
          sentAt: new Date(),
          numSegments: twilioMessage.numSegments ? parseInt(twilioMessage.numSegments) : 1
        }
      });

      console.log('SMS sent successfully:', twilioMessage.sid);

      // Log to QuickBase if enabled
      if (process.env.QUICKBASE_ENABLED !== 'false') {
        try {
          await quickbaseService.logSMSToQuickbase(
            message as any,
            message.Contact!,
            message.User || undefined
          );
          console.log('Logged outbound SMS to QuickBase:', message.id);
        } catch (qbError) {
          Sentry.captureException(qbError, {
            tags: { component: 'messages-api', action: 'quickbase-logging' },
            extra: { messageId: message.id }
          });
          console.error('Failed to log SMS to QuickBase:', qbError);
        }
      }

      // Increment template usage if template was used
      if (templateId) {
        await prisma.messageTemplate.update({
          where: { id: templateId },
          data: { usageCount: { increment: 1 } }
        });
      }

      return NextResponse.json(message, { status: 201 });
    } catch (twilioError: any) {
      console.error('Twilio SMS error:', twilioError);

      // Update message status to FAILED
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'FAILED',
          errorCode: twilioError.code?.toString(),
          errorMessage: twilioError.message
        }
      });

      Sentry.captureException(twilioError, {
        tags: { component: 'messages-api', action: 'send-sms' },
        extra: { messageId: message.id, toNumber, fromNumber: senderNumber }
      });

      return NextResponse.json(
        { error: "Failed to send SMS", details: twilioError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in /api/messages POST:', error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}